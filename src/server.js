const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');

const connectDB = require('./config/db');

// ==========================
// Load env & connect DB
// ==========================
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ==========================
// Middleware
// ==========================
app.use(express.json());

// ✅ Allowed origins
const allowedOrigins = [
  'https://ideawaves-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman, server-to-server
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

// Static uploads (ONLY uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================
// Socket.IO
// ==========================
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (ideaId) => {
    socket.join(ideaId);
  });

  socket.on('send_message', (data) => {
    socket.to(data.ideaId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.set('socketio', io);

// ==========================
// Routes
// ==========================
const authRoutes = require('./routes/authRoutes');
const ideaRoutes = require('./routes/ideaRoutes');
const requestRoutes = require('./routes/requestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

// ==========================
// Health & Root
// ==========================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.get('/', (req, res) => {
  res.send('IdeaWaves Backend is running 🚀');
});

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
