'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Eye, MousePointerClick, Users } from 'lucide-react'

interface CampaignInsight {
  id: string
  campaignId: string
  campaignName: string
  status: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  cpc: number
  cpm: number
  ctr: number
  date: string
}

interface AggregatedStats {
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  avgCPC: number
  avgCPM: number
  avgCTR: number
  activeCampaigns: number
}

export default function AnalyticsPage() {
  const [insights, setInsights] = useState<CampaignInsight[]>([])
  const [stats, setStats] = useState<AggregatedStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // TODO: Re-enable when campaigns-insights endpoint is implemented
    // loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get userId from URL or local storage
      const urlParams = new URLSearchParams(window.location.search)
      const userId = urlParams.get('userId') || 'default-user-id'

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

      // Test period: Last 7 days (Oct 21-28, 2025)
      const response = await fetch(`${API_URL}/facebook/campaigns-insights/${userId}`)

      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }

      const data = await response.json()
      setInsights(data.campaigns || [])

      // Calculate aggregated stats
      if (data.campaigns && data.campaigns.length > 0) {
        const aggregated = calculateStats(data.campaigns)
        setStats(aggregated)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (campaigns: CampaignInsight[]): AggregatedStats => {
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0)
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length

    return {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
      avgCPM: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      activeCampaigns,
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#edece5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#151515] mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#edece5]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-[#151515] text-white rounded-lg hover:bg-[#2a2a2a]"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#edece5] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#151515]">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Last 7 days • Oct 21-28, 2025</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                const urlParams = new URLSearchParams(window.location.search)
                const userId = urlParams.get('userId') || 'default-user-id'
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

                setLoading(true)
                try {
                  await fetch(`${API_URL}/facebook/campaigns-insights/${userId}/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ datePreset: 'last_7d' })
                  })
                  await loadAnalytics()
                } catch (err) {
                  setError('Sync failed')
                  setLoading(false)
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sync from Facebook
            </button>
            <button
              onClick={loadAnalytics}
              className="px-4 py-2 bg-[#151515] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Spend"
              value={formatCurrency(stats.totalSpend)}
              icon={DollarSign}
              trend={null}
            />
            <StatCard
              title="Impressions"
              value={formatNumber(stats.totalImpressions)}
              icon={Eye}
              trend={null}
            />
            <StatCard
              title="Clicks"
              value={formatNumber(stats.totalClicks)}
              icon={MousePointerClick}
              trend={null}
            />
            <StatCard
              title="Conversions"
              value={formatNumber(stats.totalConversions)}
              icon={Users}
              trend={null}
            />
          </div>
        )}

        {/* Metrics Row */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard title="Average CPC" value={formatCurrency(stats.avgCPC)} />
            <MetricCard title="Average CPM" value={formatCurrency(stats.avgCPM)} />
            <MetricCard title="Average CTR" value={`${stats.avgCTR.toFixed(2)}%`} />
          </div>
        )}

        {/* Campaigns Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-[#151515]">Campaign Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spend
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impressions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTR
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPC
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {insights.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{campaign.campaignName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          campaign.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(campaign.spend)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatNumber(campaign.impressions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatNumber(campaign.clicks)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {campaign.ctr.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(campaign.cpc)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-[#151515] mt-2">{value}</p>
        </div>
        <div className="h-12 w-12 bg-[#151515] bg-opacity-10 rounded-full flex items-center justify-center">
          <Icon className="h-6 w-6 text-[#151515]" />
        </div>
      </div>
      {trend !== null && (
        <div className="mt-4 flex items-center text-sm">
          {trend > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
            {Math.abs(trend)}%
          </span>
          <span className="text-gray-500 ml-1">vs last month</span>
        </div>
      )}
    </div>
  )
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-[#151515] mt-2">{value}</p>
    </div>
  )
}
