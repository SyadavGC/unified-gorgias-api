/**
 * File upload utility for Gorgias
 */

import FormData from 'form-data';
import { Readable } from 'stream';
import axios from 'axios';

export async function uploadFileToGorgias(file, subdomain, authHeader) {
  if (!file || !file.buffer) {
    throw new Error('Invalid file object');
  }

  try {
    // Create readable stream from buffer
    const fileStream = Readable.from([file.buffer]);

    // Create FormData
    const uploadForm = new FormData();
    uploadForm.append('file', fileStream, {
      filename: file.name,
      contentType: file.contentType
    });

    // Upload to Gorgias
    const uploadResponse = await axios.post(
      `https://${subdomain}.gorgias.com/api/upload?type=attachment`,
      uploadForm,
      {
        headers: {
          'Authorization': authHeader,
          ...uploadForm.getHeaders()
        },
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    // Handle response (can be array or object)
    const uploadedFile = Array.isArray(uploadResponse.data)
      ? uploadResponse.data[0]
      : uploadResponse.data;

    if (!uploadedFile || !uploadedFile.url) {
      throw new Error('Upload response missing file URL');
    }

    return uploadedFile;

  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    throw new Error(`File upload failed: ${errorMsg}`);
  }
}