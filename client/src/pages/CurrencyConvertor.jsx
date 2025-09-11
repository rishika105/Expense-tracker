import { useState, useEffect } from "react";
import { fetchCurrencies, fetchExchangeRates } from "../services/currencyApi";

const CurrencyConverter = () => {
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("INR");
  const [isLoading, setIsLoading] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({});
  const [error, setError] = useState("");

  const fetchAllCurrencies = async () => {
    const response = await fetchCurrencies();
    setCurrencies(response);
  };

  useEffect(() => {
    fetchAllCurrencies();
  }, []);

  const handleConvert = async (amount, from, to) => {
    if (!amount || amount === "0") {
      setToAmount("");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (from === to) {
        setToAmount(amount);
        setIsLoading(false);
        return;
      }

      if (!exchangeRates[from]) {
        const rates = await fetchExchangeRates(from);
        setExchangeRates((prev) => ({ ...prev, [from]: rates }));

        const rate = rates[to.toLowerCase()];
        if (rate) {
          const converted = (Number.parseFloat(amount) * rate).toFixed(2);
          setToAmount(converted);
        } else {
          throw new Error(`Exchange rate not found for ${from} to ${to}`);
        }
      } else {
        const rate = exchangeRates[from][to.toLowerCase()];
        if (rate) {
          const converted = (Number.parseFloat(amount) * rate).toFixed(2);
          setToAmount(converted);
        } else {
          throw new Error(`Exchange rate not found for ${from} to ${to}`);
        }
      }
    } catch (error) {
      console.error("Conversion failed:", error);
      setError("Conversion failed. Please try again.");
      setToAmount("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFromAmountChange = (e) => {
    const value = e.target.value;
    setFromAmount(value);
    handleConvert(value, fromCurrency, toCurrency);
  };

  const handleToAmountChange = async (e) => {
    const value = e.target.value;
    setToAmount(value);

    if (value && value !== "0") {
      setIsLoading(true);
      try {
        if (!exchangeRates[toCurrency]) {
          const rates = await fetchExchangeRates(toCurrency);
          setExchangeRates((prev) => ({ ...prev, [toCurrency]: rates }));
        }

        const rate = exchangeRates[toCurrency][fromCurrency.toLowerCase()];
        if (rate) {
          const converted = (Number.parseFloat(value) * rate).toFixed(2);
          setFromAmount(converted);
        }
      } catch (error) {
        console.error("Reverse conversion failed:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setFromAmount("");
    }
  };

  const handleFromCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setFromCurrency(newCurrency);
    if (fromAmount) {
      handleConvert(fromAmount, newCurrency, toCurrency);
    }
  };

  const handleToCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setToCurrency(newCurrency);
    if (fromAmount) {
      handleConvert(fromAmount, fromCurrency, newCurrency);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const getCurrentRate = () => {
    if (fromCurrency === toCurrency) return "1.00";
    const rate = exchangeRates[fromCurrency]?.[toCurrency.toLowerCase()];
    return rate ? rate.toFixed(4) : "Loading...";
  };

  return (
    <div className="w-full md:w-[70%]">
      {/* Header */}
      <div className="text-left mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Currency Converter
        </h1>
        <p className="text-slate-600">
          Convert between 200+ currencies with real-time rates
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Converter Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        {/* From Currency */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            From
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                value={fromAmount}
                onChange={handleFromAmountChange}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg"
              />
            </div>
            <div>
              <select
                value={fromCurrency}
                onChange={handleFromCurrencyChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg bg-white"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={swapCurrencies}
            className="p-3 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200 group"
          >
            <svg
              className="w-6 h-6 text-blue-600 group-hover:rotate-180 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* To Currency */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            To
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="number"
                value={toAmount}
                onChange={handleToAmountChange}
                placeholder="Converted amount"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            <div>
              <select
                value={toCurrency}
                onChange={handleToCurrencyChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg bg-white"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Exchange Rate Info */}
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-sm text-slate-600 mb-1">Current Exchange Rate</p>
          <p className="text-lg font-semibold text-slate-800">
            1 {fromCurrency} = {getCurrentRate()} {toCurrency}
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
          Exchange rates are updated daily. Rates may vary for actual
          transactions.
        </p>
      </div>
    </div>
  );
};

export default CurrencyConverter;
