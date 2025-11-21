/**
 * Request parser - handles both JSON and multipart/form-data
 */

export async function parseRequest(req) {
  const contentType = req.headers['content-type'] || '';

  // Check if multipart
  if (contentType.includes('multipart/form-data')) {
    return await parseMultipartForm(req);
  }

  // Otherwise parse as JSON
  return await parseJSON(req);
}

/**
 * Parse JSON request body
 */
async function parseJSON(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const data = JSON.parse(buffer.toString('utf8'));
        
        // Extract formType
        const formType = data.formType || detectFormType(data);
        
        // Flatten structure if needed
        const fields = {
          ...data,
          ...(data.fields || {})
        };
        
        resolve({
          fields,
          file: null,
          formType
        });
      } catch (error) {
        reject(new Error(`JSON parse error: ${error.message}`));
      }
    });

    req.on('error', reject);
  });
}

/**
 * Parse multipart/form-data request
 */
async function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const contentType = req.headers['content-type'];
        const boundaryMatch = contentType.match(/boundary=([^;]+)/);

        if (!boundaryMatch) {
          return resolve({ fields: {}, file: null, formType: 'unknown' });
        }

        const boundary = boundaryMatch[1];
        const boundaryBuffer = Buffer.from(`--${boundary}`);

        // Split by boundary
        const parts = [];
        let currentPos = 0;

        while (true) {
          const index = buffer.indexOf(boundaryBuffer, currentPos);
          if (index === -1) break;
          if (currentPos !== 0) {
            parts.push(buffer.slice(currentPos, index));
          }
          currentPos = index + boundaryBuffer.length;
        }

        const fields = {};
        let file = null;

        // Parse each part
        parts.forEach((part) => {
          const headerEndIndex = part.indexOf('\r\n\r\n');
          if (headerEndIndex === -1) return;

          const headerSection = part.slice(0, headerEndIndex).toString('utf8');
          const content = part.slice(headerEndIndex + 4);
          const contentData = content.slice(0, -2); // Remove trailing CRLF

          // Parse headers
          const nameMatch = headerSection.match(/name="([^"]+)"/);
          const filenameMatch = headerSection.match(/filename="([^"]+)"/);
          const contentTypeMatch = headerSection.match(/Content-Type:\s*([^\r\n]+)/i);

          if (filenameMatch && nameMatch) {
            // This is a file
            const fieldName = nameMatch[1];
            // Accept 'file', 'companyDocument', or any file field
            if (!file || fieldName === 'file' || fieldName === 'companyDocument') {
              file = {
                name: filenameMatch[1],
                buffer: contentData,
                contentType: contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream'
              };
            }
          } else if (nameMatch && !filenameMatch) {
            // Regular field
            const fieldName = nameMatch[1];
            const fieldValue = contentData.toString('utf8').trim();
            fields[fieldName] = fieldValue;
          }
        });

        const formType = fields.formType || detectFormType(fields, !!file);

        resolve({ fields, file, formType });
      } catch (error) {
        reject(new Error(`Multipart parse error: ${error.message}`));
      }
    });

    req.on('error', reject);
  });
}

/**
 * Auto-detect form type based on fields
 */
function detectFormType(data, hasFile = false) {
  // Check explicit formType
  if (data.formType) return data.formType;

  // B2B form indicators
  if (hasFile || data.companyName || data.organizationType || data.companyDocument) {
    return 'b2b-form';
  }

  // Playspace form indicators
  if (data.space_type || data.age_range || data.role) {
    return 'playspace-design';
  }

  // Generic form
  return 'form-submission';
}