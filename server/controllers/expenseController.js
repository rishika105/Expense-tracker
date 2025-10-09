const { default: Expense } = require("../models/Expense");
const Preference = require("../models/Preference");
const emailQueue = require("../email/emailQueue");
const Redis = require("ioredis");
const { fetchExchangeRates } = require("../utils/fetchExchangeRate");
const { budgetAlertTemplate } = require("../utils/budgetAlertTemplate");
const {
  getCurrentPeriodDateRange,
  getDisplayPeriodDateRange,
} = require("../utils/findDateRange");
const cacheManager = require("../utils/cacheManager");

// Redis connection for caching
const redis = new Redis(process.env.VALKEY_URL || "redis://localhost:6379");

// Calculate budget period expenses with caching
const calculateCurrentBudgetPeriodExpenses = async (userId, resetCycle) => {
  try {
    // Try cache first
    const cachedData = await cacheManager.getCachedBudgetTotal(
      userId,
      resetCycle
    );
    if (cachedData) {
      console.log("Using cached budget total");
      return {
        ...cachedData,
        startDate: new Date(cachedData.startDate),
        endDate: new Date(cachedData.endDate),
      };
    }

    console.log("Cache miss - calculating from database");
    const { startDate, endDate } = getCurrentPeriodDateRange(resetCycle);

    const expenses = await Expense.find({
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).lean();

    const total = expenses.reduce(
      (sum, expense) => sum + expense.baseAmount,
      0
    );

    const data = {
      total,
      count: expenses.length,
      startDate,
      endDate,
      resetCycle,
    };

    // Cache the result
    await cacheManager.setCachedBudgetTotal(userId, resetCycle, data);

    return data;
  } catch (error) {
    console.error("Error calculating budget period expenses:", error);
    return {
      total: 0,
      count: 0,
      startDate: null,
      endDate: null,
      resetCycle,
    };
  }
};

// Calculate total expenses for a specific period
const calculateExpensesForPeriod = async (userId, period) => {
  try {
    const { startDate, endDate } = getDisplayPeriodDateRange(period);

    const expenses = await Expense.find({
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).lean();

    const total = expenses.reduce(
      (sum, expense) => sum + expense.baseAmount,
      0
    );

    return {
      period,
      total,
      count: expenses.length,
      startDate,
      endDate,
    };
  } catch (error) {
    console.error(`Error calculating ${period} expenses:`, error);
    return {
      period,
      total: 0,
      count: 0,
      startDate: null,
      endDate: null,
    };
  }
};

// **THRESHOLD ALERT SYSTEM**
const checkAndSendThresholdAlerts = async (
  userId,
  email,
  currentTotal,
  budget,
  resetCycle,
  baseCurrency,
  latestExpense,
  budgetPeriodData,
  preference
) => {
  if (budget <= 0 || !preference?.notifications) {
    return;
  }

  const progress = currentTotal / budget;

  // Ensure thresholds is always an array
  let thresholds = preference.alertThresholds;

  // Handle various data types that might come from DB
  if (!thresholds || !Array.isArray(thresholds)) {
    thresholds = [0.5, 1.0]; // Default: 50% and 100%
  } else if (thresholds.length === 0) {
    thresholds = [0.5, 1.0];
  }

  const lastAlertThreshold = preference.lastAlertThreshold || 0;

  console.log("Budget alert check:", {
    progress: (progress * 100).toFixed(1) + "%",
    thresholds,
    lastAlertThreshold,
    currentTotal,
    budget,
  });

  // Find all thresholds that have been crossed but not yet alerted
  const crossedThresholds = thresholds
    .filter(
      (threshold) => progress >= threshold && threshold > lastAlertThreshold
    )
    .sort((a, b) => a - b); // Sort ascending to send alerts in order

  if (crossedThresholds.length === 0) {
    return;
  }

  // Send alerts for each crossed threshold
  for (const threshold of crossedThresholds) {

    const isOverBudget = threshold >= 1.0;
    const subject = isOverBudget
      ? `🚨 Budget Exceeded - ${percentageText}% of your ${resetCycle} limit surpassed`
      : `⚠️ Budget Alert - ${percentageText}% of your ${resetCycle} budget reached`;

    const emailBody = budgetAlertTemplate({
      threshold,
      resetCycle,
      baseCurrency,
      budget,
      currentTotal,
      latestExpense,
      budgetPeriodData,
    });

    const percentageText = (threshold * 100).toFixed(0);

    // Add email to queue instead of sending immediately
    try {
      await emailQueue.add(
        "budget-alert",
        {
          email,
          subject,
          body: emailBody,
          userId,
          threshold,
          currentTotal,
          budget,
          resetCycle,
        },
        {
          priority: isOverBudget ? 1 : 5, // Higher priority for over-budget alerts
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        }
      );

      console.log(`Queued budget alert email for ${percentageText}% threshold`);
    } catch (emailError) {
      console.error(
        `Failed to queue budget alert email for ${percentageText}% threshold:`,
        emailError
      );
    }
  }

  // Update the last alert threshold to the highest one sent
  const highestThreshold = Math.max(...crossedThresholds);
  preference.lastAlertThreshold = highestThreshold;
  await preference.save();
};

exports.addExpense = async (req, res) => {
  try {
    const id = req.user.id;
    const email = req.user.email;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const {
      title,
      description,
      amount,
      currency,
      category,
      date,
      paymentMethod,
    } = req.body;

    if (
      !title ||
      !amount ||
      !currency ||
      !category ||
      !date ||
      !paymentMethod
    ) {
      return res.status(400).json({
        success: false,
        message: "Some fields are missing",
      });
    }

    // Get user's preferences
    const preference = await Preference.findOne({ user: id }).select(
      "baseCurrency resetCycle budget notifications alertThresholds lastAlertThreshold"
    );

    const baseCurrency = preference?.baseCurrency || currency;
    const resetCycle = preference?.resetCycle || "monthly";
    const budget = preference?.budget || 0;

    let baseAmount = amount;

    // Convert currency if needed
    if (currency !== baseCurrency) {
      const rates = await fetchExchangeRates(currency);
      if (!rates[baseCurrency.toLowerCase()]) {
        return res.status(400).json({
          success: false,
          message: `Conversion rate from ${currency} to ${baseCurrency} not available`,
        });
      }
      const conversionRate = rates[baseCurrency.toLowerCase()];
      baseAmount = amount * conversionRate;

      console.log(
        `Currency conversion: ${amount} ${currency} -> ${baseAmount} ${baseCurrency} (rate: ${conversionRate})`
      );
    }

    // Validate baseAmount to prevent absurd values
    if (isNaN(baseAmount) || !isFinite(baseAmount) || baseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense amount after conversion",
      });
    }

    // Sanity check: if base amount is unreasonably large, reject it
    if (baseAmount > 100000000) {
      // 100 million
      return res.status(400).json({
        success: false,
        message: "Expense amount is too large. Please check your values.",
      });
    }

    // Create expense
    const expense = await Expense.create({
      title,
      description,
      amount,
      currency,
      baseAmount,
      baseCurrency,
      date: new Date(date),
      category,
      paymentMethod,
      user: id,
    });

    let budgetPeriodData = await cacheManager.updateCachedBudgetTotal(
      id,
      resetCycle,
      baseAmount
    );

    // If no cache exists, initialize it with THIS expense
    //first expense of the cycle**********************************
    if (!budgetPeriodData) {
      console.log("No cache - initializing with current expense");

      const { startDate, endDate } = getCurrentPeriodDateRange(resetCycle);

      budgetPeriodData = {
        total: baseAmount, // Just use the current expense amount
        count: 1,
        startDate,
        endDate,
        resetCycle,
      };

      // Cache it for next time
      await cacheManager.setCachedBudgetTotal(id, resetCycle, budgetPeriodData);
    }

    const currentTotal = budgetPeriodData.total;

    console.log("Budget status:", {
      currentTotal,
      budget,
      resetCycle,
      expenseAdded: baseAmount,
      currency: baseCurrency,
    });

    // **IMPROVED THRESHOLD ALERT SYSTEM**
    try {
      await checkAndSendThresholdAlerts(
        id,
        email,
        currentTotal,
        budget,
        resetCycle,
        baseCurrency,
        expense,
        budgetPeriodData,
        preference
      );
    } catch (alertError) {
      // Don't fail expense creation if alerts fail
      console.error("Error sending threshold alerts:", alertError);
    }

    return res.status(200).json({
      success: true,
      message: "Added expense successfully",
      expense,
      budgetStatus: {
        currentPeriodTotal: currentTotal,
        budget: budget,
        budgetExceeded: budget > 0 && currentTotal > budget,
        remaining: budget > 0 ? Math.max(0, budget - currentTotal) : null,
        resetCycle,
        periodStart: budgetPeriodData.startDate,
        periodEnd: budgetPeriodData.endDate,
      },
    });
  } catch (error) {
    console.error("Error adding expense:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while adding expense",
    });
  }
};

