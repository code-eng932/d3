const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

// Start server ONLY after MongoDB successfully connects.
// This prevents requests from hanging while the DB is still initializing.
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[SERVER] Running on port ${PORT}`);
      console.log(`[SERVER] Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`[SERVER] FRONTEND_URL: ${process.env.FRONTEND_URL || "(not set)"}`);
    });
  } catch (error) {
    console.error("[SERVER] Failed to start — MongoDB connection error:", error.message);
    process.exit(1);
  }
};

startServer();
