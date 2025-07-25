const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const { Server } = require('socket.io');

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static('public'));

app.use(cors({
  origin: 'http://127.0.0.1:3001',
  methods: ['GET', 'POST'],
  credentials: true
}));

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (username) => {
    const name = username || 'Anonymous';
    socket.username = name;
    onlineUsers.set(socket.id, name);

    console.log(`${name} joined`);

    socket.broadcast.emit('system', `${name} joined the chat`);
    io.emit('online-users', Array.from(onlineUsers.values()));
  });

  socket.on('message', (msg) => {
    const name = socket.username || 'Anonymous';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const payload = {
      from: name,
      text: msg,
      time
    };

    io.emit('message', payload);
  });

  socket.on('disconnect', () => {
    const name = socket.username || 'Anonymous';
    console.log(`${name} disconnected`);

    socket.broadcast.emit('system', `${name} left the chat`);
    onlineUsers.delete(socket.id);
    io.emit('online-users', Array.from(onlineUsers.values()));
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});