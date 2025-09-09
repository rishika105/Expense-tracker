const Preference = require("../models/Preference");
const User = require("../models/User");

exports.addPreferences = async (req, res) => {
  try {
    const id = req.user.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const { baseCurrency, monthlyBudget, notifications, resetCycle } = req.body;

    if (!baseCurrency || !monthlyBudget || !notifications || !resetCycle) {
      return res.status(400).json({
        success: false,
        message: "Some fields are missing",
      });
    }

    const preferences = await Preference.create({
      user: id,
      baseCurrency,
      monthlyBudget,
      notifications,
      resetCycle,
    });

    //already verified can call this controller
    let verified = true;

    return res.status(200).json({
      success: true,
      message: "Added expense Preferences successfully",
      preferences,
      verified,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error while adding preferences",
    });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const preferences = await Preference.findOne({ user: userId });

    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Fetched Preferences successfully",
      preferences,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating preferences",
    });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const { baseCurrency, monthlyBudget, notifications, resetCycle } = req.body;

    if (!baseCurrency || !monthlyBudget || !notifications || !resetCycle) {
      return res.status(400).json({
        success: false,
        message: "Some fields are missing",
      });
    }

    const updatedPreferences = await Preference.findOneAndUpdate(
      { user: userId }, // ✅ find by userId
      { baseCurrency, monthlyBudget, notifications, resetCycle },
      { new: true } // upsert creates if not found
    );

    return res.status(200).json({
      success: true,
      message: "Updated expense Preferences successfully",
      updatedPreferences,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating preferences",
    });
  }
};
