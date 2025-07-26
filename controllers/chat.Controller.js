const User = require('../models/user.Model');

module.exports = (io, socket) => {
  console.log('A user connected');

  socket.on('join', (username) => {
    const name = username || 'Anonymous';
    socket.username = name;
    User.addUser(socket.id, name);

    console.log(`${name} joined`);
    socket.broadcast.emit('system', `${name} joined the chat`);
    io.emit('online-users', User.getOnlineUsers());
  });

socket.on("message", (payload) => {
  const name = socket.username || "Anonymous";
  const finalPayload = {
    from: name,
    text: payload.text,
    time: payload.time
  };
  io.emit("message", finalPayload);
});

  socket.on('disconnect', () => {
    const name = socket.username || 'Anonymous';
    console.log(`${name} disconnected`);
    socket.broadcast.emit('system', `${name} left the chat`);
    User.removeUser(socket.id);
    io.emit('online-users', User.getOnlineUsers());
  });
};
