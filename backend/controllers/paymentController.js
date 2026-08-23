const pool = require('../config/db');
const { initiateUssdPush, createChecksum } = require('../utils/clickpesa');
const { sendPushNotification } = require('../utils/pushNotifications');

// POST /api/payments/initiate  { booking_id, phone_number, amount }
exports.initiatePayment = async (req, res) => {
  const { booking_id, phone_number, amount } = req.body;
  if (!booking_id || !phone_number || !amount) {
    return res.status(400).json({ error: 'booking_id, phone_number na amount ni lazima.' });
  }

  try {
    // Hakikisha booking ni ya customer huyu
    const bookingRes = await pool.query(
      `SELECT id, customer_id FROM bookings WHERE id = $1`,
      [booking_id]
    );
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Booking haikupatikana.' });
    }
    if (bookingRes.rows[0].customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Huna ruhusa kulipia booking hii.' });
    }

    const orderReference = `HL-${booking_id.slice(0, 8)}-${Date.now()}`;

    // Tengeneza rekodi ya malipo hali ya "pending"
    const paymentRes = await pool.query(
      `INSERT INTO payments (booking_id, amount, method, status, transaction_ref)
       VALUES ($1, $2, 'mpesa', 'pending', $3) RETURNING *`,
      [booking_id, amount, orderReference]
    );

    // Tuma ombi la USSD Push kwa ClickPesa
    const clickpesaResponse = await initiateUssdPush({
      amount,
      orderReference,
      phoneNumber: phone_number,
    });

    res.status(201).json({
      payment: paymentRes.rows[0],
      clickpesa: clickpesaResponse,
      message: 'Ombi la malipo limetumwa. Angalia simu yako kuweka PIN.',
    });
  } catch (err) {
    console.error('Payment initiate error:', err.message);
    res.status(500).json({ error: 'Imeshindwa kuanzisha malipo. Jaribu tena.' });
  }
};

// GET /api/payments/:bookingId/status
exports.getPaymentStatus = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.bookingId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hakuna malipo kwa booking hii.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/payments/webhook  (ClickPesa inatuma taarifa hapa)
exports.webhook = async (req, res) => {
  try {
    const receivedChecksum = req.body.checksum;
    const payloadForValidation = { ...req.body };
    delete payloadForValidation.checksum;
    delete payloadForValidation.checksumMethod;

    const computedChecksum = createChecksum(payloadForValidation);
    if (computedChecksum !== receivedChecksum) {
      console.error('Webhook checksum mismatch - possible tampering');
      return res.status(401).json({ error: 'Invalid checksum.' });
    }

    const { orderReference, status } = req.body;
    if (!orderReference) {
      return res.status(400).json({ error: 'orderReference ni lazima.' });
    }

    let newStatus = 'pending';
    if (status === 'SUCCESS' || status === 'COMPLETED') newStatus = 'completed';
    else if (status === 'FAILED' || status === 'REJECTED') newStatus = 'failed';

    const paymentRes = await pool.query(
      `UPDATE payments SET status = $1 WHERE transaction_ref = $2 RETURNING *`,
      [newStatus, orderReference]
    );

    if (paymentRes.rows.length > 0 && newStatus === 'completed') {
      const payment = paymentRes.rows[0];

      // Tuma notification kwa customer
      const bookingInfo = await pool.query(
        `SELECT u.push_token, u.id AS customer_id
         FROM bookings b JOIN users u ON u.id = b.customer_id
         WHERE b.id = $1`,
        [payment.booking_id]
      );
      if (bookingInfo.rows.length > 0) {
        await sendPushNotification(
          bookingInfo.rows[0].push_token,
          'Malipo Yamefanikiwa ✅',
          'Malipo yako yamepokelewa kikamilifu.',
          { type: 'payment_success', booking_id: payment.booking_id }
        );
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};
