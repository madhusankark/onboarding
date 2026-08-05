const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

require('colors');

const start = async () => {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      credentials: true
    }
  });

  app.set('io', io);

  io.on('connection', (socket) => {
    console.log(`⚡ WebSocket client connected: ${socket.id}`.cyan);
    socket.on('disconnect', () => {
      console.log(`WebSocket client disconnected: ${socket.id}`.gray);
    });
  });

  server.listen(env.port, () => {
    console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`.yellow.bold);
    console.log(`⚡ Socket.io WebSockets Engine active`.green.bold);
    console.log(`API docs available at http://localhost:${env.port}/api-docs`.cyan);
  });

  const shutdown = () => {
    console.log('\nShutting down gracefully...'.yellow);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start();