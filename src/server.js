const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Route files
const authRoutes = require('./routes/authRoutes');
const ideaRoutes = require('./routes/ideaRoutes');
const requestRoutes = require('./routes/requestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
 cors: {
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST"]
 }
});

// Socket.IO logic
io.on('connection', (socket) => {
 console.log('User connected:', socket.id);

 socket.on('join_room', (ideaId) => {
  socket.join(ideaId);
  console.log(`User joined room: ${ideaId}`);
 });

 socket.on('send_message', (data) => {
  // data: { ideaId, senderId, senderName, text, timestamp }
  socket.to(data.ideaId).emit('receive_message', data);
 });

 socket.on('disconnect', () => {
  console.log('User disconnected');
 });
});

// Make io accessible in controllers if needed (via app.set or middleware)
app.set('socketio', io);

const path = require('path');

// Body parser
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Enable CORS with environment-specific origin
const allowedOrigin = process.env.CLIENT_URL || '*';
app.use(cors({
 origin: allowedOrigin,
 credentials: true
}));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
 // Set build folder
 const buildPath = path.join(__dirname, '../frontend/dist');
 app.use(express.static(buildPath));

 app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
   res.sendFile(path.resolve(buildPath, 'index.html'));
  }
 });
} else {
 app.get('/', (req, res) => {
  res.send('IdeaWaves API is running...');
 });
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
 console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
