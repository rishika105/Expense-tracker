const { default: Expense } = require("../models/Expense");
const Preference = require("../models/Preference");
const emailQueue = require("../utils/emailQueue");
const Redis = require("ioredis");

// Redis connection for caching
const redis = new Redis(process.env.VALKEY_URL || "redis://localhost:6379");

const primaryApiBase =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1";
const fallbackApiBase = "https://latest.currency-api.pages.dev/v1";

const fetchWithFallback = async (endpoint) => {
  try {
    const response = await fetch(`${primaryApiBase}${endpoint}`);
    if (!response.ok) throw new Error("Primary API failed");
    return await response.json();
  } catch (error) {
    console.log("Primary API failed, trying fallback...", error);
    try {
      const response = await fetch(`${fallbackApiBase}${endpoint}`);
      if (!response.ok) throw new Error("Fallback API failed");
      return await response.json();
    } catch (fallbackError) {
      throw new Error(`Both APIs failed: ${fallbackError.message}`);
    }
  }
};

const fetchExchangeRates = async (baseCurrency) => {
  const data = await fetchWithFallback(
    `/currencies/${baseCurrency.toLowerCase()}.json`
  );
  return data[baseCurrency.toLowerCase()] || {};
};

// Helper function to get date range for current period based on reset cycle
const getCurrentPeriodDateRange = (resetCycle) => {
  const now = new Date();
  let startDate;

  switch (resetCycle) {
    case "weekly":
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + daysToMonday
      );
      startDate.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "yearly":
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
  }

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

// Helper function to get date ranges for display periods
const getDisplayPeriodDateRange = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case "week":
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + daysToMonday
      );
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

// **CACHE MANAGEMENT FUNCTIONS**

// Generate cache key for budget totals
const getBudgetCacheKey = (userId, resetCycle) => {
  const { startDate } = getCurrentPeriodDateRange(resetCycle);
  const periodKey = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
  return `budget:${userId}:${resetCycle}:${periodKey}`;
};

// Get cached budget total
const getCachedBudgetTotal = async (userId, resetCycle) => {
  try {
    const cacheKey = getBudgetCacheKey(userId, resetCycle);
    const cachedData = await redis.get(cacheKey);
    
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    console.error("Error getting cached budget total:", error);
    return null;
  }
};

