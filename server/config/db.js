const mongoose = require('mongoose');

/**
 * Connect to MongoDB with retry logic and event listeners.
 * Reads MONGO_URI from environment variables.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 8 uses these defaults, but explicit for clarity
      autoIndex: true,
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error(`❌  MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄  MongoDB reconnected.');
    });

    return conn;
  } catch (error) {
    console.error(`❌  MongoDB connection failed: ${error.message}`);
    // Exit with failure in production; retry in dev
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    // Retry after 5 seconds in development
    console.log('🔄  Retrying connection in 5 seconds...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return connectDB();
  }
};

module.exports = connectDB;
