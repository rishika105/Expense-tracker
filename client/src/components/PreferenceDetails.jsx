import React, { useEffect, useState } from "react";
import {
  fetchUserPreferences,
  updatePreference,
} from "../services/preferenceService";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrencies } from "../services/currencyApi";

const PreferenceDetails = () => {
  const [isEditingPref, setIsEditingPref] = useState(false);
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [currencies, setCurrencies] = useState([]);
  const [preferencesData, setPreferencesData] = useState({
    baseCurrency: "INR",
    budget: 0,
    notifications: true,
    resetCycle: "monthly",
  });

  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setPreferencesData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setPreferencesData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const fetchAllCurrencies = async () => {
    const response = await fetchCurrencies();
    setCurrencies(response);
  };

  useEffect(() => {
    fetchAllCurrencies();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch preferences data
        const prefResponse = await fetchUserPreferences(token);
        if (prefResponse) {
          setPreferencesData(prefResponse);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    if (token) {
      loadData();
    }
  }, [token]);

  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    console.log(preferencesData)
    await dispatch(updatePreference(preferencesData, token));
    setIsEditingPref(false);
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-slate-800">Your Preferences</h2>
      <div class="border-b border-slate-200 p-4"></div>

      <div className="flex mt-6">
        <button
          onClick={() => setIsEditingPref(!isEditingPref)}
          className="px-4 py-2 ml-auto text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors duration-200"
        >
          {isEditingPref ? "Cancel" : "Edit Preference"}
        </button>
      </div>

      <form onSubmit={handleUpdatePreferences} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Base Currency
            </label>
            <select
              name="baseCurrency"
              value={preferencesData?.baseCurrency || "INR"}
              onChange={handlePreferenceChange}
              disabled={!isEditingPref}
              className={`w-full px-4 py-3 border border-slate-200 rounded-xl transition-all duration-200 text-slate-700 ${
                isEditingPref
                  ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  : "bg-slate-50"
              }`}
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-slate-500 mt-2">
              All analytics and totals are calculated in this currency
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Your Budget
            </label>
            <input
              type="number"
              name="budget"
              value={preferencesData?.budget || ""}
              onChange={handlePreferenceChange}
              disabled={!isEditingPref}
              className={`w-full px-4 py-3 border border-slate-200 rounded-xl transition-all duration-200 text-slate-700 ${
                isEditingPref
                  ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  : "bg-slate-50"
              }`}
            />
            <p className="text-sm text-slate-500 mt-2">
              This is your budget for your one reset cycle. You will get alerts
              if budget exceeds your limit.
            </p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Budget Reset Cycle
          </label>
          <select
            name="resetCycle"
            value={preferencesData?.resetCycle || "monthly"}
            onChange={handlePreferenceChange}
            disabled={!isEditingPref}
            className={`w-full px-4 py-3 border border-slate-200 rounded-xl transition-all duration-200 text-slate-700 ${
              isEditingPref
                ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                : "bg-slate-50"
            }`}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="yearly">Yearly</option>
          </select>
          <p className="text-sm text-slate-500 mt-2">
            Your budget limit will reset {preferencesData.resetCycle}.
          </p>
        </div>

        <div>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name="notifications"
              checked={preferencesData?.notifications || false}
              onChange={handlePreferenceChange}
              disabled={!isEditingPref}
              className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-slate-700 font-medium">
                Enable Notifications
              </span>
              <p className="text-sm text-slate-500">
                Receive budget alerts and important updates
              </p>
            </div>
          </label>
        </div>

        <div className="pt-4">
          {isEditingPref ? (
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Update Preferences
            </button>
          ) : (
            <div></div>
          )}
        </div>
      </form>
    </div>
  );
};

export default PreferenceDetails;
