const crypto = require('crypto');

const BASE_URL = 'https://api.clickpesa.com/third-parties';

let cachedToken = null;
let tokenExpiresAt = 0;

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

function normalizePhoneNumber(phone) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = '255' + digits.slice(1);
  } else if (digits.length === 9) {
    digits = '255' + digits;
  }
  return digits;
}

async function safeParse(response) {
  const text = await response.text();
  try {
    return { data: JSON.parse(text), rawText: text };
  } catch (e) {
    return { data: null, rawText: text };
  }
}

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch(`${BASE_URL}/generate-token`, {
    method: 'POST',
    headers: {
      'client-id': process.env.CLICKPESA_CLIENT_ID,
      'api-key': process.env.CLICKPESA_API_KEY,
    },
  });

  const { data, rawText } = await safeParse(response);

  if (!response.ok || !data || !data.token) {
    throw new Error(`[TOKEN STEP] status=${response.status} body=${rawText.slice(0, 200)}`);
  }

  cachedToken = data.token;
  tokenExpiresAt = Date.now() + 50 * 60 * 1000;

  return cachedToken;
}

async function initiateUssdPush({ amount, orderReference, phoneNumber }) {
  const token = await getToken();

  const payload = {
    amount: String(amount),
    currency: 'TZS',
    orderReference,
    phoneNumber: normalizePhoneNumber(phoneNumber),
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

  const { data, rawText } = await safeParse(response);

  if (!response.ok || !data) {
    throw new Error(`[PUSH STEP] status=${response.status} body=${rawText.slice(0, 300)}`);
  }

  return data;
}

module.exports = { getToken, createChecksum, initiateUssdPush, canonicalize };
