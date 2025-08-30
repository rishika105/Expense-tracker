"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { addPreference } from "../services/preferenceService"
import { currencies } from "currencies.json"

const PreferencesSetup = () => {
  // console.log(currencies)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { token } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    baseCurrency: "INR",
    monthlyBudget: "",
    notifications: true,
    resetCycle: "monthly",
  })


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log("Preferences data:", formData)
    await dispatch(addPreference(formData, token))
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Personalize Your Experience</h1>
          <p className="text-slate-600">Set up your preferences to get the most out of your expense tracking</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Base Currency */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Base Currency</label>
              <select
                name="baseCurrency"
                value={formData.baseCurrency}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-slate-500 mt-2">
                This is your preferred currency for entering expenses. You can always change the currency while adding
                transactions, but all analytics and totals will be converted and calculated in this base currency only.
              </p>
            </div>

            {/* Monthly Budget */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Budget</label>
              <input
                type="number"
                name="monthlyBudget"
                value={formData.monthlyBudget}
                onChange={handleChange}
                placeholder="Enter your monthly budget limit"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
              />
              <p className="text-sm text-slate-500 mt-2">
                Set a monthly spending limit to help track your expenses and receive budget alerts.
              </p>
            </div>

            {/* Notifications */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notifications"
                  checked={formData.notifications}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-slate-700 font-semibold">Enable Notifications</span>
                  <p className="text-sm text-slate-500">
                    Receive alerts for budget limits, reminders, and important updates
                  </p>
                </div>
              </label>
            </div>

            {/* Reset Cycle */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Budget Reset Cycle</label>
              <select
                name="resetCycle"
                value={formData.resetCycle}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
              <p className="text-sm text-slate-500 mt-2">
                Choose how often your budget and spending statistics should reset.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Save Preferences & Continue
              </button>
            </div>
          </form>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <div className="w-8 h-1 bg-blue-600 rounded"></div>
            <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
          </div>
          <p className="text-sm text-slate-500 mt-2">Step 2 of 2</p>
        </div>
      </div>
    </div>
  )
}

export default PreferencesSetup
