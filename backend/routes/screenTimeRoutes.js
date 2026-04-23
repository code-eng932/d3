const express = require("express");
const { getScreenTimeHistory, upsertScreenTime } = require("../controllers/screenTimeController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getScreenTimeHistory);
router.post("/", protect, upsertScreenTime);

module.exports = router;
