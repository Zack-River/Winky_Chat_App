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

  // Store video call peers: socket.id -> username
  const videoPeers = new Map();

  io.on('connection', (socket) => {
    console.log(`✅ New connection: ${socket.id}`);

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
      const name = socket.username || "Anonymous";
      videoPeers.set(socket.id, name);
      console.log(`🎥 ${name} joined video`);

      // Tell the new peer its ID
      socket.emit("init-peer-id", { peerId: socket.id });

      // Notify others to connect to this peer
      socket.broadcast.emit("new-peer", {
        peerId: socket.id,
        username: name
      });
    });

    // ✅ VIDEO: Offer
    socket.on("video-offer", ({ peerId, offer }) => {
      io.to(peerId).emit("video-offer", {
        peerId: socket.id,
        offer,
        username: socket.username || "Anonymous"
      });
    });

    // ✅ VIDEO: Answer
    socket.on("video-answer", ({ peerId, answer }) => {
      io.to(peerId).emit("video-answer", {
        peerId: socket.id,
        answer
      });
    });

    // ✅ VIDEO: ICE
    socket.on("ice-candidate", ({ peerId, candidate }) => {
      io.to(peerId).emit("ice-candidate", {
        peerId: socket.id,
        candidate
      });
    });

    // ✅ LEAVE VIDEO or DISCONNECT
    socket.on('disconnect', () => {
      const name = socket.username || 'Anonymous';
      console.log(`${name} disconnected`);

      // Notify chat
      socket.broadcast.emit('system', `${name} left the chat`);
      User.removeUser(socket.id);
      io.emit('online-users', User.getOnlineUsers());

      // Notify video peers
      if (videoPeers.has(socket.id)) {
        console.log(`❌ ${name} left video`);
        videoPeers.delete(socket.id);
        io.emit("remove-peer", { peerId: socket.id });
      }
    });
  });
};