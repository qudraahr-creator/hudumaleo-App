const pool = require('../config/db');
const { sendPushNotification } = require('../utils/pushNotifications');

// POST /api/bookings  (customer creates a booking)
exports.createBooking = async (req, res) => {
  const { provider_id, service_id, scheduled_at, location_id, notes, price_agreed } = req.body;
  if (!provider_id || !service_id) {
    return res.status(400).json({ error: 'provider_id na service_id ni lazima.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bookings (customer_id, provider_id, service_id, scheduled_at, location_id, notes, price_agreed)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, provider_id, service_id, scheduled_at || null, location_id || null, notes || null, price_agreed || null]
    );
    const booking = result.rows[0];

    // Tuma notification kwa provider
    try {
      const providerRes = await pool.query(
        `SELECT u.push_token, u.full_name AS provider_name, s.name AS service_name, cu.full_name AS customer_name
         FROM providers p
         JOIN users u ON u.id = p.user_id
         JOIN services s ON s.id = $2
         JOIN users cu ON cu.id = $3
         WHERE p.id = $1`,
        [provider_id, service_id, req.user.id]
      );
      if (providerRes.rows.length > 0) {
        const { push_token, customer_name, service_name } = providerRes.rows[0];
        await sendPushNotification(
          push_token,
          'Booking Mpya! 🔔',
          `${customer_name} anahitaji ${service_name}`,
          { type: 'new_booking', booking_id: booking.id }
        );
      }
    } catch (notifErr) {
      console.error('Notification error (createBooking):', notifErr.message);
    }

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error kutengeneza booking.' });
  }
};

// GET /api/bookings/mine (works for both customer & provider based on role)
exports.myBookings = async (req, res) => {
  try {
    let result;
    if (req.user.role === 'provider') {
      const providerRes = await pool.query('SELECT id FROM providers WHERE user_id = $1', [req.user.id]);
      const providerId = providerRes.rows[0]?.id;
      result = await pool.query(
        `SELECT b.*, s.name AS service_name, u.full_name AS customer_name, u.phone AS customer_phone
         FROM bookings b
         JOIN services s ON s.id = b.service_id
         JOIN users u ON u.id = b.customer_id
         WHERE b.provider_id = $1 ORDER BY b.created_at DESC`,
        [providerId]
      );
    } else {
      result = await pool.query(
        `SELECT b.*, s.name AS service_name, u.full_name AS provider_name,
                EXISTS(SELECT 1 FROM reviews r WHERE r.booking_id = b.id) AS has_review
         FROM bookings b
         JOIN services s ON s.id = b.service_id
         JOIN providers p ON p.id = b.provider_id
         JOIN users u ON u.id = p.user_id
         WHERE b.customer_id = $1 ORDER BY b.created_at DESC`,
        [req.user.id]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const STATUS_MESSAGES = {
  accepted: { title: 'Booking Imekubaliwa ✅', body: 'Fundi amekubali ombi lako la' },
  rejected: { title: 'Booking Imekataliwa ❌', body: 'Fundi amekataa ombi lako la' },
  in_progress: { title: 'Kazi Imeanza 🔧', body: 'Fundi ameanza kazi ya' },
  completed: { title: 'Kazi Imekamilika 🎉', body: 'Fundi amemaliza kazi ya' },
  cancelled: { title: 'Booking Imeghairiwa', body: 'Booking ya' },
};

// PATCH /api/bookings/:id/status  { status_code }  -> accept/reject/complete/cancel
exports.updateBookingStatus = async (req, res) => {
  const { status_code } = req.body;
  const validStatuses = ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status_code)) {
    return res.status(400).json({ error: 'status_code si sahihi.' });
  }

  try {
    const result = await pool.query(
      `UPDATE bookings SET status_code = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status_code, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking haikupatikana.' });
    const booking = result.rows[0];

    // Tuma notification kwa customer
    try {
      const customerRes = await pool.query(
        `SELECT u.push_token, s.name AS service_name
         FROM bookings b
         JOIN users u ON u.id = b.customer_id
         JOIN services s ON s.id = b.service_id
         WHERE b.id = $1`,
        [booking.id]
      );
      if (customerRes.rows.length > 0 && STATUS_MESSAGES[status_code]) {
        const { push_token, service_name } = customerRes.rows[0];
        const msg = STATUS_MESSAGES[status_code];
        await sendPushNotification(
          push_token,
          msg.title,
          `${msg.body} ${service_name}`,
          { type: 'booking_status', booking_id: booking.id, status: status_code }
        );
      }
    } catch (notifErr) {
      console.error('Notification error (updateBookingStatus):', notifErr.message);
    }

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};
