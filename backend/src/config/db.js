const mongoose = require('mongoose');

// Global caching for connections (useful for potential hot reloads/Next.js)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    console.log('MongoDB: Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      throw new Error('Please define the MONGO_URI environment variable inside .env');
    }

    const opts = {
      bufferCommands: false,
    };

    console.log('MongoDB: Establishing new connection...');
    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log('MongoDB connected successfully');
      return mongooseInstance;
    }).catch(error => {
      console.error('MongoDB connection error:', error.message);
      cached.promise = null; // reset so next try isn't blocked by a dead promise
      throw error;
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
