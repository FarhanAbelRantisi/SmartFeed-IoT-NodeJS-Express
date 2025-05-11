// misc/simulator.js
// This script simulates a smart feeder device that interacts with a server.

const axios = require('axios');
const { io } = require('socket.io-client');

const DEVICE_ID = 'smartfeed_01';
const SERVER_URL = 'http://localhost:3000';
const AUTO_FEED_INTERVAL_MS = 60_000; // 60 seconds

// Helper to activate real-time listener for this device
async function activateListener() {
  try {
    await axios.post(`${SERVER_URL}/api/devices/${DEVICE_ID}/listen`);
    console.log('Real-time listener activated for device:', DEVICE_ID);
  } catch (err) {
    console.error('Failed to activate listener:', err.message);
    process.exit(1);
  }
}

// Listen for new feed commands (manual/auto) via WebSocket
function setupWebSocket() {
  const socket = io(SERVER_URL);
  socket.on('connect', () => {
    socket.emit('subscribeHistories', DEVICE_ID);
    console.log('WebSocket connected and subscribed to histories.');
  });

  socket.on('newHistory', async (history) => {
    console.log('Received new feed command:', history);

    if (history.feedAction === 'manual') {
      // Simulate feeding process
      console.log('Feeding...');

      // Simulate new feedLevel after feeding (randomly below or above threshold)
      const newFeedLevel = Math.floor(Math.random() * 100);

      try {
        // Update device feedLevel (this will trigger notification if below threshold)
        await axios.post(`${SERVER_URL}/api/devices/${DEVICE_ID}/feed-level`, {
          feedLevel: newFeedLevel,
          historyId: history.id
        });
        console.log('Feed level updated:', newFeedLevel);
      } catch (err) {
        console.error('Failed to update feed level:', err.message);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected.');
  });
}

// Simulate periodic feedLevel reporting (auto-feed)
function startAutoFeedSimulation() {
  setInterval(async () => {
    const feedLevel = Math.floor(Math.random() * 100);
    const feedAction = 'auto';
    try {
      const res = await axios.post(`${SERVER_URL}/api/devices/${DEVICE_ID}/histories`, {
        feedLevel,
        feedAction
      });
      console.log('Auto-feed reported:', { feedLevel, historyId: res.data.historyId });

      // Optionally, update device feedLevel to simulate sensor update
      await axios.post(`${SERVER_URL}/api/devices/${DEVICE_ID}/feed-level`, {
        feedLevel
      });
    } catch (err) {
      console.error('Auto-feed simulation failed:', err.message);
    }
  }, AUTO_FEED_INTERVAL_MS);
}

// Get latest feed command (manual/auto) at startup
async function getLatestFeed() {
  try {
    const res = await axios.get(`${SERVER_URL}/api/devices/${DEVICE_ID}/latest-feed`);
    console.log('Latest feed command:', res.data);
  } catch (err) {
    console.error('Failed to get latest feed command:', err.message);
  }
}

// Main simulation flow
(async () => {
  await activateListener();
  setupWebSocket();
  await getLatestFeed();
  startAutoFeedSimulation();
})();