const pool = require('../config/db');

// POST /api/reviews  { booking_id, provider_id, rating, comment }
exports.createReview = async (req, res) => {
  const { booking_id, provider_id, rating, comment } = req.body;
  if (!booking_id || !provider_id || !rating) {
    return res.status(400).json({ error: 'booking_id, provider_id na rating ni lazima.' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating iwe kati ya 1 na 5.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const review = await client.query(
      `INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [booking_id, req.user.id, provider_id, rating, comment || null]
    );

    // Recalculate provider average rating
    const agg = await client.query(
      `SELECT AVG(rating)::numeric(2,1) AS avg_rating, COUNT(*) AS total
       FROM reviews WHERE provider_id = $1`,
      [provider_id]
    );

    await client.query(
      `UPDATE providers SET avg_rating = $1, total_reviews = $2 WHERE id = $3`,
      [agg.rows[0].avg_rating, agg.rows[0].total, provider_id]
    );

    await client.query('COMMIT');
    res.status(201).json(review.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Umeshaacha review kwa booking hii.' });
    }
    res.status(500).json({ error: 'Server error.' });
  } finally {
    client.release();
  }
};
