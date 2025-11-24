/**
 * Unified Gorgias Ticket Creation API
 * Supports multiple form types with MULTIPLE file attachments
 * 
 * Environment Variables Required:
 * - GORGIAS_SUBDOMAIN
 * - GORGIAS_USERNAME
 * - GORGIAS_API_KEY
 * - GORGIAS_API_URL
 * - ALLOWED_ORIGIN (optional)
 * - GORGIAS_SUPPORT_EMAIL (optional)
 */

import { handleCORS } from './utils/cors.js';
import { parseRequest } from './utils/parser.js';
import { uploadFileToGorgias } from './utils/fileUpload.js';
import { formatTicketBody, generateSubject } from './utils/formatter.js';
import { validateRequiredFields, getBasicAuth } from './utils/validation.js';

export default async function handler(req, res) {
  // Handle CORS
  const corsResult = handleCORS(req, res);
  if (corsResult) return corsResult;

  // Only POST allowed
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== Unified Gorgias API Request Started ===');
    console.log('Content-Type:', req.headers['content-type']);

    // Parse request (handles both JSON and multipart) - NOW RETURNS files ARRAY
    const { fields, files, formType } = await parseRequest(req);
    
    console.log('✓ Parsed form type:', formType);
    console.log('✓ Parsed fields:', Object.keys(fields));
    console.log(`✓ Files: ${files.length} file(s)`);
    files.forEach((f, i) => console.log(`  [${i + 1}] ${f.name} (${f.buffer.length} bytes)`));

    // Validate required fields
    const validation = validateRequiredFields(fields);
    if (!validation.valid) {
      console.error('❌ Validation failed:', validation.missing);
      return res.status(400).json({
        error: 'Missing required fields',
        details: {
          missing: validation.missing,
          received: Object.keys(fields)
        }
      });
    }

    // Get environment variables
    const subdomain = process.env.GORGIAS_SUBDOMAIN;
    const username = process.env.GORGIAS_USERNAME;
    const apiKey = process.env.GORGIAS_API_KEY;
    const apiUrl = process.env.GORGIAS_API_URL || `https://${subdomain}.gorgias.com/api`;
    const supportEmail = process.env.GORGIAS_SUPPORT_EMAIL || 'support@example.com';

    if (!subdomain || !username || !apiKey) {
      console.error('❌ Missing Gorgias credentials');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing Gorgias API credentials'
      });
    }

    const authHeader = getBasicAuth(username, apiKey);

    // Upload ALL files if present
    const uploadedFiles = [];
    if (files && files.length > 0) {
      console.log(`=== Uploading ${files.length} file(s) to Gorgias ===`);
      for (const file of files) {
        try {
          const uploaded = await uploadFileToGorgias(file, subdomain, authHeader);
          uploadedFiles.push(uploaded);
          console.log(`✓ File uploaded: ${uploaded.name}`);
        } catch (uploadError) {
          console.error(`❌ File upload failed for ${file.name}:`, uploadError.message);
          // Continue with other files instead of failing completely
        }
      }
    }

    console.log('=== Creating Gorgias ticket ===');

    // Extract and normalize fields
    const email = fields.email;
    const firstName = fields.firstName || fields.first_name || fields.firstname || '';
    const lastName = fields.lastName || fields.last_name || fields.lastname || '';
    const fullName = `${firstName} ${lastName}`.trim() || email;
    
    // Build subject
    const subject = generateSubject(fields, formType);

    // Format body (both HTML and text) - NOW PASSES uploadedFiles ARRAY
    const { bodyHtml, bodyText } = formatTicketBody(fields, formType, uploadedFiles);

    // Build tags
    let tags = [formType];
    if (fields.tags) {
      if (Array.isArray(fields.tags)) {
        tags = [...tags, ...fields.tags];
      } else if (typeof fields.tags === 'string') {
        tags = [...tags, ...fields.tags.split(',').map(t => t.trim())];
      }
    }
    if (fields.organizationType) {
      tags.push(fields.organizationType);
    }

    // Build ticket payload
    const ticketPayload = {
      channel: 'email',
      via: 'api',
      customer: {
        email: email,
        name: fullName,
        firstname: firstName,
        lastname: lastName
      },
      subject: subject,
      messages: [
        {
          source: {
            type: 'email',
            to: [{ address: supportEmail }],
            from: { address: email, name: fullName }
          },
          body_text: bodyText,
          body_html: bodyHtml,
          channel: 'email',
          from_agent: false,
          via: 'api',
          public: true
        }
      ],
      priority: fields.priority || 'normal',
      status: fields.status || 'open',
      tags: tags.map(t => ({ name: t })),
      spam: false
    };

    // Add ALL attachments if files were uploaded
    if (uploadedFiles.length > 0) {
      ticketPayload.messages[0].attachments = uploadedFiles.map(file => ({
        url: file.url,
        name: file.name,
        size: file.size,
        content_type: file.content_type
      }));
      console.log(`✓ Added ${uploadedFiles.length} attachment(s) to ticket`);
    }

    console.log('✓ Ticket payload prepared');

    // Create ticket
    let ticketResponse;
    try {
      const response = await fetch(`${apiUrl}/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketPayload)
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('❌ Gorgias API error:', response.status, responseText);
        return res.status(502).json({
          error: 'Gorgias API failed',
          status: response.status,
          details: responseText
        });
      }

      ticketResponse = JSON.parse(responseText);
      console.log(`✅ Ticket created: #${ticketResponse.id}`);

    } catch (ticketError) {
      console.error('❌ Ticket creation error:', ticketError.message);
      return res.status(500).json({
        error: 'Ticket creation failed',
        details: ticketError.message
      });
    }

    console.log('=== ✅ Request completed successfully ===\n');

    // Return success response
    return res.status(200).json({
      success: true,
      ticketId: ticketResponse.id,
      ticketUri: ticketResponse.uri || `https://${subdomain}.gorgias.com/app/ticket/${ticketResponse.id}`,
      message: 'Ticket created successfully',
      formType: formType,
      files: uploadedFiles.map(f => ({
        name: f.name,
        size: f.size,
        uploaded: true
      }))
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error.stack);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

// Vercel configuration
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb'
  }
};