const pool = require('../config/db');

// GET /api/messages/:bookingId  (historia ya ujumbe kwa booking fulani)
exports.getMessages = async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Hakikisha booking ipo na mtumiaji huyu ana ruhusa (ni customer au provider wa booking hii)
    const bookingRes = await pool.query(
      `SELECT b.customer_id, p.user_id AS provider_user_id
       FROM bookings b
       JOIN providers p ON p.id = b.provider_id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Booking haikupatikana.' });
    }

    const { customer_id, provider_user_id } = bookingRes.rows[0];
    if (req.user.id !== customer_id && req.user.id !== provider_user_id) {
      return res.status(403).json({ error: 'Huna ruhusa kuona ujumbe huu.' });
    }

    const messages = await pool.query(
      `SELECT m.*, u.full_name AS sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.booking_id = $1
       ORDER BY m.created_at ASC`,
      [bookingId]
    );

    // Weka ujumbe kama umesomwa (kwa ujumbe usiotoka kwa mtumiaji huyu)
    await pool.query(
      `UPDATE messages SET is_read = TRUE WHERE booking_id = $1 AND sender_id != $2`,
      [bookingId, req.user.id]
    );

    res.json(messages.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};
