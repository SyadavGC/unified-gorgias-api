# Unified Gorgias Ticket API

A reusable Vercel serverless function for creating Gorgias tickets with support for multiple form types, file attachments, and flexible configuration.

## Features

✅ **Multi-format Support** - Handles both JSON and multipart/form-data  
✅ **File Attachments** - Optional file upload support (any file type)  
✅ **Form-agnostic** - Works with any form structure via dynamic field mapping  
✅ **CORS Configuration** - Flexible origin control  
✅ **Environment-based Config** - Easy deployment for multiple forms  
✅ **Backward Compatible** - Works with existing implementations  

## Quick Start

### 1. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SyadavGC/unified-gorgias-api)

### 2. Configure Environment Variables

In your Vercel dashboard, add:

```bash
GORGIAS_SUBDOMAIN=guidecraft
GORGIAS_USERNAME=your-email@example.com
GORGIAS_API_KEY=your-api-key
GORGIAS_API_URL=https://guidecraft.gorgias.com/api
ALLOWED_ORIGIN=https://yourdomain.com
GORGIAS_SUPPORT_EMAIL=support@yourdomain.com
```

### 3. Use in Your Forms

```javascript
// JSON format (no files)
const response = await fetch('https://your-api.vercel.app/api/create-ticket', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    formType: 'contact',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    fields: {
      message: 'Hello!'
    }
  })
});

// Multipart format (with files)
const formData = new FormData();
formData.append('formType', 'b2b-form');
formData.append('email', 'contact@company.com');
formData.append('file', fileInput.files[0]);

const response = await fetch('https://your-api.vercel.app/api/create-ticket', {
  method: 'POST',
  body: formData
});
```

## API Documentation

### Endpoint

**POST** `/api/create-ticket`

### Request Formats

#### JSON (No Files)

```json
{
  "formType": "contact",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "fields": {
    "company": "Acme Corp",
    "message": "Interested in your products"
  },
  "tags": ["sales", "priority"],
  "priority": "high"
}
```

#### Multipart (With Files)

```javascript
const formData = new FormData();
formData.append('formType', 'b2b');
formData.append('email', 'contact@company.com');
formData.append('firstName', 'Jane');
formData.append('companyName', 'Tech Inc');
formData.append('file', document.getElementById('fileInput').files[0]);
```

### Response

```json
{
  "success": true,
  "ticketId": 12345,
  "ticketUri": "https://guidecraft.gorgias.com/app/ticket/12345",
  "message": "Ticket created successfully",
  "formType": "contact",
  "file": {
    "name": "document.pdf",
    "size": 524288,
    "uploaded": true
  }
}
```

## Field Mapping

The API automatically recognizes and formats common field variations:

| Your Field Name | Recognized As |
|----------------|---------------|
| `firstName`, `first_name` | First Name |
| `lastName`, `last_name` | Last Name |
| `email` | Email |
| `phone`, `phoneNumber` | Phone |
| `companyName`, `company` | Company Name |
| `message`, `body` | Message |

Custom fields are automatically formatted:
- `space_type` → "Space Type"
- `organization_type` → "Organization Type"

## Supported Form Types

### 1. Playspace Design Form

```javascript
fetch('/api/create-ticket', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    formType: 'playspace-design',
    email: 'customer@example.com',
    first_name: 'John',
    last_name: 'Doe',
    fields: {
      space_type: 'Indoor',
      age_range: '5-12',
      role: 'Architect'
    }
  })
})
```

### 2. B2B Form with File

```javascript
const formData = new FormData();
formData.append('formType', 'b2b-form');
formData.append('email', 'contact@company.com');
formData.append('firstName', 'Jane');
formData.append('companyName', 'Acme Corp');
formData.append('file', fileInput.files[0]);

fetch('/api/create-ticket', {
  method: 'POST',
  body: formData
})
```

### 3. Custom Form

```javascript
fetch('/api/create-ticket', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    formType: 'custom',
    email: 'user@example.com',
    fields: {
      any_field: 'value',
      another_field: 'value'
    }
  })
})
```

## Migration Guide

### From `gorgias-ticket-api` (Playspace)

**Before:**
```javascript
fetch('https://old-api.vercel.app/api/create-ticket', { ... })
```

**After:**
```javascript
fetch('https://unified-api.vercel.app/api/create-ticket', {
  body: JSON.stringify({
    formType: 'playspace-design', // Add this
    ...existingData
  })
})
```

### From `b2b-form` (B2B)

**Before:**
```javascript
fetch('https://b2b.vercel.app/api/submit', { ... })
```

**After:**
```javascript
const formData = new FormData();
formData.append('formType', 'b2b-form'); // Add this
// ... rest of your formData

fetch('https://unified-api.vercel.app/api/create-ticket', {
  body: formData
})
```

## Local Development

```bash
# Clone repository
git clone https://github.com/SyadavGC/unified-gorgias-api.git
cd unified-gorgias-api

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev

# Test endpoint
curl -X POST http://localhost:3000/api/create-ticket \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"Test"}'
```

## Testing

### Test JSON Endpoint

```bash
curl -X POST https://your-api.vercel.app/api/create-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "formType": "test",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "fields": {
      "message": "Test message"
    }
  }'
```

### Test File Upload

```bash
curl -X POST https://your-api.vercel.app/api/create-ticket \
  -F "formType=test" \
  -F "email=test@example.com" \
  -F "firstName=Test" \
  -F "file=@document.pdf"
```

## Troubleshooting

### CORS Errors

**Problem:** `Access to fetch blocked by CORS policy`

**Solution:** Add your domain to `ALLOWED_ORIGIN`:
```bash
ALLOWED_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### File Upload Fails

**Checklist:**
- ✅ File size under 50MB
- ✅ Content-Type is `multipart/form-data`
- ✅ Field name is `file` (or configure custom name)
- ✅ Gorgias credentials have upload permissions

### Missing Fields in Ticket

**Solution:** Check field names match recognized patterns or use `fields` object:
```json
{
  "fields": {
    "your_custom_field": "value"
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GORGIAS_SUBDOMAIN` | ✅ | Your Gorgias subdomain |
| `GORGIAS_USERNAME` | ✅ | API username (email) |
| `GORGIAS_API_KEY` | ✅ | API key from Gorgias |
| `GORGIAS_API_URL` | ✅ | Full API URL |
| `ALLOWED_ORIGIN` | ❌ | Comma-separated allowed origins |
| `GORGIAS_SUPPORT_EMAIL` | ❌ | Default support email |

## Architecture

```
api/
├── create-ticket.js       # Main handler
└── utils/
    ├── cors.js             # CORS handling
    ├── parser.js           # Request parsing
    ├── fileUpload.js       # File uploads
    ├── formatter.js        # Body formatting
    └── validation.js       # Validation
```

## License

MIT License - Free to use and modify

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Vercel deployment logs
3. Open issue on [GitHub](https://github.com/SyadavGC/unified-gorgias-api/issues)

## Contributing

Pull requests welcome! Please:
1. Fork repository
2. Create feature branch
3. Test thoroughly
4. Submit PR with description

---

Made with ❤️ for Guidecraft