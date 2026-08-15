const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
exports.register = async (req, res) => {
  const { full_name, phone, email, password, role } = req.body;

  if (!full_name || !phone || !password) {
    return res.status(400).json({ error: 'Jina, namba ya simu na password ni lazima.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password iwe angalau herufi 6.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Namba hii ya simu tayari imesajiliwa.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userRole = role === 'provider' ? 'provider' : 'customer';

    const result = await pool.query(
      `INSERT INTO users (full_name, phone, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, phone, email, role, created_at`,
      [full_name, phone, email || null, password_hash, userRole]
    );

    const user = result.rows[0];

    // If registering as provider, create the providers row too
    if (userRole === 'provider') {
      await pool.query('INSERT INTO providers (user_id) VALUES ($1)', [user.id]);
    }

    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error wakati wa register.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Namba ya simu na password ni lazima.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Namba ya simu au password si sahihi.' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Namba ya simu au password si sahihi.' });
    }

    delete user.password_hash;
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error wakati wa login.' });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, phone, email, role, profile_photo_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User hakupatikana.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};
