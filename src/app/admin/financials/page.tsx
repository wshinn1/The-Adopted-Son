'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

interface MonthlyData {
  month: string
  monthShort: string
  year: number
  revenue: number
  refunds: number
  netRevenue: number
  transactionCount: number
}

interface Summary {
  totalRevenue: number
  totalRefunds: number
  totalNet: number
  avgMonthlyRevenue: number
  projectedMonthlyRevenue: number
  projectedAnnualRevenue: number
  mrr: number
  arr: number
  activeSubscriptions: number
  totalCustomers: number
}

interface FinancialData {
  monthlyData: MonthlyData[]
  summary: Summary
}

// Chart colors - not using CSS variables as per skill guidelines
const COLORS = {
  revenue: '#2B4A6F',
  refunds: '#B8704D',
  netRevenue: '#5C6B4A',
  projected: '#E8A547',
}

export default function FinancialsPage() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/admin/financials')
        if (!response.ok) throw new Error('Failed to fetch data')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Create projection data for annual chart
  const createProjectionData = () => {
    if (!data) return []
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    const avgMonthly = data.summary.avgMonthlyRevenue
    
    return months.map((month, index) => {
      const existingData = data.monthlyData.find(d => d.monthShort === month)
      const isProjected = index > currentMonth
      
      return {
        month,
        actual: isProjected ? null : (existingData?.netRevenue || 0),
        projected: isProjected ? avgMonthly : null,
      }
    })
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminSidebar user={{ name: 'Admin', email: 'admin@theadoptedson.com' }} />
      
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
            Financial Reports
          </h1>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <p className="text-sm text-red-500 dark:text-red-500 mt-2">
                Make sure Stripe is properly configured.
              </p>
            </div>
          ) : data ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Monthly Recurring Revenue</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(data.summary.mrr)}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">MRR</p>
                </div>
                
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Annual Recurring Revenue</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(data.summary.arr)}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">ARR</p>
                </div>
                
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {data.summary.activeSubscriptions}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">subscribers</p>
                </div>
                
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Total Customers</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {data.summary.totalCustomers}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">all time</p>
                </div>
              </div>

              {/* Projected Revenue Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-[#2B4A6F] to-[#1e3a5f] rounded-xl p-6 text-white">
                  <p className="text-sm opacity-80 mb-1">Projected Monthly Revenue</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(data.summary.projectedMonthlyRevenue)}
                  </p>
                  <p className="text-xs opacity-60 mt-2">Based on current month pace</p>
                </div>
                
                <div className="bg-gradient-to-br from-[#E8A547] to-[#d4942e] rounded-xl p-6 text-white">
                  <p className="text-sm opacity-80 mb-1">Projected Annual Revenue</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(data.summary.projectedAnnualRevenue)}
                  </p>
                  <p className="text-xs opacity-60 mt-2">Based on 6-month trailing average</p>
                </div>
              </div>

              {/* Monthly Revenue Chart */}
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 mb-8">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Monthly Revenue (Last 12 Months)
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis 
                        dataKey="monthShort" 
                        tick={{ fill: '#666', fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fill: '#666', fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: '#333' }}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="revenue" 
                        name="Gross Revenue" 
                        fill={COLORS.revenue} 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="refunds" 
                        name="Refunds" 
                        fill={COLORS.refunds} 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Net Revenue Trend */}
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 mb-8">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Net Revenue Trend
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis 
                        dataKey="monthShort" 
                        tick={{ fill: '#666', fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fill: '#666', fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: '#333' }}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="netRevenue" 
                        name="Net Revenue"
                        stroke={COLORS.netRevenue}
                        fill={COLORS.netRevenue}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Annual Projection Chart */}
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 mb-8">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Annual Revenue Projection ({new Date().getFullYear()})
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={createProjectionData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: '#666', fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fill: '#666', fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        formatter={(value: number | null) => value ? formatCurrency(value) : 'N/A'}
                        labelStyle={{ color: '#333' }}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        name="Actual Revenue"
                        stroke={COLORS.revenue}
                        strokeWidth={2}
                        dot={{ fill: COLORS.revenue }}
                        connectNulls={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="projected" 
                        name="Projected Revenue"
                        stroke={COLORS.projected}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: COLORS.projected }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  12-Month Summary
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Gross Revenue</p>
                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(data.summary.totalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Refunds</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(data.summary.totalRefunds)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Net Revenue</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(data.summary.totalNet)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Avg Monthly Revenue</p>
                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(data.summary.avgMonthlyRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
}
