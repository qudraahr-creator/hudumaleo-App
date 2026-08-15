const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Hakuna token. Tafadhali login.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, phone }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token si sahihi au imeisha muda.' });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Huna ruhusa ya kufanya hii.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
