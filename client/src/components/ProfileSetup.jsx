import React, { useState } from "react";
import "react-phone-number-input/style.css";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "../services/authService";

const ProfileSetup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Profile setup data:", formData);
    // Handle form submission here
    await dispatch(updateProfile(formData, token));
    navigate("/preferences");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-slate-600">
            Help us personalize your expense tracking experience
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                placeholder="Choose a unique username"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
                required
              />
            </div>

            {/* Date of Birth & Gender Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Phone Number
              </label>

              <PhoneInput
                placeholder="Enter phone number"
                defaultCountry="IN" // or your preferred default
                value={formData.phone}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    phone: value, // phone number comes directly here
                  })
                }
                error={
                  formData.phone
                    ? isValidPhoneNumber(formData.phone)
                      ? undefined
                      : "Invalid phone number"
                    : "Phone number required"
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-200 text-slate-700"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Complete Profile Setup
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
            <div className="w-8 h-1 bg-slate-300 rounded"></div>
            <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
          </div>
          <p className="text-sm text-slate-500 mt-2">Step 1 of 3</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
