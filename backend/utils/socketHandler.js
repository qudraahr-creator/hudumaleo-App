const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Ramani ya user_id -> socket.id (kwa kujua nani yuko online)
const onlineUsers = new Map();

function initSocket(io) {
  // Middleware ya JWT auth kwa kila socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Hakuna token.'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, role, phone }
      next();
    } catch (err) {
      next(new Error('Token si sahihi.'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    onlineUsers.set(userId, socket.id);
    console.log(`🟢 User ${userId} amejiunga (socket ${socket.id})`);

    // Jiunge na "chumba" cha booking fulani
    socket.on('join_booking', (bookingId) => {
      socket.join(`booking_${bookingId}`);
    });

    socket.on('leave_booking', (bookingId) => {
      socket.leave(`booking_${bookingId}`);
    });

    // Tuma ujumbe
    socket.on('send_message', async ({ booking_id, message }) => {
      if (!booking_id || !message?.trim()) return;

      try {
        const result = await pool.query(
          `INSERT INTO messages (booking_id, sender_id, message)
           VALUES ($1, $2, $3) RETURNING *`,
          [booking_id, userId, message.trim()]
        );
        const savedMessage = result.rows[0];

        // Tuma kwa wote walio kwenye chumba hicho (mtumaji + mpokeaji)
        io.to(`booking_${booking_id}`).emit('new_message', savedMessage);
      } catch (err) {
        console.error('Error saving message:', err.message);
        socket.emit('message_error', { error: 'Imeshindwa kutuma ujumbe.' });
      }
    });

    // Typing indicator
    socket.on('typing', ({ booking_id, is_typing }) => {
      socket.to(`booking_${booking_id}`).emit('user_typing', { user_id: userId, is_typing });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      console.log(`🔴 User ${userId} ameondoka`);
    });
  });
}

module.exports = { initSocket, onlineUsers };
