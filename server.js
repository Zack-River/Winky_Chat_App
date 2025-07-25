const http = require('http');
const app = require('./app');
const setupSocket = require('./config/socket');

const PORT = process.env.PORT || 10000;

const httpServer = http.createServer(app);
setupSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`✅ Winky server running on port ${PORT}`);
});