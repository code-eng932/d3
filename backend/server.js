const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Digital Dopamine Detox backend running." });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/onboarding", require("./routes/onboardingRoutes"));
app.use("/api/screen-time", require("./routes/screenTimeRoutes"));
app.use("/api/focus-sessions", require("./routes/focusSessionRoutes"));
app.use("/api/journal", require("./routes/journalRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
