'use client'

import { useState, useEffect, Suspense } from 'react'
import { Facebook, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Select } from '@launcher-ads/ui'
import { clientsAPI, facebookAPI, type Client } from '@/lib/api'

interface AdAccount {
  id: string
  facebookId: string
  name: string
  currency: string
  accountStatus: string
  businessName?: string
  clientId?: string | null
  client?: Client | null
}

interface AvailableAccount {
  id: string
  name: string
  accountStatus: string
  currency: string
  timezone: string
  businessName?: string
  businessId?: string
  isSelected: boolean
}

function IntegrationsContent() {
  const searchParams = useSearchParams()
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [availableAccounts, setAvailableAccounts] = useState<AvailableAccount[]>([])
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [showAccountSelection, setShowAccountSelection] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showCreateClientModal, setShowCreateClientModal] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [creatingClient, setCreatingClient] = useState(false)

  useEffect(() => {
    // Fetch clients list
    fetchClients()

    // Check if returning from OAuth with userId
    const authStatus = searchParams?.get('auth')
    const userIdFromUrl = searchParams?.get('userId')

    let storedUserId = localStorage.getItem('facebook_user_id')

    // If OAuth succeeded, use the userId from backend
    if (authStatus === 'success' && userIdFromUrl) {
      storedUserId = userIdFromUrl
      localStorage.setItem('facebook_user_id', userIdFromUrl)
      setUserId(userIdFromUrl)
      setIsConnected(true)

      // OAuth succeeded, fetch available accounts for selection
      setTimeout(() => {
        fetchAvailableAccounts(userIdFromUrl)
      }, 500)
    } else {
      // Get user ID from localStorage or create one
      if (!storedUserId) {
        storedUserId = `user-${Date.now()}`
        localStorage.setItem('facebook_user_id', storedUserId)
      }
      setUserId(storedUserId)

      // Normal page load, check if already connected
      checkFacebookConnection(storedUserId)
    }
  }, [searchParams])

  const fetchClients = async () => {
    try {
      const clients = await clientsAPI.list() as any
      setClients(clients)
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
    }
  }

  const linkAdAccountToClient = async (adAccountId: string, clientId: string | null) => {
    try {
      // Optimistic update
      setAdAccounts(prev => prev.map(acc =>
        acc.id === adAccountId
          ? { ...acc, clientId, client: clientId ? clients.find(c => c.id === clientId) || null : null }
          : acc
      ))

      await facebookAPI.linkAdAccountToClient(adAccountId, clientId)
    } catch (error) {
      // Revert on error
      await checkFacebookConnection(userId!)
      console.error('Error linking ad account to client:', error)
      setError('Failed to link ad account to client')
    }
  }

  const checkFacebookConnection = async (uid?: string) => {
    const targetUserId = uid || userId
    if (!targetUserId) return

    try {
      setLoading(true)
      setError(null)
      const accounts = await facebookAPI.getAccounts(targetUserId) as any
      setIsConnected(true)
      setAdAccounts(accounts)
    } catch (err) {
      console.error('Error checking Facebook connection:', err)
      setError('Failed to check Facebook connection')
      setIsConnected(false)
      setAdAccounts([])
    } finally {
      setLoading(false)
    }
  }

  const deleteAdAccount = async (adAccountId: string) => {
    if (!confirm('Are you sure you want to remove this ad account?')) return

    try {
      await facebookAPI.deleteAdAccount(adAccountId)
      await checkFacebookConnection(userId!)
    } catch (err) {
      console.error('Error deleting ad account:', err)
      setError('Failed to delete ad account')
    }
  }

  const connectFacebook = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/facebook/auth`
  }

  const fetchAvailableAccounts = async (uid: string) => {
    try {
      setLoading(true)
      const accounts = await facebookAPI.getAvailableAccounts(uid) as any
      setAvailableAccounts(accounts)
      setSelectedAccountIds(accounts.filter((acc: AvailableAccount) => acc.isSelected).map((acc: AvailableAccount) => acc.id))
      setShowAccountSelection(true)
    } catch (err) {
      console.error('Error fetching available accounts:', err)
      setError('Failed to fetch available accounts')
    } finally {
      setLoading(false)
    }
  }

  const saveSelectedAccounts = async () => {
    if (!userId) return

    try {
      setSyncing(true)
      setError(null)
      await facebookAPI.saveAccounts(userId, selectedAccountIds)
      setShowAccountSelection(false)
      setSyncSuccess(true)
      checkFacebookConnection(userId)
      setTimeout(() => setSyncSuccess(false), 5000)
    } catch (err) {
      console.error('Error saving accounts:', err)
      setError('Failed to save selected accounts')
    } finally {
      setSyncing(false)
    }
  }

  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccountIds(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const disconnectFacebook = () => {
    if (confirm('Are you sure you want to disconnect your Facebook account?')) {
      // Clear local storage and reset state
      localStorage.removeItem('facebook_user_id')
      setIsConnected(false)
      setAdAccounts([])
      setAvailableAccounts([])
      setSelectedAccountIds([])
      setShowAccountSelection(false)
      setUserId(null)
      setSyncSuccess(false)
      // Create new userId
      const newUserId = `user-${Date.now()}`
      localStorage.setItem('facebook_user_id', newUserId)
      setUserId(newUserId)
    }
  }

  const createClient = async () => {
    if (!newClientName.trim()) return

    try {
      setCreatingClient(true)
      const newClient = await clientsAPI.create({ name: newClientName }) as any
      setClients(prev => [...prev, newClient])
      setNewClientName('')
      setShowCreateClientModal(false)
      return newClient.id
    } catch (err) {
      console.error('Error creating client:', err)
      setError('Failed to create client')
    } finally {
      setCreatingClient(false)
    }
    return null
  }

  const syncAllData = async () => {
    if (!userId) return

    try {
      setSyncing(true)
      setError(null)
      await facebookAPI.syncCampaignsInsights(userId)
      setSyncSuccess(true)
      setTimeout(() => setSyncSuccess(false), 5000)
    } catch (err) {
      console.error('Error syncing data:', err)
      setError('Failed to sync data from Facebook')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#151515]">Integrations</h1>
        <p className="text-gray-600 mt-2">
          Connect your advertising platforms to launch campaigns
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Success message */}
      {syncSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              Data successfully synced! You can now view your campaigns in the dashboard.
            </span>
          </div>
        </div>
      )}

      {/* Data Sources Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#151515] mb-3">Data Sources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {/* Facebook Ads Card */}
          <div className="bg-white rounded-lg border border-[#d9d8ce] p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                <Image
                  src="/meta-logo.svg"
                  alt="Meta Ads"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              {isConnected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <CheckCircle className="h-3 w-3" />
                  Connected
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-[#151515] mb-1">Meta Ads</h3>
            <p className="text-xs text-gray-600 mb-3">
              Connect your Facebook Business Manager
            </p>
            {isConnected && adAccounts.length > 0 && (
              <p className="text-xs text-gray-500 mb-3">
                {adAccounts.length} account{adAccounts.length > 1 ? 's' : ''} connected
              </p>
            )}
            {!isConnected ? (
              <button
                onClick={connectFacebook}
                className="w-full px-4 py-2 bg-[#0084FF] text-white rounded-lg hover:bg-[#0073e6] transition-colors font-medium text-sm"
              >
                Connect
              </button>
            ) : (
              <button
                onClick={disconnectFacebook}
                className="w-full px-4 py-2 border border-[#d9d8ce] text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Disconnect
              </button>
            )}
          </div>

          {/* Google Ads Card - Coming Soon */}
          <div className="bg-white rounded-lg border border-[#d9d8ce] p-4 opacity-60">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                <Image
                  src="/google-logo.svg"
                  alt="Google Ads"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                Coming Soon
              </span>
            </div>
            <h3 className="text-base font-bold text-[#151515] mb-1">Google Ads</h3>
            <p className="text-xs text-gray-600 mb-3">Connect your Google Ads account</p>
            <button
              disabled
              className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed font-medium text-sm"
            >
              Connect
            </button>
          </div>

          {/* LinkedIn Ads Card - Coming Soon */}
          <div className="bg-white rounded-lg border border-[#d9d8ce] p-4 opacity-60">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                <Image
                  src="/linkedin-logo.svg"
                  alt="LinkedIn Ads"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                Coming Soon
              </span>
            </div>
            <h3 className="text-base font-bold text-[#151515] mb-1">LinkedIn Ads</h3>
            <p className="text-xs text-gray-600 mb-3">Connect your LinkedIn account</p>
            <button
              disabled
              className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed font-medium text-sm"
            >
              Connect
            </button>
          </div>

          {/* TikTok Ads Card - Coming Soon */}
          <div className="bg-white rounded-lg border border-[#d9d8ce] p-4 opacity-60">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                <Image
                  src="/tiktok-logo.svg"
                  alt="TikTok Ads"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                Coming Soon
              </span>
            </div>
            <h3 className="text-base font-bold text-[#151515] mb-1">TikTok Ads</h3>
            <p className="text-xs text-gray-600 mb-3">Connect your TikTok Ads account</p>
            <button
              disabled
              className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed font-medium text-sm"
            >
              Connect
            </button>
          </div>

          {/* Snapchat Ads Card - Coming Soon */}
          <div className="bg-white rounded-lg border border-[#d9d8ce] p-4 opacity-60">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                <Image
                  src="/snapchat-logo.svg"
                  alt="Snapchat Ads"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                Coming Soon
              </span>
            </div>
            <h3 className="text-base font-bold text-[#151515] mb-1">Snapchat Ads</h3>
            <p className="text-xs text-gray-600 mb-3">Connect your Snapchat account</p>
            <button
              disabled
              className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed font-medium text-sm"
            >
              Connect
            </button>
          </div>
        </div>
      </div>

      {/* Account Selection Modal */}
      {showAccountSelection && availableAccounts.length > 0 && (
        <div className="bg-white rounded-lg border border-[#d9d8ce] overflow-hidden mb-6">
          <div className="p-6 border-b border-[#d9d8ce] bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-xl font-bold text-[#151515] mb-2">Select Ad Accounts</h2>
            <p className="text-sm text-gray-600">
              Choose which ad accounts you want to import and manage
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-3 mb-6">
              {availableAccounts.map((account) => (
                <div
                  key={account.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedAccountIds.includes(account.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleAccountSelection(account.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAccountIds.includes(account.id)}
                        onChange={() => toggleAccountSelection(account.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-semibold text-[#151515]">{account.name}</div>
                        {account.businessName && (
                          <div className="text-sm text-gray-600">{account.businessName}</div>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500 font-mono">{account.id}</span>
                          <span className="text-xs text-gray-500">{account.currency}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              account.accountStatus === '1' || account.accountStatus === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {account.accountStatus === '1' ? 'Active' : account.accountStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {selectedAccountIds.length} account{selectedAccountIds.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAccountSelection(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSelectedAccounts}
                  disabled={syncing || selectedAccountIds.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Selection'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configured Accounts Section */}
      {isConnected && adAccounts.length > 0 && !showAccountSelection && (
        <div className="space-y-6">
          {/* Linked Accounts */}
          {adAccounts.filter(acc => acc.clientId).length > 0 && (
            <div className="bg-white rounded-lg border border-[#d9d8ce] overflow-hidden">
              <div className="p-4 border-b border-[#d9d8ce] bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#151515]">Linked Accounts</h2>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {adAccounts.filter(acc => acc.clientId).length} account(s) linked to clients
                    </p>
                  </div>
                  <button
                    onClick={() => checkFacebookConnection()}
                    className="px-3 py-1.5 border border-[#d9d8ce] rounded-lg hover:bg-gray-50 transition-colors text-xs flex items-center gap-2 bg-white"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-[#d9d8ce]">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Account Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Account ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Currency
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adAccounts.filter(acc => acc.clientId).map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-white rounded flex items-center justify-center flex-shrink-0 border border-gray-200">
                          <Image
                            src="/meta-logo.svg"
                            alt="Meta"
                            width={16}
                            height={16}
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-[#151515]">
                            {account.name}
                          </div>
                          {account.businessName && (
                            <div className="text-xs text-gray-500">
                              {account.businessName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-xs text-gray-600 font-mono">
                        {account.facebookId}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <Select
                        value={account.clientId || ''}
                        options={clients.map(client => ({
                          value: client.id,
                          label: client.name,
                        }))}
                        placeholder="No client"
                        onChange={(value) => linkAdAccountToClient(account.id, value || null)}
                        onCreateNew={() => setShowCreateClientModal(true)}
                        createNewLabel="Create client"
                        variant="default"
                      />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {account.accountStatus === 'ACTIVE' ||
                      account.accountStatus === '1' ||
                      account.accountStatus === '2' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          <AlertCircle className="h-3 w-3" />
                          {account.accountStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-xs text-gray-600">{account.currency}</div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <button
                        onClick={() => deleteAdAccount(account.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          )}

          {/* Unmapped Accounts */}
          {adAccounts.filter(acc => !acc.clientId).length > 0 && (
            <div className="bg-white rounded-lg border border-[#d9d8ce] overflow-hidden">
              <div className="p-4 border-b border-[#d9d8ce] bg-orange-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#151515]">Unmapped Accounts</h2>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {adAccounts.filter(acc => !acc.clientId).length} account(s) not linked to any client
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-[#d9d8ce]">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Account Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Account ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Currency
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adAccounts.filter(acc => !acc.clientId).map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-white rounded flex items-center justify-center flex-shrink-0 border border-gray-200">
                              <Image
                                src="/meta-logo.svg"
                                alt="Meta"
                                width={16}
                                height={16}
                                className="object-contain"
                              />
                            </div>
                            <div>
                              <div className="text-xs font-medium text-[#151515]">
                                {account.name}
                              </div>
                              {account.businessName && (
                                <div className="text-xs text-gray-500">
                                  {account.businessName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="text-xs text-gray-600 font-mono">
                            {account.facebookId}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Select
                            value={account.clientId || ''}
                            options={clients.map(client => ({
                              value: client.id,
                              label: client.name,
                            }))}
                            placeholder="Select a client"
                            onChange={(value) => linkAdAccountToClient(account.id, value || null)}
                            onCreateNew={() => setShowCreateClientModal(true)}
                            createNewLabel="Create client"
                            variant="warning"
                          />
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {account.accountStatus === 'ACTIVE' ||
                          account.accountStatus === '1' ||
                          account.accountStatus === '2' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                              <AlertCircle className="h-3 w-3" />
                              {account.accountStatus}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="text-xs text-gray-600">{account.currency}</div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <button
                            onClick={() => deleteAdAccount(account.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {isConnected && adAccounts.length === 0 && !showAccountSelection && (
        <div className="bg-white rounded-lg border border-[#d9d8ce] p-12">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">No ad accounts found</p>
            <p className="text-sm mt-1">
              Make sure you have access to ad accounts in your Facebook Business Manager
            </p>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#151515]">Create New Client</h2>
              <button
                onClick={() => {
                  setShowCreateClientModal(false)
                  setNewClientName('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Enter client name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !creatingClient) {
                    createClient()
                  }
                }}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  setShowCreateClientModal(false)
                  setNewClientName('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={creatingClient}
              >
                Cancel
              </button>
              <button
                onClick={createClient}
                disabled={!newClientName.trim() || creatingClient}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creatingClient ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Client'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  )
}
