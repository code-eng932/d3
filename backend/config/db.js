const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI environment variable is not set!");
  }

  console.log("[DB] Connecting to MongoDB...");

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000, // fail fast if Atlas unreachable (10s)
    socketTimeoutMS: 45000,
  });

  console.log(`[DB] Connected: ${mongoose.connection.host}`);
};

module.exports = connectDB;
