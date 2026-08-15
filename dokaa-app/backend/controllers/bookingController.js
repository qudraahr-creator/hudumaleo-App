const pool = require('../config/db');

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
    res.status(201).json(result.rows[0]);
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
        `SELECT b.*, s.name AS service_name, u.full_name AS provider_name
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
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};
