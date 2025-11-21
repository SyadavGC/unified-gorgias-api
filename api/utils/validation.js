/**
 * Validation utilities
 */

/**
 * Validate required fields
 */
export function validateRequiredFields(fields) {
  const required = ['email'];
  const missing = [];

  for (const field of required) {
    if (!fields[field] || String(fields[field]).trim() === '') {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Create Basic Auth header
 */
export function getBasicAuth(username, apiKey) {
  const credentials = `${username}:${apiKey}`;
  const encoded = Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
}