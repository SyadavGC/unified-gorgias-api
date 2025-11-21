/**
 * Ticket body formatting utilities
 */

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convert field key to human-readable label
 */
function humanLabel(key) {
  const cleaned = key
    .replace(/\[[^\]]+\]/g, '') // remove brackets
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .trim();

  // Title case
  return cleaned
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Format ticket body (HTML and text versions)
 */
export function formatTicketBody(fields, formType, uploadedFile = null) {
  const excludeFields = [
    'email', 'formType', 'tags', 'priority', 'status', 'subject',
    'body', 'message', 'comments', 'file', 'companyDocument'
  ];

  // Build HTML version
  let bodyHtml = '<div style="font-family: Arial, sans-serif; font-size: 14px; color: #222;">';
  bodyHtml += `<h2 style="color: #21808D; margin-bottom: 16px;">Form Submission - ${escapeHtml(formType)}</h2>`;

  // Personal/Contact Information
  const firstName = fields.firstName || fields.first_name || fields.firstname || '';
  const lastName = fields.lastName || fields.last_name || fields.lastname || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const email = fields.email || '';
  const phone = fields.phone || fields.phoneNumber || fields.phone_number || '';
  const countryCode = fields.countryCode || '';
  const phoneDisplay = countryCode ? `${countryCode}${phone}` : phone;

  if (fullName || email || phoneDisplay) {
    bodyHtml += '<h3 style="color: #134252; margin-top: 20px; margin-bottom: 10px;">Contact Information</h3>';
    if (fullName) bodyHtml += `<p><strong>Name:</strong> ${escapeHtml(fullName)}</p>`;
    if (email) bodyHtml += `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`;
    if (phoneDisplay) bodyHtml += `<p><strong>Phone:</strong> ${escapeHtml(phoneDisplay)}</p>`;
  }

  // Business Information (for B2B)
  const companyName = fields.companyName || fields.company_name || fields.company || '';
  const organizationType = fields.organizationType || fields.organization_type || '';
  const city = fields.city || '';
  const state = fields.state || '';
  const country = fields.country || '';
  const postalCode = fields.postalCode || fields.postal_code || '';

  if (companyName || organizationType || city || state || country) {
    bodyHtml += '<h3 style="color: #134252; margin-top: 20px; margin-bottom: 10px;">Business Information</h3>';
    if (companyName) bodyHtml += `<p><strong>Company:</strong> ${escapeHtml(companyName)}</p>`;
    if (organizationType) bodyHtml += `<p><strong>Organization Type:</strong> ${escapeHtml(organizationType)}</p>`;
    if (city) bodyHtml += `<p><strong>City:</strong> ${escapeHtml(city)}</p>`;
    if (state) bodyHtml += `<p><strong>State:</strong> ${escapeHtml(state)}</p>`;
    if (country) bodyHtml += `<p><strong>Country:</strong> ${escapeHtml(country)}</p>`;
    if (postalCode) bodyHtml += `<p><strong>Postal Code:</strong> ${escapeHtml(postalCode)}</p>`;
  }

  // Other fields
  const otherFields = Object.entries(fields).filter(([key]) => {
    const lowerKey = key.toLowerCase();
    return !excludeFields.includes(key) &&
           !lowerKey.includes('name') &&
           !lowerKey.includes('email') &&
           !lowerKey.includes('phone') &&
           !lowerKey.includes('company') &&
           !lowerKey.includes('organization') &&
           !lowerKey.includes('city') &&
           !lowerKey.includes('state') &&
           !lowerKey.includes('country') &&
           !lowerKey.includes('postal');
  });

  if (otherFields.length > 0) {
    bodyHtml += '<h3 style="color: #134252; margin-top: 20px; margin-bottom: 10px;">Additional Details</h3>';
    otherFields.forEach(([key, value]) => {
      let label = humanLabel(key);
      const strValue = String(value || '').trim();
      
      // Special handling for role field
      if (key.toLowerCase().includes('role') && /^Other\s*[\u2013-–—]\s*/i.test(strValue)) {
        label = 'Role (Other)';
      }
      
      bodyHtml += `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(strValue)}</p>`;
    });
  }

  // Message/Body
  const message = fields.message || fields.body || fields.comments || '';
  if (message) {
    bodyHtml += '<h3 style="color: #134252; margin-top: 20px; margin-bottom: 10px;">Message</h3>';
    bodyHtml += `<div style="white-space: pre-wrap; background: #f5f5f5; padding: 12px; border-radius: 4px;">${escapeHtml(message)}</div>`;
  }

  // Attachment
  if (uploadedFile) {
    bodyHtml += '<h3 style="color: #134252; margin-top: 20px; margin-bottom: 10px;">Attached File</h3>';
    bodyHtml += `<p><a href="${escapeHtml(uploadedFile.url)}" style="color: #21808D; text-decoration: none;">📥 Download ${escapeHtml(uploadedFile.name)}</a></p>`;
  }

  bodyHtml += '</div>';

  // Build plain text version
  let bodyText = `FORM SUBMISSION - ${formType.toUpperCase()}\n\n`;

  if (fullName || email || phoneDisplay) {
    bodyText += 'CONTACT INFORMATION\n';
    if (fullName) bodyText += `Name: ${fullName}\n`;
    if (email) bodyText += `Email: ${email}\n`;
    if (phoneDisplay) bodyText += `Phone: ${phoneDisplay}\n`;
    bodyText += '\n';
  }

  if (companyName || organizationType || city) {
    bodyText += 'BUSINESS INFORMATION\n';
    if (companyName) bodyText += `Company: ${companyName}\n`;
    if (organizationType) bodyText += `Organization Type: ${organizationType}\n`;
    if (city) bodyText += `City: ${city}\n`;
    if (state) bodyText += `State: ${state}\n`;
    if (country) bodyText += `Country: ${country}\n`;
    if (postalCode) bodyText += `Postal Code: ${postalCode}\n`;
    bodyText += '\n';
  }

  if (otherFields.length > 0) {
    bodyText += 'ADDITIONAL DETAILS\n';
    otherFields.forEach(([key, value]) => {
      bodyText += `${humanLabel(key)}: ${value}\n`;
    });
    bodyText += '\n';
  }

  if (message) {
    bodyText += 'MESSAGE\n';
    bodyText += `${message}\n\n`;
  }

  if (uploadedFile) {
    bodyText += 'ATTACHED FILE\n';
    bodyText += `${uploadedFile.name}\n`;
    bodyText += `Download: ${uploadedFile.url}\n`;
  }

  return { bodyHtml, bodyText };
}

/**
 * Generate ticket subject
 */
export function generateSubject(fields, formType) {
  // Check for explicit subject
  if (fields.subject) {
    return fields.subject;
  }

  // Generate based on form type
  const firstName = fields.firstName || fields.first_name || fields.firstname || '';
  const lastName = fields.lastName || fields.last_name || fields.lastname || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const companyName = fields.companyName || fields.company_name || '';

  switch (formType) {
    case 'b2b-form':
      return `B2B Form Submission${companyName ? ` - ${companyName}` : ''}${fullName ? ` (${fullName})` : ''}`;
    
    case 'playspace-design':
      return `Playspace Design Service Request${fullName ? ` - ${fullName}` : ''}`;
    
    default:
      return `Form Submission${fullName ? ` - ${fullName}` : ''}${companyName ? ` (${companyName})` : ''}`;
  }
}