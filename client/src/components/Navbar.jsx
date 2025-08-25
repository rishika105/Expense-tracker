import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { sendOtp, verifyEmail } from "../services/authService";
import OtpInput from "react-otp-input";
import { useNavigate } from "react-router-dom";
import { clearToken } from "../slices/authSlice";
import toast from "react-hot-toast";

const Navbar = () => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const { token, user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // handle send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    await dispatch(sendOtp(email, navigate));
    setShowEmailModal(false);
    setShowOtpModal(true);
  };

  // handle verify OTP
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    await dispatch(verifyEmail(email, otp, navigate));
    setShowOtpModal(false);
  };

  const handleLogout = () => {
    // dispatch logout action here
    dispatch(clearToken());
    toast.success("Log out success");
  };

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">
                ExpenseTracker
              </span>
            </div>

            {/* Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Dashboard
              </a>
              <a
                href="#"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Transactions
              </a>
              <a
                href="#"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Reports
              </a>
              <a
                href="#"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Settings
              </a>
            </div>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {token ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {user?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Welcome Back
                </h2>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Verify Email
                  </h2>
                  <p className="text-slate-600 mt-1">
                    Enter the 6-digit code sent to {email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowOtpModal(false);
                    setShowEmailModal(true);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleVerifyEmail} className="space-y-6">
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  numInputs={6}
                  separator={<span>-</span>}
                  renderInput={(props) => (
                    <input
                      {...props}
                      placeholder="-"
                      style={{
                        boxShadow:
                          "inset 0px -1px 0px rgba(255, 255, 255, 0.18)",
                      }}
                      className="w-12 h-12 text-center text-xl text-slate-800 font-bold border-1 border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  )}
                  containerStyle="flex justify-center space-x-3"
                />

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Signin"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    setShowEmailModal(true);
                  }}
                  className="w-full text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Change Email
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
