const mongoose = require('mongoose');
const colors = require('colors');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      autoIndex: true
    });
    console.log(`MongoDB connected: ${conn.connection.host}`.cyan.underline);
    
    // Seed default admin user admin@gmail.com / m115@224
    const seedAdminUser = require('../utils/seedAdmin');
    await seedAdminUser();

    return conn;
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`.red.underline.bold);
    process.exit(1);
  }
};


module.exports = connectDB;