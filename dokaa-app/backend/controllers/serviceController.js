const pool = require('../config/db');

// GET /api/categories
exports.listCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE is_active = TRUE ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/services?category_id=1
exports.listServices = async (req, res) => {
  const { category_id } = req.query;
  try {
    const query = category_id
      ? 'SELECT * FROM services WHERE category_id = $1 ORDER BY name'
      : 'SELECT * FROM services ORDER BY name';
    const params = category_id ? [category_id] : [];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};
