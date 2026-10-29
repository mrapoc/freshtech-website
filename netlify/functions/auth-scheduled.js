// Netlify Serverless Function for scheduled posts authentication
// Password is checked SERVER-SIDE only. Never exposed to the client.
//
// Environment variable: SCHEDULED_PASSWORD (NOT VITE_ prefixed)
// Set this in the Netlify dashboard under Site Settings > Environment Variables.

const crypto = require('crypto');

// Shared secret for HMAC token signing — derived from the password itself
// so we don't need a separate secret env var.
function getSigningKey() {
  const password = process.env.SCHEDULED_PASSWORD || '';
  return crypto.createHash('sha256').update(`ft-scheduled-signing-${password}`).digest();
}

// Create a time-limited token (24 hours)
function createToken() {
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payload = JSON.stringify({ expires });
  const key = getSigningKey();
  const hmac = crypto.createHmac('sha256', key).update(payload).digest('hex');
  // Token = base64(payload).signature
  const encoded = Buffer.from(payload).toString('base64');
  return `${encoded}.${hmac}`;
}

// Verify a token is valid and not expired
function verifyToken(token) {
  if (!token || !token.includes('.')) return false;
  const [encoded, signature] = token.split('.');
  try {
    const payload = Buffer.from(encoded, 'base64').toString('utf8');
    const key = getSigningKey();
    const expectedSig = crypto.createHmac('sha256', key).update(payload).digest('hex');
    // Timing-safe comparison
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return false;
    }
    const data = JSON.parse(payload);
    return data.expires > Date.now();
  } catch {
    return false;
  }
}

exports.handler = async (event) => {
  // CORS
  const allowedOrigins = [
    'https://fresh-tech.uk',
    'https://www.fresh-tech.uk',
    'http://localhost:5173'
  ];
  const origin = event.headers.origin || event.headers.Origin || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { action } = body;

    // Action: login — validate password and return token
    if (action === 'login') {
      const serverPassword = process.env.SCHEDULED_PASSWORD;
      if (!serverPassword) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'SCHEDULED_PASSWORD not configured on server' })
        };
      }

      const { password } = body;
      if (!password || typeof password !== 'string') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Password is required' })
        };
      }

      // Timing-safe comparison to prevent timing attacks
      const a = Buffer.from(password);
      const b = Buffer.from(serverPassword);
      const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

      if (!valid) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Incorrect password' })
        };
      }

      const token = createToken();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, token })
      };
    }

    // Action: verify — check if an existing token is still valid
    if (action === 'verify') {
      const { token } = body;
      const valid = verifyToken(token);
      return {
        statusCode: valid ? 200 : 401,
        headers,
        body: JSON.stringify({ valid })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action. Use "login" or "verify".' })
    };

  } catch (error) {
    console.error('auth-scheduled error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
