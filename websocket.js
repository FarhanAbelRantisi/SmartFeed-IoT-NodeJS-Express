require('./config/dotenv');
const { db } = require('./config/firebase');

const API_KEY = process.env.API_KEY || 'secret_api_key';

function setupWebSocket(server) {
  const { Server } = require('socket.io');
  const io = new Server(server, { cors: { origin: '*' } });

  io.use((socket, next) => {
    const apiKey = socket.handshake.auth?.apiKey || socket.handshake.headers['x-api-key'];
    if (apiKey !== API_KEY) {
      return next(new Error('Unauthorized'));
    }
    next();
  });

  io.on('connection', (socket) => {
    socket.on('subscribeHistories', (deviceId) => {
      const unsubscribe = db.collection('devices').doc(deviceId)
        .collection('histories')
        .orderBy('triggeredAt', 'desc')
        .limit(1)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              socket.emit('newHistory', { id: change.doc.id, ...change.doc.data() });
            }
          });
        });
      socket.on('disconnect', unsubscribe);
    });
  });
}

module.exports = { setupWebSocket };