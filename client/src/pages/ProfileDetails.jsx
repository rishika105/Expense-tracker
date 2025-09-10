import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProfileDetails,
  updateProfile,
  deleteUser,
} from "../services/authService";
import PreferenceDetails from "../components/PreferenceDetails";
import ConfirmationModal from "../components/ConfirmationModal";
import { useNavigate } from "react-router-dom";

const ProfileDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(null);

  const [profileData, setProfileData] = useState({
    fullName: "",
    userName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch profile data
        const profileResponse = await fetchProfileDetails(token);
        if (profileResponse) {
          setProfileData(profileResponse);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    if (token) {
      loadData();
    }
  }, [token]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    await dispatch(updateProfile(profileData, token));
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    await dispatch(deleteUser(token, navigate));
    setConfirmationModal(false);
  };

  return (
    <div className="w-full md:w-[85%] overflow-auto">
      {/* Main Content */}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Account Settings
        </h1>
        <p className="text-slate-600">
          Manage your profile information and preferences
        </p>
      </div>

      {/* Single Line Navigation */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <h2 className="text-xl font-semibold text-slate-800 p-8 pb-0">
          Profile Information
        </h2>
        <div class="border-b border-slate-200 p-4 w-[95%] text-center ml-4"></div>

        <div className="p-8 max-w-full">
          {/* Profile */}
          <div>
            <div className="flex">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 ml-auto text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors duration-200"
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
                    value={profileData?.fullName || ""}
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
                    value={profileData?.userName || ""}
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
                    value={profileData?.email || ""}
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
                    value={profileData?.phone || ""}
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
                    value={profileData?.dateOfBirth || ""}
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
                    value={profileData?.gender || ""}
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
                    <option value="prefer-not-to-say">Prefer not to say</option>
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

          {/* Preferences  */}
          <PreferenceDetails />

          {/* Account Management  */}
          <div className="mt-8">
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Delete Account
                </h3>
                <p className="text-red-600 mb-4">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </p>
                <button
                  onClick={() =>
                    setConfirmationModal({
                      text1: "Confirm Account Deletion",
                      text2:
                        "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed",
                      btn1Text: "Delete",
                      btn2Text: "Cancel",
                      btn1Handler: () => handleDeleteAccount(),
                      btn2Handler: () => setConfirmationModal(null),
                    })
                  }
                  className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmationModal ? (
        <ConfirmationModal modalData={confirmationModal} />
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default ProfileDetails;
