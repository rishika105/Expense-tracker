import toast from "react-hot-toast";

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

export const fetchCurrencies = async () => {
  const toastId = toast.loading("Loading...");
  try {
    const data = await fetchWithFallback("/currencies.json");

    const currencyArray = Object.entries(data).map(([code, name]) => ({
      code: code.toUpperCase(),
      name: name,
      symbol: getCurrencySymbol(code.toUpperCase()),
    }));

    const popularCurrencies = [
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "INR",
      "AUD",
      "CAD",
      "CHF",
    ];
    const sortedCurrencies = [
      ...currencyArray.filter((c) => popularCurrencies.includes(c.code)),
      ...currencyArray
        .filter((c) => !popularCurrencies.includes(c.code))
        .sort((a, b) => a.code.localeCompare(b.code)),
    ];

    return sortedCurrencies;
  } catch (error) {
    console.error("Failed to fetch currencies:", error);
  } finally {
    toast.dismiss(toastId);
  }
};

const getCurrencySymbol = (code) => {
  const symbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
    CHF: "Fr",
    CNY: "¥",
    KRW: "₩",
    BRL: "R$",
    RUB: "₽",
  };
  return symbols[code] || code;
};

export const fetchExchangeRates = async (baseCurrency) => {
  try {
    const data = await fetchWithFallback(
      `/currencies/${baseCurrency.toLowerCase()}.json`
    );
    return data[baseCurrency.toLowerCase()] || {};
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    throw error;
  }
};