exports.getAllExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Get query parameters for filtering
    const { category, startDate, endDate, page = 1, limit = 100 } = req.query;

    // Build filter object
    const filter = { user: userId };

    if (category) {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch expenses with filtering and pagination, sorted by date (newest first)
    const expenses = await Expense.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalCount = await Expense.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message:
        expenses.length > 0
          ? "Fetched transactions successfully"
          : "No transactions found",
      expenses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + expenses.length < totalCount,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error getting expenses:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting expenses",
    });
  }
};

// Get expense totals for week, month, year + current budget status
exports.getExpenseTotals = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user preferences
    const preference = await Preference.findOne({ user: userId }).select(
      "baseCurrency budget resetCycle notifications"
    );

    const baseCurrency = preference?.baseCurrency || "INR";
    const budget = preference?.budget || 0;
    const resetCycle = preference?.resetCycle || "monthly";

    // Calculate display totals (these are always week/month/year regardless of reset cycle)
    const [weekTotal, monthTotal, yearTotal] = await Promise.all([
      calculateExpensesForPeriod(userId, "week"),
      calculateExpensesForPeriod(userId, "month"),
      calculateExpensesForPeriod(userId, "year"),
    ]);

    // Calculate current budget period (uses caching)
    const budgetPeriodData = await calculateCurrentBudgetPeriodExpenses(
      userId,
      resetCycle
    );

    return res.status(200).json({
      success: true,
      message: "Expense totals fetched successfully",
      totals: {
        week: {
          total: weekTotal.total,
          count: weekTotal.count,
          period: "This Week",
          startDate: weekTotal.startDate,
          endDate: weekTotal.endDate,
        },
        month: {
          total: monthTotal.total,
          count: monthTotal.count,
          period: "This Month",
          startDate: monthTotal.startDate,
          endDate: monthTotal.endDate,
        },
        year: {
          total: yearTotal.total,
          count: yearTotal.count,
          period: "This Year",
          startDate: yearTotal.startDate,
          endDate: yearTotal.endDate,
        },
      },
      budgetInfo: {
        budget: budget,
        resetCycle,
        currentPeriodTotal: budgetPeriodData.total,
        currentPeriodCount: budgetPeriodData.count,
        remaining:
          budget > 0 ? Math.max(0, budget - budgetPeriodData.total) : null,
        exceeded: budget > 0 && budgetPeriodData.total > budget,
        percentageUsed:
          budget > 0 ? Math.round((budgetPeriodData.total / budget) * 100) : 0,
        periodStart: budgetPeriodData.startDate,
        periodEnd: budgetPeriodData.endDate,
        periodDescription: `Current ${resetCycle} period`,
      },
      currency: baseCurrency,
    });
  } catch (error) {
    console.error("Error getting expense totals:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting expense totals",
    });
  }
};

// Utility function to invalidate cache when expenses are modified/deleted
exports.invalidateUserBudgetCache = async (userId, resetCycle) => {
  await cacheManager.invalidateBudgetCache(userId, resetCycle);
};
