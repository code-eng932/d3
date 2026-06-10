const cors = require("cors");
const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const app = express();

// ── CORS ────────────────────────────────────────────────────────────────────
// Always include the known Vercel production URL plus any env-configured URL.
const PRODUCTION_FRONTEND = "https://d3-app-omega.vercel.app";

const allowedOrigins = [
  PRODUCTION_FRONTEND,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
].filter(Boolean);

console.log("[CORS] Allowed origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Render health checks, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());

// ── Health / Root ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({ message: "Digital Dopamine Detox backend running." });
});

// Explicit health check endpoint — useful for Render uptime monitors
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", require("../routes/authRoutes"));
app.use("/api/onboarding", require("../routes/onboardingRoutes"));
app.use("/api/screen-time", require("../routes/screenTimeRoutes"));
app.use("/api/activities", require("../routes/activityRoutes"));
app.use("/api/focus-sessions", require("../routes/focusSessionRoutes"));
app.use("/api/interventions", require("../routes/interventionRoutes"));
app.use("/api/journal", require("../routes/journalRoutes"));
app.use("/api/dashboard", require("../routes/dashboardRoutes"));
app.use("/api/v1/dev", require("./modules/dev/dev.routes"));
app.use("/api/v1/score", protect, require("./modules/score/score.routes"));
app.use("/api/v1/interventions", protect, require("./modules/intervention/intervention.routes"));
app.use("/api/v1/mirror", protect, require("./modules/mirror/mirror.routes"));

// ── 404 Fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Internal server error." });
});

module.exports = app;
