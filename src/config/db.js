const mongoose = require('mongoose');
const colors = require('colors');
const dns = require('dns');
const env = require('./env');

try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback silently
}

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(env.mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    isConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host}`.cyan.underline);

    return conn;
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`.red.underline.bold);
    process.exit(1);
  }
};

module.exports = connectDB;