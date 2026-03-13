const WebSocket = require('ws');

const socket = new WebSocket('ws://127.0.0.1:3000/ws');

socket.on('open', function open() {
  console.log('Connected to NexusOS Live Stream');
});

socket.on('message', function incoming(data) {
  const event = JSON.parse(data);
  console.log(`[${event.timestamp}] [${event.event_type}] Task ${event.task_id.slice(0,8)}: ${event.content}`);
});

socket.on('close', function close() {
  console.log('Disconnected from stream');
});

socket.on('error', function error(err) {
  console.error('WebSocket error:', err.message);
});
