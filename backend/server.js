require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const providerRoutes = require('./routes/providerRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const messageRoutes = require('./routes/messageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const { initSocket } = require('./utils/socketHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'HudumaLeo API iko live 🚀' });
});

// TEMPORARY DEBUG - ondoa baadaye
app.get('/debug-env', (req, res) => {
  function preview(val) {
    if (!val) return 'HAIPO KABISA';
    return {
      urefu: val.length,
      mwanzo: val.slice(0, 4),
      mwisho: val.slice(-4),
      ina_nafasi_ziada: val !== val.trim(),
    };
  }
  res.json({
    CLICKPESA_CLIENT_ID: preview(process.env.CLICKPESA_CLIENT_ID),
    CLICKPESA_API_KEY: preview(process.env.CLICKPESA_API_KEY),
  });
});

// TEMPORARY DEBUG - jaribu moja kwa moja dhidi ya ClickPesa
app.get('/debug-clickpesa-token', async (req, res) => {
  try {
    const response = await fetch('https://api.clickpesa.com/third-parties/generate-token', {
      method: 'GET',
      headers: {
        'client-id': process.env.CLICKPESA_CLIENT_ID,
        'api-key': process.env.CLICKPESA_API_KEY,
      },
    });
    const text = await response.text();
    res.json({ status: response.status, ok: response.ok, body: text.slice(0, 500) });
  } catch (err) {
    res.json({ fetchError: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api', serviceRoutes); // /api/categories, /api/services
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use(express.static('public'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route haikupatikana.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Kuna hitilafu upande wa server.' });
});

initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ HudumaLeo backend (na Socket.io) inaendesha kwenye port ${PORT}`);
});
