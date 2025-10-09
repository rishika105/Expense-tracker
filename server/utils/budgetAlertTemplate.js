export function budgetAlertTemplate({
  threshold,
  resetCycle,
  baseCurrency,
  budget,
  currentTotal,
  latestExpense,
  budgetPeriodData,
}) {
  const isOverBudget = threshold >= 1.0;
  const percentageText = (threshold * 100).toFixed(0);
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  return `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 8px;">
    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: ${isOverBudget ? "#dc3545" : "#fd7e14"}; margin: 0; font-size: 28px;">
          ${isOverBudget ? "🚨" : "⚠️"} Budget ${isOverBudget ? "Exceeded" : "Alert"}!
        </h1>
      </div>
      
      <div style="background: ${isOverBudget ? "#f8d7da" : "#fff3cd"}; border: 1px solid ${isOverBudget ? "#f5c2c7" : "#ffeaa7"}; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; color: ${isOverBudget ? "#721c24" : "#664d03"};">
          ${isOverBudget
            ? "You have exceeded your budget!"
            : `You've reached ${percentageText}% of your budget`}
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
          <div>
            <strong>Budget:</strong><br>
            <span style="font-size: 16px; color: #28a745;">${baseCurrency} ${budget.toFixed(2)}</span>
          </div>
          <div>
            <strong>Current Expenses:</strong><br>
            <span style="font-size: 16px; color: ${isOverBudget ? "#dc3545" : "#fd7e14"};">${baseCurrency} ${currentTotal.toFixed(2)}</span>
          </div>
        </div>
        ${
          isOverBudget
            ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f5c2c7;">
            <strong style="color: #721c24;">Over budget by: ${baseCurrency} ${(currentTotal - budget).toFixed(2)}</strong>
          </div>
        `
            : `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ffeaa7;">
            <strong style="color: #664d03;">Remaining: ${baseCurrency} ${(budget - currentTotal).toFixed(2)}</strong>
          </div>
        `
        }
      </div>

      <div style="background: #e9ecef; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
        <h4 style="margin: 0 0 15px 0; color: #495057;">Latest Expense</h4>
        <div style="font-size: 14px; line-height: 1.6;">
          <strong>${latestExpense.title}</strong><br>
          <span style="color: #6c757d;">${latestExpense.description || "No description"}</span><br>
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
        ${new Date(budgetPeriodData.startDate).toLocaleDateString()} - ${new Date(budgetPeriodData.endDate).toLocaleDateString()}
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
}
