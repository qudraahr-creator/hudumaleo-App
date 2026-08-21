const pool = require('../config/db');

// GET /api/admin/providers?status=pending
exports.listProviders = async (req, res) => {
  const { status } = req.query;
  try {
    let query = `
      SELECT p.id, p.bio, p.experience_years, p.verification_status, p.avg_rating,
             p.total_reviews, p.created_at,
             u.full_name, u.phone, u.email
      FROM providers p
      JOIN users u ON u.id = p.user_id
    `;
    const params = [];
    if (status) {
      query += ` WHERE p.verification_status = $1`;
      params.push(status);
    }
    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// PATCH /api/admin/providers/:id/verify
exports.verifyProvider = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE providers SET verification_status = 'verified', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Provider haikupatikana.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// PATCH /api/admin/providers/:id/reject
exports.rejectProvider = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE providers SET verification_status = 'rejected', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Provider haikupatikana.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [users, providers, bookings, pendingProviders] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users WHERE role = 'customer'`),
      pool.query(`SELECT COUNT(*) FROM providers`),
      pool.query(`SELECT COUNT(*) FROM bookings`),
      pool.query(`SELECT COUNT(*) FROM providers WHERE verification_status = 'pending'`),
    ]);
    res.json({
      total_customers: parseInt(users.rows[0].count, 10),
      total_providers: parseInt(providers.rows[0].count, 10),
      total_bookings: parseInt(bookings.rows[0].count, 10),
      pending_providers: parseInt(pendingProviders.rows[0].count, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};
