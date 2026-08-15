const pool = require('../config/db');

// GET /api/providers?category_id=1&lat=-6.79&lng=39.20&radius=10
exports.listProviders = async (req, res) => {
  const { category_id, lat, lng, radius = 10 } = req.query;

  try {
    let query = `
      SELECT p.id, p.bio, p.experience_years, p.verification_status,
             p.avg_rating, p.total_reviews, p.is_available,
             u.full_name, u.phone, u.profile_photo_url,
             l.latitude, l.longitude, l.ward
      FROM providers p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN locations l ON l.user_id = u.id AND l.is_primary = TRUE
      WHERE p.verification_status = 'verified' AND p.is_available = TRUE
    `;
    const params = [];

    if (category_id) {
      params.push(category_id);
      query = `
        SELECT p.id, p.bio, p.experience_years, p.verification_status,
               p.avg_rating, p.total_reviews, p.is_available,
               u.full_name, u.phone, u.profile_photo_url,
               l.latitude, l.longitude, l.ward
        FROM providers p
        JOIN users u ON u.id = p.user_id
        JOIN provider_services ps ON ps.provider_id = p.id
        LEFT JOIN locations l ON l.user_id = u.id AND l.is_primary = TRUE
        WHERE p.verification_status = 'verified' AND p.is_available = TRUE
          AND ps.service_id IN (SELECT id FROM services WHERE category_id = $1)
      `;
    }

    const result = await pool.query(query, params);
    let providers = result.rows;

    // Simple Haversine distance filter/sort if lat/lng given
    if (lat && lng) {
      const toRad = (v) => (v * Math.PI) / 180;
      const haversine = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      providers = providers
        .map((p) => ({
          ...p,
          distance_km: p.latitude
            ? haversine(parseFloat(lat), parseFloat(lng), parseFloat(p.latitude), parseFloat(p.longitude))
            : null,
        }))
        .filter((p) => p.distance_km === null || p.distance_km <= parseFloat(radius))
        .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
    }

    res.json(providers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error kupata providers.' });
  }
};

// GET /api/providers/:id
exports.getProvider = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.full_name, u.phone, u.profile_photo_url
       FROM providers p JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Provider hakupatikana.' });

    const services = await pool.query(
      `SELECT s.id, s.name, ps.price_min, ps.price_max
       FROM provider_services ps JOIN services s ON s.id = ps.service_id
       WHERE ps.provider_id = $1`,
      [req.params.id]
    );

    const reviews = await pool.query(
      `SELECT r.rating, r.comment, r.created_at, u.full_name
       FROM reviews r JOIN users u ON u.id = r.customer_id
       WHERE r.provider_id = $1 ORDER BY r.created_at DESC LIMIT 20`,
      [req.params.id]
    );

    res.json({ ...result.rows[0], services: services.rows, reviews: reviews.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// PUT /api/providers/me (provider updates own profile)
exports.updateMyProviderProfile = async (req, res) => {
  const { bio, experience_years } = req.body;
  try {
    const result = await pool.query(
      `UPDATE providers SET bio = COALESCE($1, bio),
       experience_years = COALESCE($2, experience_years), updated_at = NOW()
       WHERE user_id = $3 RETURNING *`,
      [bio, experience_years, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Provider profile haipo.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/providers/me/services  { service_id, price_min, price_max }
exports.addMyService = async (req, res) => {
  const { service_id, price_min, price_max } = req.body;
  try {
    const providerRes = await pool.query('SELECT id FROM providers WHERE user_id = $1', [req.user.id]);
    if (providerRes.rows.length === 0) return res.status(404).json({ error: 'Provider profile haipo.' });
    const providerId = providerRes.rows[0].id;

    const result = await pool.query(
      `INSERT INTO provider_services (provider_id, service_id, price_min, price_max)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (provider_id, service_id) DO UPDATE SET price_min = $3, price_max = $4
       RETURNING *`,
      [providerId, service_id, price_min, price_max]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/providers/me/location  { address, ward, city, latitude, longitude, radius_km }
exports.setMyLocation = async (req, res) => {
  const { address, ward, city, latitude, longitude, radius_km } = req.body;
  if (!latitude || !longitude) return res.status(400).json({ error: 'latitude na longitude ni lazima.' });

  try {
    await pool.query('UPDATE locations SET is_primary = FALSE WHERE user_id = $1', [req.user.id]);
    const result = await pool.query(
      `INSERT INTO locations (user_id, label, address, ward, city, latitude, longitude, radius_km, is_primary)
       VALUES ($1, 'Service area', $2, $3, $4, $5, $6, $7, TRUE) RETURNING *`,
      [req.user.id, address, ward, city || 'Dar es Salaam', latitude, longitude, radius_km || 5]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};
