'use client'

import { useState, useEffect } from 'react'
import { Terminal, Play, Trash2, Copy, CheckCircle2, XCircle, ChevronDown } from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: string
  type: 'request' | 'response' | 'error'
  method: string
  url: string
  status?: number
  data?: any
  duration?: number
}

interface Client {
  id: string
  name: string
  logoUrl?: string
}

interface AdAccount {
  id: string
  name: string
  facebookId: string
  clientId: string
}

export default function DebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedAdAccount, setSelectedAdAccount] = useState<AdAccount | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  const userId = 'f6a2a722-7ca8-4130-a78a-4d50e2ff8256'

  // Load clients and ad accounts on mount
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoadingData(true)
    try {
      // Load clients
      const clientsRes = await fetch(`${API_URL}/clients`)
      const clientsData = await clientsRes.json()
      setClients(clientsData)

      // Load ad accounts
      const accountsRes = await fetch(`${API_URL}/facebook/accounts/${userId}`)
      const accountsData = await accountsRes.json()
      setAdAccounts(accountsData)
    } catch (error) {
      console.error('Failed to load initial data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  // Filter ad accounts by selected client
  const filteredAdAccounts = selectedClient
    ? adAccounts.filter(acc => acc.clientId === selectedClient.id)
    : adAccounts

  const addLog = (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs(prev => [{
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    }, ...prev])
  }

  const clearLogs = () => setLogs([])

  const copyLog = (log: LogEntry) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2))
  }

  const testEndpoint = async (
    method: string,
    endpoint: string,
    body?: any,
    description?: string
  ) => {
    setLoading(true)
    const startTime = Date.now()

    addLog({
      type: 'request',
      method,
      url: endpoint,
      data: body || null
    })

    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' }
      }

      if (body) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(`${API_URL}${endpoint}`, options)
      const duration = Date.now() - startTime
      const data = await response.json()

      addLog({
        type: response.ok ? 'response' : 'error',
        method,
        url: endpoint,
        status: response.status,
        data,
        duration
      })

      return data
    } catch (error: any) {
      const duration = Date.now() - startTime
      addLog({
        type: 'error',
        method,
        url: endpoint,
        data: { error: error.message },
        duration
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-3xl font-bold">API Debug Console</h1>
              <p className="text-gray-400 text-sm">Test Facebook API endpoints and view responses</p>
            </div>
          </div>
          <button
            onClick={clearLogs}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear Logs
          </button>
        </div>

        {/* Configuration */}
        <div className="bg-[#151515] rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>

          {loadingData ? (
            <div className="text-center py-8 text-gray-400">Loading clients and ad accounts...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Client Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Client</label>
                <div className="relative">
                  <select
                    value={selectedClient?.id || ''}
                    onChange={(e) => {
                      const client = clients.find(c => c.id === e.target.value)
                      setSelectedClient(client || null)
                      setSelectedAdAccount(null) // Reset ad account when client changes
                    }}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 appearance-none cursor-pointer"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Ad Account Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Ad Account</label>
                <div className="relative">
                  <select
                    value={selectedAdAccount?.id || ''}
                    onChange={(e) => {
                      const account = adAccounts.find(a => a.id === e.target.value)
                      setSelectedAdAccount(account || null)
                    }}
                    disabled={!selectedClient}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select an ad account</option>
                    {filteredAdAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.facebookId})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {selectedClient && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-1">
              <p className="text-sm text-green-400">
                <span className="font-medium">Selected Client:</span> {selectedClient.name}
              </p>
              <p className="text-xs text-green-300 font-mono">
                Client UUID: {selectedClient.id}
              </p>
              {selectedAdAccount && (
                <>
                  <p className="text-sm text-green-400 mt-2">
                    <span className="font-medium">Selected Ad Account:</span> {selectedAdAccount.name}
                  </p>
                  <p className="text-xs text-green-300 font-mono">
                    Ad Account UUID: {selectedAdAccount.id}
                  </p>
                  <p className="text-xs text-green-300 font-mono">
                    Facebook ID: {selectedAdAccount.facebookId}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Test Buttons */}
        <div className="bg-[#151515] rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Test Endpoints</h2>

          <div className="space-y-4">
            {/* Facebook Endpoints */}
            <div>
              <h3 className="text-lg font-medium text-green-500 mb-3">Facebook API</h3>
              <div className="grid grid-cols-2 gap-3">
                <TestButton
                  label="Get Ad Accounts"
                  onClick={() => testEndpoint('GET', `/facebook/accounts/${userId}`)}
                  loading={loading}
                />
                <TestButton
                  label="Get Campaigns"
                  onClick={() => testEndpoint('GET', `/facebook/campaigns/${userId}/${selectedAdAccount?.facebookId}`)}
                  loading={loading}
                  disabled={!selectedAdAccount}
                />
                <TestButton
                  label="Get Campaigns + Insights"
                  onClick={() => testEndpoint('GET', `/facebook/campaigns-insights/${userId}`)}
                  loading={loading}
                />
                <TestButton
                  label="Sync Campaigns (7 days)"
                  onClick={() => testEndpoint('POST', `/facebook/campaigns-insights/${userId}/sync`, { datePreset: 'last_7d' })}
                  loading={loading}
                />
                <TestButton
                  label="Get Client Analytics"
                  onClick={() => {
                    const params = new URLSearchParams({
                      dateStart: '2025-10-21',
                      dateEnd: '2025-10-28',
                      ...(selectedAdAccount && { adAccountId: selectedAdAccount.id })
                    })
                    testEndpoint('GET', `/facebook/analytics/client/${selectedClient?.id}?${params}`)
                  }}
                  loading={loading}
                  disabled={!selectedClient}
                />
              </div>
            </div>

            {/* Client Endpoints */}
            <div>
              <h3 className="text-lg font-medium text-blue-500 mb-3">Clients API</h3>
              <div className="grid grid-cols-2 gap-3">
                <TestButton
                  label="Get All Clients"
                  onClick={() => testEndpoint('GET', `/clients`)}
                  loading={loading}
                />
                <TestButton
                  label="Get Client by ID"
                  onClick={() => testEndpoint('GET', `/clients/${selectedClient?.id}`)}
                  loading={loading}
                  disabled={!selectedClient}
                />
              </div>
            </div>

            {/* Launch Endpoints */}
            <div>
              <h3 className="text-lg font-medium text-purple-500 mb-3">Launches API</h3>
              <div className="grid grid-cols-2 gap-3">
                <TestButton
                  label="Get User Launches"
                  onClick={() => testEndpoint('GET', `/launches/user/${userId}`)}
                  loading={loading}
                />
              </div>
            </div>

            {/* Direct Facebook Graph API Calls */}
            <div>
              <h3 className="text-lg font-medium text-yellow-500 mb-3">Direct Facebook Graph API</h3>
              <p className="text-xs text-gray-400 mb-3">Shows the actual calls made to Facebook Graph API</p>
              <div className="grid grid-cols-2 gap-3">
                <TestButton
                  label="FB: Get Campaigns (Raw)"
                  onClick={() => testEndpoint('GET', `/facebook/debug/raw-campaigns/${userId}/${selectedAdAccount?.facebookId}`)}
                  loading={loading}
                  disabled={!selectedAdAccount}
                />
                <TestButton
                  label="FB: Get Insights (Raw)"
                  onClick={() => testEndpoint('GET', `/facebook/debug/raw-insights/${userId}/${selectedAdAccount?.facebookId}?datePreset=last_7d`)}
                  loading={loading}
                  disabled={!selectedAdAccount}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-[#151515] rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Logs ({logs.length})</h2>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No logs yet. Test an endpoint to see logs.</p>
              </div>
            ) : (
              logs.map((log) => (
                <LogCard key={log.id} log={log} onCopy={() => copyLog(log)} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TestButton({
  label,
  onClick,
  loading,
  disabled
}: {
  label: string
  onClick: () => void
  loading: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
        disabled
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-700 text-white'
      }`}
    >
      <Play className="h-4 w-4" />
      {label}
    </button>
  )
}

function LogCard({ log, onCopy }: { log: LogEntry; onCopy: () => void }) {
  const [expanded, setExpanded] = useState(false)

  const typeColors = {
    request: 'border-blue-500 bg-blue-500/10',
    response: 'border-green-500 bg-green-500/10',
    error: 'border-red-500 bg-red-500/10',
  }

  const typeIcons = {
    request: <Play className="h-4 w-4 text-blue-500" />,
    response: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />,
  }

  return (
    <div className={`border-l-4 rounded-lg p-4 ${typeColors[log.type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {typeIcons[log.type]}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm font-semibold">{log.method}</span>
              <span className="font-mono text-sm text-gray-400 truncate">{log.url}</span>
              {log.status && (
                <span className={`text-xs px-2 py-1 rounded ${
                  log.status < 300 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {log.status}
                </span>
              )}
              {log.duration && (
                <span className="text-xs text-gray-500">{log.duration}ms</span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(log.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="p-2 hover:bg-white/5 rounded transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="h-4 w-4 text-gray-400" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-xs transition-colors"
          >
            {expanded ? 'Hide' : 'Show'} Data
          </button>
        </div>
      </div>

      {expanded && log.data && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <pre className="text-xs bg-black/50 p-3 rounded overflow-x-auto">
            {JSON.stringify(log.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
