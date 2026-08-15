require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const providerRoutes = require('./routes/providerRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Dokaa API iko live 🚀' });
});

app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api', serviceRoutes); // /api/categories, /api/services
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route haikupatikana.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Kuna hitilafu upande wa server.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Dokaa backend inaendesha kwenye port ${PORT}`);
});
