// misc/simulator.js
// This script simulates a smart feeder device that interacts with a server.

require('../config/dotenv'); 
const axios = require('axios');
const { io } = require('socket.io-client');

const DEVICE_ID = process.env.DEVICE_ID || 'your_device_id';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'secret_api_key';
const AUTO_FEED_INTERVAL_MS = parseInt(process.env.AUTO_FEED_INTERVAL_MS, 10) || 60000;

// Axios instance with API key header
const axiosInstance = axios.create({
  headers: { 'x-api-key': API_KEY }
});

// Helper to activate real-time listener for this device
async function activateListener() {
  try {
    await axiosInstance.post(`${SERVER_URL}/api/devices/${DEVICE_ID}/listen`);
    console.log('Real-time listener activated for device:', DEVICE_ID);
  } catch (err) {
    console.error('Failed to activate listener:', err.message);
    process.exit(1);
  }
}

// Listen for new feed commands (manual/auto) via WebSocket
function setupWebSocket() {
  const socket = io(SERVER_URL, {
    auth: { apiKey: API_KEY }
  });

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
        await axiosInstance.post(`${SERVER_URL}/api/devices/${DEVICE_ID}/feed-level`, {
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

  socket.on('connect_error', (err) => {
    console.error('WebSocket connection error:', err.message);
  });
}

// Simulate periodic feedLevel reporting (auto-feed)
function startAutoFeedSimulation() {
  setInterval(async () => {
    const feedLevel = Math.floor(Math.random() * 100);
    const feedAction = 'auto';
    try {
      const res = await axiosInstance.post(`${SERVER_URL}/api/devices/${DEVICE_ID}/histories`, {
        feedLevel,
        feedAction
      });
      console.log('Auto-feed reported:', { feedLevel, historyId: res.data.historyId });

      // Optionally, update device feedLevel to simulate sensor update
      await axiosInstance.post(`${SERVER_URL}/api/devices/${DEVICE_ID}/feed-level`, {
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
    const res = await axiosInstance.get(`${SERVER_URL}/api/devices/${DEVICE_ID}/latest-feed`);
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