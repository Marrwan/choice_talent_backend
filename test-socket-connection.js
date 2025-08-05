#!/usr/bin/env node

/**
 * Simple test script to verify socket connection works
 * Run this with: node test-socket-connection.js
 */

const { io } = require('socket.io-client');

// Replace with a valid JWT token from your app
const TEST_TOKEN = 'your-jwt-token-here';
const BACKEND_URL = 'http://192.168.1.101:3001';

console.log('🔌 Testing socket connection...');
console.log('📍 Backend URL:', BACKEND_URL);
console.log('🔑 Token:', TEST_TOKEN ? `${TEST_TOKEN.substring(0, 20)}...` : 'NO TOKEN PROVIDED');

const socket = io(BACKEND_URL, {
  auth: {
    token: TEST_TOKEN
  },
  transports: ['websocket', 'polling'],
  withCredentials: true,
  timeout: 10000,
  forceNew: true
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Socket connected successfully!');
  console.log('🆔 Socket ID:', socket.id);
  
  // Test incoming_call event listener
  socket.on('incoming_call', (data) => {
    console.log('📞 INCOMING CALL EVENT RECEIVED!');
    console.log('📦 Data:', JSON.stringify(data, null, 2));
  });
  
  console.log('👂 Listening for incoming_call events...');
  console.log('ℹ️ You can now test from the frontend');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

// Listen for all events for debugging
socket.onAny((eventName, ...args) => {
  console.log(`\n🔔 Event received: ${eventName}`);
  console.log('📦 Data:', args);
});

// Keep the script running
console.log('🔄 Waiting for events... (Press Ctrl+C to exit)');

process.on('SIGINT', () => {
  console.log('\n👋 Disconnecting...');
  socket.disconnect();
  process.exit(0);
});
