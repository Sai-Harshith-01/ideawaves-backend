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

// ✅ ALLOWED ORIGINS (FIXED CORS)
const allowedOrigins = [
  'https://ideawaves-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

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

// Static uploads
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

// Make socket available in controllers
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// ==========================
// Serve Frontend (Node 22 SAFE)
// ==========================
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
  const buildPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(buildPath));

  // ✅ Safe catch-all (Node 22)
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('IdeaWaves API is running...');
  });
}

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
