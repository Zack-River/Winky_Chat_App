const onlineUsers = new Map();

module.exports = {
  addUser: (id, username) => {
    onlineUsers.set(id, username);
  },
  removeUser: (id) => {
    onlineUsers.delete(id);
  },
  getOnlineUsers: () => {
    return Array.from(onlineUsers.values());
  },
};