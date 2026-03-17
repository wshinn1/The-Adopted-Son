import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    // Get data for the past 12 months
    const monthlyData = []
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1)
      const startOfMonth = Math.floor(date.getTime() / 1000)
      const endOfMonth = Math.floor(new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).getTime() / 1000)
      
      // Fetch charges for this month
      const charges = await stripe.charges.list({
        created: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        limit: 100,
      })
      
      // Calculate totals
      const revenue = charges.data
        .filter(charge => charge.status === 'succeeded')
        .reduce((sum, charge) => sum + charge.amount, 0)
      
      const refunds = charges.data
        .filter(charge => charge.refunded)
        .reduce((sum, charge) => sum + (charge.amount_refunded || 0), 0)
      
      const netRevenue = revenue - refunds
      
      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthShort: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        revenue: revenue / 100, // Convert from cents
        refunds: refunds / 100,
        netRevenue: netRevenue / 100,
        transactionCount: charges.data.filter(c => c.status === 'succeeded').length,
      })
    }
    
    // Calculate totals and projections
    const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0)
    const totalRefunds = monthlyData.reduce((sum, m) => sum + m.refunds, 0)
    const totalNet = monthlyData.reduce((sum, m) => sum + m.netRevenue, 0)
    const avgMonthlyRevenue = totalNet / monthlyData.length
    
    // Calculate current month projection
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysPassed = now.getDate()
    const currentMonthRevenue = monthlyData[monthlyData.length - 1]?.netRevenue || 0
    const projectedMonthlyRevenue = (currentMonthRevenue / daysPassed) * daysInCurrentMonth
    
    // Calculate annual projection based on trailing 12 months trend
    const recentMonths = monthlyData.slice(-6)
    const recentAvg = recentMonths.reduce((sum, m) => sum + m.netRevenue, 0) / recentMonths.length
    const projectedAnnualRevenue = recentAvg * 12
    
    // Get subscription data
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    })
    
    const mrr = subscriptions.data.reduce((sum, sub) => {
      const item = sub.items.data[0]
      if (item?.price?.recurring?.interval === 'month') {
        return sum + (item.price.unit_amount || 0)
      } else if (item?.price?.recurring?.interval === 'year') {
        return sum + ((item.price.unit_amount || 0) / 12)
      }
      return sum
    }, 0) / 100
    
    const arr = mrr * 12
    
    // Get customer count
    const customers = await stripe.customers.list({ limit: 1 })
    const totalCustomers = customers.data.length > 0 ? (await stripe.customers.list({ limit: 100 })).data.length : 0
    
    return NextResponse.json({
      monthlyData,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalRefunds: Math.round(totalRefunds * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        avgMonthlyRevenue: Math.round(avgMonthlyRevenue * 100) / 100,
        projectedMonthlyRevenue: Math.round(projectedMonthlyRevenue * 100) / 100,
        projectedAnnualRevenue: Math.round(projectedAnnualRevenue * 100) / 100,
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        activeSubscriptions: subscriptions.data.length,
        totalCustomers,
      }
    })
  } catch (error) {
    console.error('Error fetching financial data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial data' },
      { status: 500 }
    )
  }
}
