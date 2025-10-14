import { useState, useEffect } from "react"
import { getExpenses } from "../services/expenseService"
import { useSelector } from "react-redux"

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
    const { token } = useSelector((state) => state.auth);

  const [filters, setFilters] = useState({
    category: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  })

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  })

  const categories = [
    "Housing(Rent, maintainence, Utilities, etc.)",
    "Food(Groceries, Dining, etc.)",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Bills(Water, Electricity, etc.)",
    "Healthcare",
    "Travel",
    "Education",
    "Other",
  ]

  // API call to fetch transactions
  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Build query parameters - only include non-empty values
      const queryParams = {}
      
      if (filters.category) queryParams.category = filters.category
      if (filters.startDate) queryParams.startDate = filters.startDate
      if (filters.endDate) queryParams.endDate = filters.endDate
      queryParams.page = filters.page
      queryParams.limit = filters.limit

      // Call the API with filters
      const response = await getExpenses(queryParams, token)

      // Backend returns: { success, message, expenses, pagination }
      if (response.success) {
        setTransactions(response.expenses)
        setPagination(response.pagination)
      } else {
        setError(response.message || "Failed to fetch transactions")
        setTransactions([])
      }
    } catch (err) {
      console.error("Error fetching transactions:", err)
      setError(err.message || "Failed to fetch transactions")
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [filters])    //with change of filter it is called again with queries
  

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }))
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({
        ...prev,
        page: newPage,
      }))
    }
  }

  const getCategoryIcon = (category) => {
    const iconMap = {
      "Food(Groceries, Dining, etc.)": "🍽️",
      Transportation: "🚗",
      "Housing(Rent, maintainence, Utilities, etc.)": "🏠",
      Entertainment: "🎬",
      Shopping: "🛍️",
      Healthcare: "🏥",
      Education: "📚",
      "Bills(Water, Electricity, etc.)": "⚡",
      Travel: "✈️",
      Other: "📦",
    }
    return iconMap[category] || "📦"
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount)
  }

  const clearFilters = () => {
    setFilters({
      category: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 10,
    })
  }

  const renderPaginationButtons = () => {
    const buttons = []
    const { currentPage, totalPages } = pagination
    
    // Always show first page
    if (totalPages > 0) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            1 === currentPage
              ? "bg-blue-600 text-white"
              : "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
          }`}
        >
          1
        </button>
      )
    }

    // Show ellipsis if there's a gap
    if (currentPage > 4 && totalPages > 7) {
      buttons.push(
        <span key="ellipsis1" className="px-2 py-2 text-slate-500">...</span>
      )
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        buttons.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              i === currentPage
                ? "bg-blue-600 text-white"
                : "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
            }`}
          >
            {i}
          </button>
        )
      }
    }

    // Show ellipsis if there's a gap before last page
    if (currentPage < totalPages - 3 && totalPages > 7) {
      buttons.push(
        <span key="ellipsis2" className="px-2 py-2 text-slate-500">...</span>
      )
    }

    // Always show last page if it's not the first page
    if (totalPages > 1) {
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            totalPages === currentPage
              ? "bg-blue-600 text-white"
              : "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
          }`}
        >
          {totalPages}
        </button>
      )
    }

    return buttons
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Transactions</h1>
          <p className="text-slate-600 mt-2">Track and manage your expenses</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Items per page */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Items per page</label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange("limit", Number.parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {transactions.length} of {pagination.totalCount} transactions
            </div>
            <div className="text-sm text-slate-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 text-sm">
                <strong>Error:</strong> {error}
              </div>
              <button
                onClick={fetchTransactions}
                className="ml-auto px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-slate-600">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                No transactions found
              </h3>
              <p className="text-slate-600">
                Try adjusting your filters or add some transactions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl">
                        {getCategoryIcon(transaction.category)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 text-lg">{transaction.title}</h3>
                        <p className="text-slate-600 text-sm mb-1">{transaction.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span className="bg-slate-100 px-2 py-1 rounded-full">{transaction.category}</span>
                          <span>{transaction.paymentMethod}</span>
                          <span>{formatDate(transaction.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-800">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </div>
                      {transaction.currency !== transaction.baseCurrency && (
                        <div className="text-sm text-slate-500">
                          {formatCurrency(transaction.baseAmount, transaction.baseCurrency)} base
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center space-x-1">
                {renderPaginationButtons()}
              </div>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>

            <div className="text-sm text-slate-600">
              Total: {pagination.totalCount} transactions
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Transactions