const mongoose = require('mongoose');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const tryConnect = async (uri, timeoutMs = 3000) => {
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: timeoutMs,
    connectTimeoutMS: timeoutMs,
  });
  return conn;
};

const connectDB = async () => {
  if (process.env.MONGODB_URI) {
    try {
      const conn = await tryConnect(process.env.MONGODB_URI);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.warn(`MongoDB unavailable (${error.message})`);
    }
    // Don't fall through to memory server — if URI is set and fails, just warn
    return;
  }

  // No MONGODB_URI set — try in-memory MongoDB
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`In-memory MongoDB started`);
  } catch (err) {
    console.warn(`No database available, starting without DB: ${err.message}`);
  }
};

module.exports = connectDB;
