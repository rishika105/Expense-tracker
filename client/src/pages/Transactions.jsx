"use client"

import { useState, useEffect } from "react"

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
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

  // Mock data for demonstration - replace with actual API call
  const mockTransactions = [
    {
      _id: "1",
      title: "Grocery Shopping",
      description: "Weekly groceries from supermarket",
      amount: 120.5,
      currency: "USD",
      baseAmount: 120.5,
      baseCurrency: "USD",
      category: "Food",
      paymentMethod: "Credit Card",
      date: "2024-01-15T10:30:00Z",
      createdAt: "2024-01-15T10:30:00Z",
    },
    {
      _id: "2",
      title: "Gas Station",
      description: "Fuel for car",
      amount: 45.0,
      currency: "USD",
      baseAmount: 45.0,
      baseCurrency: "USD",
      category: "Transport",
      paymentMethod: "Debit Card",
      date: "2024-01-14T08:15:00Z",
      createdAt: "2024-01-14T08:15:00Z",
    },
    {
      _id: "3",
      title: "Netflix Subscription",
      description: "Monthly streaming service",
      amount: 15.99,
      currency: "USD",
      baseAmount: 15.99,
      baseCurrency: "USD",
      category: "Entertainment",
      paymentMethod: "Credit Card",
      date: "2024-01-13T12:00:00Z",
      createdAt: "2024-01-13T12:00:00Z",
    },
    {
      _id: "4",
      title: "Coffee Shop",
      description: "Morning coffee and pastry",
      amount: 8.5,
      currency: "USD",
      baseAmount: 8.5,
      baseCurrency: "USD",
      category: "Food",
      paymentMethod: "Cash",
      date: "2024-01-12T07:45:00Z",
      createdAt: "2024-01-12T07:45:00Z",
    },
    {
      _id: "5",
      title: "Rent Payment",
      description: "Monthly apartment rent",
      amount: 1200.0,
      currency: "USD",
      baseAmount: 1200.0,
      baseCurrency: "USD",
      category: "Housing",
      paymentMethod: "Bank Transfer",
      date: "2024-01-01T09:00:00Z",
      createdAt: "2024-01-01T09:00:00Z",
    },
  ]

  const categories = [
    "Food",
    "Transport",
    "Housing",
    "Entertainment",
    "Shopping",
    "Healthcare",
    "Education",
    "Utilities",
    "Other",
  ]

  const paymentMethods = ["Credit Card", "Debit Card", "Cash", "Bank Transfer", "Digital Wallet"]

  // Simulate API call
  const fetchTransactions = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Filter mock data based on current filters
      let filteredData = [...mockTransactions]

      if (filters.category) {
        filteredData = filteredData.filter((t) => t.category === filters.category)
      }

      if (filters.startDate) {
        filteredData = filteredData.filter((t) => new Date(t.date) >= new Date(filters.startDate))
      }

      if (filters.endDate) {
        filteredData = filteredData.filter((t) => new Date(t.date) <= new Date(filters.endDate))
      }

      // Simulate pagination
      const startIndex = (filters.page - 1) * filters.limit
      const endIndex = startIndex + filters.limit
      const paginatedData = filteredData.slice(startIndex, endIndex)

      setTransactions(paginatedData)
      setPagination({
        currentPage: filters.page,
        totalPages: Math.ceil(filteredData.length / filters.limit),
        totalCount: filteredData.length,
        hasNext: endIndex < filteredData.length,
        hasPrev: filters.page > 1,
      })
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [filters])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }))
  }

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }))
  }

  const getCategoryIcon = (category) => {
    const iconMap = {
      Food: "🍽️",
      Transport: "🚗",
      Housing: "🏠",
      Entertainment: "🎬",
      Shopping: "🛍️",
      Healthcare: "🏥",
      Education: "📚",
      Utilities: "⚡",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Transactions</h1>
          <p className="text-slate-600">Track and manage your expenses</p>
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
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4">
            <button
              onClick={() =>
                setFilters({
                  category: "",
                  startDate: "",
                  endDate: "",
                  page: 1,
                  limit: 10,
                })
              }
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
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No transactions found</h3>
              <p className="text-slate-600">Try adjusting your filters or add some transactions.</p>
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
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = pagination.currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        pageNum === pagination.currentPage
                          ? "bg-blue-600 text-white"
                          : "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>

            <div className="text-sm text-slate-600">Total: {pagination.totalCount} transactions</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Transactions
