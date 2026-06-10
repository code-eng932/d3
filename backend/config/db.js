const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI environment variable is not set!");
  }

  // Log the host only (never log passwords)
  try {
    const parsed = new URL(uri);
    console.log(`[DB] Connecting to host: ${parsed.hostname} ...`);
  } catch {
    throw new Error(`MONGO_URI is malformed — cannot parse as a URL. Value starts with: ${uri.slice(0, 20)}...`);
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000, // 15s — enough for Atlas cold start
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
  });

  console.log(`[DB] Connected successfully: ${mongoose.connection.host}`);
};

module.exports = connectDB;
