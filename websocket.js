// websocket.js
// This module sets up a WebSocket server to handle real-time communication with devices.
// It listens for new feed commands and notifies the connected devices.

const { db } = require('./config/firebase');

function setupWebSocket(server) {
  const { Server } = require('socket.io');
  const io = new Server(server, { cors: { origin: '*' } });

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