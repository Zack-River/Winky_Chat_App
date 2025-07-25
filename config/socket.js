const { Server } = require('socket.io');
const chatController = require('../controller/chat.Controller');

module.exports = (httpServer) => {
  const io = new Server(httpServer, {
    serveClient: true,
    cors: {
      origin: ['http://127.0.0.1:5500'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    chatController(io, socket);
  });

  return io;
};
