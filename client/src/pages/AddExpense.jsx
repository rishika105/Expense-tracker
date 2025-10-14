import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addExpense } from "../services/expenseService";
import { fetchCurrencies } from "../services/currencyApi";

const AddExpense = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    currency: "INR",
    category: "",
    // Default today's date in correct format
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const fetchAllCurrencies = async () => {
    const response = await fetchCurrencies();
    setCurrencies(response);
  };

  useEffect(() => {
    fetchAllCurrencies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const expenseData = {
      ...formData,
      amount: parseFloat(parseFloat(formData.amount).toFixed(2)), // keeps 2 decimal precision
    };

    console.log("Expense data:", expenseData);
    await dispatch(addExpense(expenseData, token));
    setFormData({
      title: "",
      description: "",
      amount: "",
      currency: "INR",
      category: "",
      // Default today's date in correct format
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "",
    });
  };

  const categories = [
    "Housing(Rent, maintainence, Utilities, etc.)",
    "Food(Groceries, Dining, etc.)",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Bills(Water, Electricity, etc.)",
    "Healthcare",
    "Travel",
    "Education",
    "Other",
  ];

  const paymentMethods = [
    "Cash",
    "UPI",
    "Debit Card",
    "Credit Card",
    "Net Banking",
    "Digital Wallet",
    "Cheque",
    "Other",
  ];

  return (
    <div className="max-w-full md:max-w-[75%]">
      {/* Header */}
      <div className="text-left mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Add New Expense
        </h1>
        <p className="text-slate-600">
          Track your spending and stay within budget
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Lunch at restaurant"
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional details about this expense"
              rows="3"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700 resize-none"
            />
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Amount *
              </label>
              <input
                type="text"
                name="amount"
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only digits + one decimal point + up to 2 decimals
                  //automatic rounding of 10 to 9.99 browser does when i write 10
                  if (/^\d*\.?\d{0,2}$/.test(value)) {
                    setFormData((prev) => ({ ...prev, amount: value }));
                  }
                }}
                placeholder="0.00"
                inputMode="decimal"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-2 w-full">
            Note: The amount will automatically be saved in your base currency
            for analytics. Although both amounts are visible in transactions
            page.
          </p>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Payment Method *
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
            >
              <option value="">Select payment method</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding Expense...</span>
                </div>
              ) : (
                "Add Expense"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;
