"use client"

export default function Error({
  errorCode = "404",
  title = "Page Not Found",
  message = "Sorry, we couldn't find the page you're looking for.",
  onGoBack = () => window.history.back(),
  onGoHome = () => (window.location.href = "/"),
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-6xl font-bold text-slate-800 mb-2">{errorCode}</h1>
        </div>

        {/* Error Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">{title}</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">{message}</p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onGoBack}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200 hover:shadow-md"
            >
              Go Back
            </button>
            <button
              onClick={onGoHome}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Go to Dashboard
            </button>
          </div>
        </div>

        {/* Additional Help */}
        <div className="text-sm text-slate-500">
          <p>Need help? Contact our support team</p>
          <a href="mailto:support@expensetracker.com" className="text-blue-600 hover:text-blue-700 font-medium">
            support@expensetracker.com
          </a>
        </div>
      </div>
    </div>
  )
}
