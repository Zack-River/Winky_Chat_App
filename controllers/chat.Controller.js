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

  socket.on('message', (msg) => {
    const name = socket.username || 'Anonymous';
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const payload = { from: name, text: msg, time };
    io.emit('message', payload);
  });

  socket.on('disconnect', () => {
    const name = socket.username || 'Anonymous';
    console.log(`${name} disconnected`);
    socket.broadcast.emit('system', `${name} left the chat`);
    User.removeUser(socket.id);
    io.emit('online-users', User.getOnlineUsers());
  });
};