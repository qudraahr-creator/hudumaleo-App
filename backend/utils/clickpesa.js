const crypto = require('crypto');

const BASE_URL = 'https://api.clickpesa.com/third-parties';

let cachedToken = null;
let tokenExpiresAt = 0;

// Canonicalize object (sort keys recursively) - inahitajika kwa checksum sahihi
function canonicalize(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(canonicalize);
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = canonicalize(obj[key]);
      return acc;
    }, {});
}

function createChecksum(payload) {
  const canonicalPayload = canonicalize(payload);
  const payloadString = JSON.stringify(canonicalPayload);
  const hmac = crypto.createHmac('sha256', process.env.CLICKPESA_API_KEY);
  hmac.update(payloadString);
  return hmac.digest('hex');
}

async function getToken() {
  // Tumia token iliyohifadhiwa kama bado ina uhai (chini ya dakika 50 zilizopita)
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch(`${BASE_URL}/generate-token`, {
    method: 'GET',
    headers: {
      'client-id': process.env.CLICKPESA_CLIENT_ID,
      'api-key': process.env.CLICKPESA_API_KEY,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ClickPesa token error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  cachedToken = data.token || data.access_token;
  tokenExpiresAt = Date.now() + 50 * 60 * 1000; // dakika 50

  return cachedToken;
}

async function initiateUssdPush({ amount, orderReference, phoneNumber }) {
  const token = await getToken();

  const payload = {
    amount: String(amount),
    currency: 'TZS',
    orderReference,
    phoneNumber,
  };
  const checksum = createChecksum(payload);

  const response = await fetch(`${BASE_URL}/payments/initiate-ussd-push-request`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...payload, checksum }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `ClickPesa payment error (${response.status})`);
  }

  return data;
}

module.exports = { getToken, createChecksum, initiateUssdPush, canonicalize };
