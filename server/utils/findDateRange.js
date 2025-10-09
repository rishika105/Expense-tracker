
// Helper function to get date range for current period based on reset cycle
export const getCurrentPeriodDateRange = (resetCycle) => {
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
export const getDisplayPeriodDateRange = (period) => {
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
