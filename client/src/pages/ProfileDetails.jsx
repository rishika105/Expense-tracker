import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProfileDetails,
  updateProfile,
  deleteUser,
} from "../services/authService";
import {
  fetchUserPreferences,
  updatePreference,
} from "../services/preferenceService";
import Sidebar from "../components/Sidebar";

const ProfileDetails = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: "",
    userName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
  });

  const [preferencesData, setPreferencesData] = useState({
    baseCurrency: "INR",
    monthlyBudget: "",
    notifications: true,
    resetCycle: "monthly",
  });

  useEffect(() => {
    // Fetch user data on component mount
    dispatch(fetchProfileDetails(token));
    dispatch(fetchUserPreferences(token));
  }, [dispatch, token]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    await dispatch(updateProfile(profileData, token));
    setIsEditing(false);
  };

  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    await dispatch(updatePreference(preferencesData, token));
  };

  const handleDeleteAccount = async () => {
    await dispatch(deleteUser(token));
    setShowDeleteModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Account Settings
          </h1>
          <p className="text-slate-600">
            Manage your profile information and preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-slate-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === "profile"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab("preferences")}
                className={`px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === "preferences"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Preferences
              </button>
              <button
                onClick={() => setActiveTab("account")}
                className={`px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === "account"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Account Management
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">
                    Profile Information
                  </h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                  >
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={profileData.fullName}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-slate-200 rounded-xl transition-all duration-200 text-slate-700 ${
                          isEditing
                            ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            : "bg-slate-50"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        name="userName"
                        value={profileData.userName}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-slate-200 rounded-xl transition-all duration-200 text-slate-700 ${
                          isEditing
                            ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            : "bg-slate-50"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-slate-200 rounded-xl transition-all duration-200 text-slate-700 ${
                          isEditing
                            ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            : "bg-slate-50"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={profileData.dateOfBirth}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-slate-200 rounded-xl transition-all duration-200 text-slate-700 ${
                          isEditing
                            ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            : "bg-slate-50"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={profileData.gender}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-slate-200 rounded-xl transition-all duration-200 text-slate-700 ${
                          isEditing
                            ? "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            : "bg-slate-50"
                        }`}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">
                          Prefer not to say
                        </option>
                      </select>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Update Profile
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-6">
                  Your Preferences
                </h2>

                <form onSubmit={handleUpdatePreferences} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Base Currency
                      </label>
                      <select
                        name="baseCurrency"
                        value={preferencesData.baseCurrency}
                        onChange={handlePreferenceChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
                      >
                        <option value="USD">$ US Dollar</option>
                        <option value="EUR">€ Euro</option>
                        <option value="GBP">£ British Pound</option>
                        <option value="INR">₹ Indian Rupee</option>
                        <option value="JPY">¥ Japanese Yen</option>
                        <option value="CAD">C$ Canadian Dollar</option>
                        <option value="AUD">A$ Australian Dollar</option>
                      </select>
                      <p className="text-sm text-slate-500 mt-1">
                        All analytics and totals are calculated in this currency
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Monthly Budget
                      </label>
                      <input
                        type="number"
                        name="monthlyBudget"
                        value={preferencesData.monthlyBudget}
                        onChange={handlePreferenceChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Budget Reset Cycle
                    </label>
                    <select
                      name="resetCycle"
                      value={preferencesData.resetCycle}
                      onChange={handlePreferenceChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="notifications"
                        checked={preferencesData.notifications}
                        onChange={handlePreferenceChange}
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
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Update Preferences
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Account Management Tab */}
            {activeTab === "account" && (
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-6">
                  Account Management
                </h2>

                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                      Delete Account
                    </h3>
                    <p className="text-red-600 mb-4">
                      Once you delete your account, there is no going back.
                      Please be certain.
                    </p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Confirm Account Deletion
              </h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete your account? This action cannot
                be undone and all your data will be permanently removed.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDetails;
