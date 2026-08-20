// Tuma push notification kwa mtumiaji mmoja kwa kutumia Expo Push API
async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
    console.log('Push token si sahihi au haipo, sikipita:', pushToken);
    return;
  }

  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    const result = await response.json();
    console.log('Push notification result:', JSON.stringify(result));
    return result;
  } catch (err) {
    console.error('Push notification error:', err.message);
  }
}

module.exports = { sendPushNotification };
