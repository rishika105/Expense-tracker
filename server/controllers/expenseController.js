const { default: Expense } = require("../models/Expense");
const Preference = require("../models/Preference");
const fetch = require("node-fetch"); // for server-side API calls
const emailSender = require("../utils/emailSender");

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
      throw new Error("Both APIs failed", fallbackError);
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
    case 'weekly':
      // Start from Monday of current week
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToMonday);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      // Default to monthly
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
  }

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

// Helper function to get date ranges for display periods (always calculated from current date)
const getDisplayPeriodDateRange = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      // This week (Monday to Sunday)
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToMonday);
      break;
    case 'month':
      // This month (1st to last day)
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      // This year (Jan 1 to Dec 31)
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

// Calculate total expenses for a specific period
const calculateExpensesForPeriod = async (userId, period) => {
  try {
    const { startDate, endDate } = getDisplayPeriodDateRange(period);
    
    const expenses = await Expense.find({
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    const total = expenses.reduce((sum, expense) => sum + expense.baseAmount, 0);
    
    return {
      period,
      total,
      count: expenses.length,
      startDate,
      endDate
    };
  } catch (error) {
    console.error(`Error calculating ${period} expenses:`, error);
    return {
      period,
      total: 0,
      count: 0,
      startDate: null,
      endDate: null
    };
  }
};

// Calculate current budget period expenses (based on user's reset cycle)
const calculateCurrentBudgetPeriodExpenses = async (userId, resetCycle) => {
  try {
    const { startDate, endDate } = getCurrentPeriodDateRange(resetCycle);
    
    const expenses = await Expense.find({
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).lean();

    const total = expenses.reduce((sum, expense) => sum + expense.baseAmount, 0);
    
    return {
      total,
      count: expenses.length,
      startDate,
      endDate,
      resetCycle
    };
  } catch (error) {
    console.error('Error calculating budget period expenses:', error);
    return {
      total: 0,
      count: 0,
      startDate: null,
      endDate: null,
      resetCycle
    };
  }
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

    // get user's preferences
    const preference = await Preference.findOne({ user: id }).select(
      "baseCurrency resetCycle budget notifications"
    );
    
    const baseCurrency = preference?.baseCurrency || currency;
    const resetCycle = preference?.resetCycle || 'monthly';
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

    // create expense
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

    // Calculate current budget period total AFTER adding the expense
    const budgetPeriodData = await calculateCurrentBudgetPeriodExpenses(id, resetCycle);
    const currentTotal = budgetPeriodData.total;

    // Check if budget is exceeded and send email if notifications are enabled
    if (budget > 0 && currentTotal > budget && preference?.notifications) {
      const frontendUrl = process.env.VITE_API_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
      
      try {
        await emailSender(
          email,
          `Budget Exceeded - Your ${resetCycle} limit has been surpassed`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">🚨 Budget Alert!</h2>
            <p>You have set a budget of <strong>${baseCurrency} ${budget.toFixed(2)}</strong> for this ${resetCycle}, but your current expenses total <strong>${baseCurrency} ${currentTotal.toFixed(2)}</strong>.</p>
            <p>This means you have exceeded your budget by <strong>${baseCurrency} ${(currentTotal - budget).toFixed(2)}</strong>.</p>
            <p>Latest expense: <strong>${title}</strong> - ${baseCurrency} ${baseAmount.toFixed(2)}</p>
            <hr style="margin: 20px 0;">
            <p><strong>Budget Period:</strong> ${budgetPeriodData.startDate?.toLocaleDateString()} to ${budgetPeriodData.endDate?.toLocaleDateString()}</p>
            <a href="${frontendUrl}/dashboard/budget" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">View Budget Dashboard</a>
          </div>
          `
        );
      } catch (emailError) {
        console.error('Failed to send budget alert email:', emailError);
        // Don't fail the expense creation if email fails
      }
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
        periodEnd: budgetPeriodData.endDate
      }
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
    const { 
      category, 
      startDate, 
      endDate,
      page = 1,
      limit = 100 
    } = req.query;

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
      message: expenses.length > 0 ? "Fetched transactions successfully" : "No transactions found",
      expenses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + expenses.length < totalCount,
        hasPrev: parseInt(page) > 1
      }
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
      'baseCurrency budget resetCycle notifications'
    );
    
    const baseCurrency = preference?.baseCurrency || 'INR';
    const budget = preference?.budget || 0;
    const resetCycle = preference?.resetCycle || 'monthly';

    // Calculate display totals (these are always week/month/year regardless of reset cycle)
    const [weekTotal, monthTotal, yearTotal] = await Promise.all([
      calculateExpensesForPeriod(userId, 'week'),
      calculateExpensesForPeriod(userId, 'month'),
      calculateExpensesForPeriod(userId, 'year')
    ]);

    // Calculate current budget period (based on user's reset cycle)
    const budgetPeriodData = await calculateCurrentBudgetPeriodExpenses(userId, resetCycle);

    return res.status(200).json({
      success: true,
      message: "Expense totals fetched successfully",
      totals: {
        week: {
          total: weekTotal.total,
          count: weekTotal.count,
          period: 'This Week',
          startDate: weekTotal.startDate,
          endDate: weekTotal.endDate
        },
        month: {
          total: monthTotal.total,
          count: monthTotal.count,
          period: 'This Month',
          startDate: monthTotal.startDate,
          endDate: monthTotal.endDate
        },
        year: {
          total: yearTotal.total,
          count: yearTotal.count,
          period: 'This Year',
          startDate: yearTotal.startDate,
          endDate: yearTotal.endDate
        }
      },
      budgetInfo: {
        budget: budget,
        resetCycle,
        currentPeriodTotal: budgetPeriodData.total,
        currentPeriodCount: budgetPeriodData.count,
        remaining: budget > 0 ? Math.max(0, budget - budgetPeriodData.total) : null,
        exceeded: budget > 0 && budgetPeriodData.total > budget,
        percentageUsed: budget > 0 ? Math.round((budgetPeriodData.total / budget) * 100) : 0,
        periodStart: budgetPeriodData.startDate,
        periodEnd: budgetPeriodData.endDate,
        periodDescription: `Current ${resetCycle} period`
      },
      currency: baseCurrency
    });
  } catch (error) {
    console.error("Error getting expense totals:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting expense totals",
    });
  }
};