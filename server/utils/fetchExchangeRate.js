
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

export const fetchExchangeRates = async (baseCurrency) => {
  const data = await fetchWithFallback(
    `/currencies/${baseCurrency.toLowerCase()}.json`
  );
  return data[baseCurrency.toLowerCase()] || {};
};