// Set cached budget total
const setCachedBudgetTotal = async (userId, resetCycle, data) => {
  try {
    const cacheKey = getBudgetCacheKey(userId, resetCycle);
    const { startDate, endDate } = getCurrentPeriodDateRange(resetCycle);
    
    // Calculate TTL - cache until end of current period + 1 day
    const ttlMs = endDate.getTime() - Date.now() + (24 * 60 * 60 * 1000);
    const ttlSeconds = Math.max(60, Math.floor(ttlMs / 1000)); // Minimum 1 minute
    
    await redis.setex(cacheKey, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    console.error("Error setting cached budget total:", error);
  }
};

// Update cached budget total incrementally
const updateCachedBudgetTotal = async (userId, resetCycle, newExpenseAmount) => {
  try {
    const cachedData = await getCachedBudgetTotal(userId, resetCycle);
    
    if (cachedData) {
      const updatedData = {
        ...cachedData,
        total: cachedData.total + newExpenseAmount,
        count: cachedData.count + 1,
      };
      await setCachedBudgetTotal(userId, resetCycle, updatedData);
      return updatedData;
    }
    return null;
  } catch (error) {
    console.error("Error updating cached budget total:", error);
    return null;
  }
};

// Invalidate cache (called when expenses are deleted/modified)
const invalidateBudgetCache = async (userId, resetCycle) => {
  try {
    const cacheKey = getBudgetCacheKey(userId, resetCycle);
    await redis.del(cacheKey);
  } catch (error) {
    console.error("Error invalidating budget cache:", error);
  }
};

// Calculate budget period expenses with caching
const calculateCurrentBudgetPeriodExpenses = async (userId, resetCycle) => {
  try {
    // Try cache first
    const cachedData = await getCachedBudgetTotal(userId, resetCycle);
    if (cachedData) {
      console.log("Using cached budget total");
      return cachedData;
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
    await setCachedBudgetTotal(userId, resetCycle, data);
    
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
  const thresholds = preference.alertThresholds || [0.5, 1.0]; // Default: 50% and 100%
  const lastAlertThreshold = preference.lastAlertThreshold || 0;

  console.log("Budget alert check:", {
    progress: (progress * 100).toFixed(1) + "%",
    thresholds,
    lastAlertThreshold
  });

  // Find all thresholds that have been crossed but not yet alerted
  const crossedThresholds = thresholds.filter(
    threshold => progress >= threshold && threshold > lastAlertThreshold
  ).sort((a, b) => a - b); // Sort ascending to send alerts in order

  if (crossedThresholds.length === 0) {
    return;
  }

  // Send alerts for each crossed threshold
  for (const threshold of crossedThresholds) {
    const isOverBudget = threshold >= 1.0;
    const percentageText = (threshold * 100).toFixed(0);
    
    const subject = isOverBudget 
      ? `🚨 Budget Exceeded - ${percentageText}% of your ${resetCycle} limit surpassed`
      : `⚠️ Budget Alert - ${percentageText}% of your ${resetCycle} budget reached`;

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    
    const emailBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 8px;">
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${isOverBudget ? '#dc3545' : '#fd7e14'}; margin: 0; font-size: 28px;">
            ${isOverBudget ? '🚨' : '⚠️'} Budget ${isOverBudget ? 'Exceeded' : 'Alert'}!
          </h1>
        </div>
        
        <div style="background: ${isOverBudget ? '#f8d7da' : '#fff3cd'}; border: 1px solid ${isOverBudget ? '#f5c2c7' : '#ffeaa7'}; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px 0; color: ${isOverBudget ? '#721c24' : '#664d03'};">
            ${isOverBudget ? 'You have exceeded your budget!' : `You've reached ${percentageText}% of your budget`}
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
            <div>
              <strong>Budget:</strong><br>
              <span style="font-size: 16px; color: #28a745;">${baseCurrency} ${budget.toFixed(2)}</span>
            </div>
            <div>
              <strong>Current Expenses:</strong><br>
              <span style="font-size: 16px; color: ${isOverBudget ? '#dc3545' : '#fd7e14'};">${baseCurrency} ${currentTotal.toFixed(2)}</span>
            </div>
          </div>
          ${isOverBudget ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f5c2c7;">
              <strong style="color: #721c24;">Over budget by: ${baseCurrency} ${(currentTotal - budget).toFixed(2)}</strong>
            </div>
          ` : `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ffeaa7;">
              <strong style="color: #664d03;">Remaining: ${baseCurrency} ${(budget - currentTotal).toFixed(2)}</strong>
            </div>
          `}
        </div>

        <div style="background: #e9ecef; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
          <h4 style="margin: 0 0 15px 0; color: #495057;">Latest Expense</h4>
          <div style="font-size: 14px; line-height: 1.6;">
            <strong>${latestExpense.title}</strong><br>
            <span style="color: #6c757d;">${latestExpense.description || 'No description'}</span><br>
            <span style="font-size: 16px; color: #dc3545; font-weight: bold;">
              -${baseCurrency} ${latestExpense.baseAmount.toFixed(2)}
            </span>
            <span style="color: #6c757d; font-size: 12px; margin-left: 10px;">
              ${new Date(latestExpense.date).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div style="background: #f8f9fa; border-radius: 6px; padding: 15px; margin-bottom: 25px; font-size: 14px;">
          <strong>Budget Period:</strong> 
          ${budgetPeriodData.startDate?.toLocaleDateString()} - ${budgetPeriodData.endDate?.toLocaleDateString()}
          <br>
          <strong>Reset Cycle:</strong> ${resetCycle.charAt(0).toUpperCase() + resetCycle.slice(1)}
        </div>

        <div style="text-align: center;">
          <a href="${frontendUrl}/dashboard/budget" 
             style="background: linear-gradient(135deg, #007bff, #0056b3); 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    display: inline-block; 
                    font-weight: bold;
                    box-shadow: 0 3px 10px rgba(0,123,255,0.3);
                    transition: all 0.3s ease;">
            📊 View Budget Dashboard
          </a>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 12px; margin: 0;">
            This is an automated alert from your Expense Tracker.<br>
            You can manage your notification preferences in your dashboard settings.
          </p>
        </div>
      </div>
    </div>`;

    // Add email to queue instead of sending immediately
    try {
      await emailQueue.add('budget-alert', {
        email,
        subject,
        body: emailBody,
        userId,
        threshold,
        currentTotal,
        budget,
        resetCycle
      }, {
        priority: isOverBudget ? 1 : 5, // Higher priority for over-budget alerts
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      console.log(`Queued budget alert email for ${percentageText}% threshold`);
    } catch (emailError) {
      console.error(`Failed to queue budget alert email for ${percentageText}% threshold:`, emailError);
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
      baseAmount = amount * rates[baseCurrency.toLowerCase()];
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

    // **PERFORMANCE OPTIMIZATION: Update cache incrementally**
    let budgetPeriodData = await updateCachedBudgetTotal(id, resetCycle, baseAmount);
    
    // If cache update failed, recalculate (fallback)
    if (!budgetPeriodData) {
      budgetPeriodData = await calculateCurrentBudgetPeriodExpenses(id, resetCycle);
    }

    const currentTotal = budgetPeriodData.total;

    console.log("Current total (optimized):", currentTotal);
    console.log("Budget:", budget);

    // **IMPROVED THRESHOLD ALERT SYSTEM**
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
  await invalidateBudgetCache(userId, resetCycle);
};