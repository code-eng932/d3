const ScreenTime = require("../models/ScreenTime");

const upsertScreenTime = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, totalMinutes, socialMinutes, entertainmentMinutes, productivityMinutes, notes } = req.body;

    if (!date || totalMinutes === undefined) {
      return res.status(400).json({ message: "Date and totalMinutes are required." });
    }

    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);

    const entry = await ScreenTime.findOneAndUpdate(
      { user: userId, date: parsedDate },
      {
        totalMinutes,
        socialMinutes: socialMinutes || 0,
        entertainmentMinutes: entertainmentMinutes || 0,
        productivityMinutes: productivityMinutes || 0,
        notes: notes || "",
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ message: "Screen time entry saved.", entry });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save screen time entry.", error: error.message });
  }
};

const getScreenTimeHistory = async (req, res) => {
  try {
    const entries = await ScreenTime.find({ user: req.user.userId }).sort({ date: -1 });
    return res.status(200).json({ entries });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch screen time history.", error: error.message });
  }
};

module.exports = { upsertScreenTime, getScreenTimeHistory };
