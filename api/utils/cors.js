/**
 * CORS handling utility
 */

export function handleCORS(req, res) {
  const origin = req.headers.origin || '';
  const allowedOriginsEnv = process.env.ALLOWED_ORIGIN || '';
  const allowedOrigins = allowedOriginsEnv 
    ? allowedOriginsEnv.split(',').map(s => s.trim()) 
    : [];

  const setCorsHeaders = (allowedOrigin) => {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  };

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    if (allowedOrigins.length > 0) {
      if (origin && allowedOrigins.includes(origin)) {
        setCorsHeaders(origin);
        return res.status(204).end();
      } else {
        return res.status(403).json({ error: 'CORS origin denied' });
      }
    } else {
      setCorsHeaders(origin || '*');
      return res.status(204).end();
    }
  }

  // Set CORS for actual request
  if (allowedOrigins.length > 0) {
    if (origin && allowedOrigins.includes(origin)) {
      setCorsHeaders(origin);
    } else {
      return res.status(403).json({ error: 'Forbidden origin' });
    }
  } else {
    setCorsHeaders(origin || '*');
  }

  return null; // Continue processing
}

export function isOriginAllowed(origin, allowedOrigins) {
  if (!allowedOrigins || allowedOrigins.length === 0) return true;
  return allowedOrigins.includes(origin);
}