// index.js
// This script sets up an Express server and WebSocket connection for the smart feeder device.

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const deviceRoutes = require('./routes/deviceRoutes');
const { setupWebSocket } = require('./websocket');

const app = express();
app.use(bodyParser.json());
app.use('/api', deviceRoutes);

const server = http.createServer(app);
setupWebSocket(server);

server.listen(3000, () => {
  console.log('Server running on port 3000');
});