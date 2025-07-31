const User = require('../models/user.Model');

module.exports = (httpServer) => {
  const { Server } = require("socket.io");
  const io = new Server(httpServer, {
    cors: {
      origin: ['http://127.0.0.1:3001'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected');

    // ✅ JOIN CHAT
    socket.on('join', (username) => {
      const name = username || 'Anonymous';
      socket.username = name;
      User.addUser(socket.id, name);
      console.log(`${name} joined`);
      socket.broadcast.emit('system', `${name} joined the chat`);
      io.emit('online-users', User.getOnlineUsers());
    });

    // ✅ CHAT MESSAGE
    socket.on("message", (payload) => {
      const name = socket.username || "Anonymous";
      const finalPayload = {
        from: name,
        text: payload.text,
        time: payload.time
      };
      io.emit("message", finalPayload);
    });

    // ✅ VIDEO: Join room
    socket.on("join-video", () => {
      console.log(`${socket.username} wants to join video`);
      // Notify others to connect to this new peer
      socket.broadcast.emit("new-peer", { peerId: socket.id });
    });

    // ✅ VIDEO: Offer
    socket.on("video-offer", ({ peerId, offer }) => {
      io.to(peerId).emit("video-offer", { peerId: socket.id, offer });
    });

    // ✅ VIDEO: Answer
    socket.on("video-answer", ({ peerId, answer }) => {
      io.to(peerId).emit("video-answer", { peerId: socket.id, answer });
    });

    // ✅ VIDEO: ICE
    socket.on("ice-candidate", ({ peerId, candidate }) => {
      io.to(peerId).emit("ice-candidate", { peerId: socket.id, candidate });
    });

    // ✅ DISCONNECT
    socket.on('disconnect', () => {
      const name = socket.username || 'Anonymous';
      console.log(`${name} disconnected`);
      socket.broadcast.emit('system', `${name} left the chat`);
      User.removeUser(socket.id);
      io.emit('online-users', User.getOnlineUsers());
    });
  });
};