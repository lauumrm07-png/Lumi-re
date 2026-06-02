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
      console.warn(`MongoDB unavailable, using local storage...`);
    }
  }

  // Use persistent mongod with a fixed dbPath
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const fs = require('fs');

  // Check if we have a persistent instance file
  const uriFile = path.join(DATA_DIR, '.mongouri');
  let uri;

  if (fs.existsSync(uriFile)) {
    uri = fs.readFileSync(uriFile, 'utf8').trim();
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log(`Reconnected to persistent MongoDB`);
      return;
    } catch {
      // Stale URI, start fresh
    }
  }

  const mongod = await MongoMemoryServer.create({
    instance: {
      dbPath: DATA_DIR,
      storageEngine: 'wiredTiger',
    },
  });

  uri = mongod.getUri();
  fs.writeFileSync(uriFile, uri);
  await mongoose.connect(uri);
  console.log(`Persistent MongoDB started at ${uri}`);
};

module.exports = connectDB;
