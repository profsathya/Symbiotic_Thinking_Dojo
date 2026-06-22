'use client'

import { useState, useEffect } from 'react'
import { Trash2, Plus, Globe, CheckCircle, AlertCircle, Users, Download, TrendingUp, KeyRound, Filter, FileText, Eye, LogOut, Lock } from 'lucide-react'

interface ProviderKey {
  id: string
  provider: string
  label: string | null
  active: boolean
  created_at: string
  last_used_at: string | null
  notes: string | null
}

interface CTIKey {
  id: string
  student_email: string
  student_name: string | null
  total_budget_tokens: number
  used_tokens_input: number
  used_tokens_output: number
  active: boolean
  created_at: string
  expires_at: string | null
  last_used_at: string | null
  notes: string | null
  openai_key: string | null
  anthropic_key: string | null
  google_key: string | null
  github_key: string | null
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'provider' | 'cti'>('provider')
  const [providerKeys, setProviderKeys] = useState<ProviderKey[]>([])
  const [ctiKeys, setCtiKeys] = useState<CTIKey[]>([])
  const [showCreateProviderKeyModal, setShowCreateProviderKeyModal] = useState(false)
  const [showCreateCTIKeyModal, setShowCreateCTIKeyModal] = useState(false)
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false)
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUsageModal, setShowUsageModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [selectedKeyForBudget, setSelectedKeyForBudget] = useState<string | null>(null)
  const [selectedKeyForDelete, setSelectedKeyForDelete] = useState<string | null>(null)
  const [selectedKeyForUsage, setSelectedKeyForUsage] = useState<CTIKey | null>(null)
  const [activeOnlyFilter, setActiveOnlyFilter] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [adminKey, setAdminKey] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  // Check for admin key in localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('adminKey')
    if (storedKey) {
      setAdminKey(storedKey)
    } else {
      setShowLoginModal(true)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('adminKey')
    setAdminKey(null)
    setShowLoginModal(true)
  }

  const fetchProviderKeys = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/provider-keys`, {
        headers: adminKey ? { 'X-Admin-Key': adminKey } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setProviderKeys(data)
      }
    } catch (err) {
      console.error('Error fetching provider keys:', err)
    }
  }

  const fetchCTIKeys = async () => {
    try {
      const url = activeOnlyFilter ? `${API_BASE}/api/admin/keys?active_only=true` : `${API_BASE}/api/admin/keys`
      const res = await fetch(url, {
        headers: adminKey ? { 'X-Admin-Key': adminKey } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setCtiKeys(data)
      }
    } catch (err) {
      console.error('Error fetching CTI keys:', err)
    }
  }

  // Refetch CTI keys when filter changes
  useEffect(() => {
    if (activeTab === 'cti') {
      fetchCTIKeys()
    }
  }, [activeOnlyFilter, activeTab])

  // Fetch keys on mount
  useEffect(() => {
    fetchProviderKeys()
    fetchCTIKeys()
  }, [])

  const providerName = (provider: string) => {
    const names: { [key: string]: string } = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic (Claude)',
      'google': 'Google (Gemini)',
      'github': 'GitHub'
    }
    return names[provider] || provider
  }

  const groupedKeys = providerKeys.reduce((acc, key) => {
    if (!acc[key.provider]) acc[key.provider] = []
    acc[key.provider].push(key)
    return acc
  }, {} as { [key: string]: ProviderKey[] })

  const exportUsage = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/usage`, {
        headers: adminKey ? { 'X-Admin-Key': adminKey } : {}
      })
      if (res.ok) {
        const data = await res.json()
        const csv = [
          ['Key ID', 'Email', 'Name', 'Input Tokens', 'Output Tokens', 'Total Used', 'Budget', 'Remaining', 'Active', 'Created', 'Expires', 'Last Used'],
          ...data.data.map((row: any) => [
            row.key_id,
            row.email,
            row.name,
            row.input_tokens,
            row.output_tokens,
            row.total_used,
            row.budget,
            row.remaining,
            row.active,
            row.created,
            row.expires,
            row.last_used
          ])
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'cti-usage.csv'
        a.click()
        URL.revokeObjectURL(url)
        setToast({ message: 'Usage exported successfully', type: 'success' })
        setTimeout(() => setToast(null), 3000)
      }
    } catch (err) {
      setToast({ message: 'Error exporting usage', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={(key) => {
            localStorage.setItem('adminKey', key)
            setAdminKey(key)
            setShowLoginModal(false)
            fetchProviderKeys()
            fetchCTIKeys()
          }}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 mt-1">Manage Provider API Keys and CTI Keys</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('provider')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'provider'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Globe className="w-4 h-4" />
            Provider Keys
          </button>
          <button
            onClick={() => setActiveTab('cti')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'cti'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            CTI Keys
          </button>
        </div>

        {/* Provider Keys Tab */}
        {activeTab === 'provider' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Provider API Keys</h2>
                <p className="text-slate-400 text-sm">Manage API keys for OpenAI, Anthropic, Google, GitHub</p>
              </div>
              <button
                onClick={() => { setShowCreateProviderKeyModal(true); }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Provider Key
              </button>
            </div>

            {/* Provider Keys */}
            {providerKeys.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
                <Globe className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                <h2 className="text-xl font-medium text-white mb-2">No provider keys found</h2>
                <p className="text-slate-400 mb-6">Add API keys for OpenAI, Anthropic, Google, or GitHub to enable API access.</p>
                <button
                  onClick={() => { setShowCreateProviderKeyModal(true); }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Key
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedKeys).map(([provider, keys]) => (
                  <div key={provider} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700">
                      <h2 className="text-lg font-semibold text-white">{providerName(provider)}</h2>
                      <p className="text-slate-400 text-sm">{keys.length} key(s)</p>
                    </div>
                    <div className="divide-y divide-slate-700">
                      {keys.map((key) => (
                        <div key={key.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-700/50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {key.label && (
                                <span className="text-orange-400 font-medium">"{key.label}"</span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded ${key.active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                {key.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="text-slate-400 text-sm">
                              Created: {new Date(key.created_at).toLocaleDateString()}
                              {key.last_used_at && ` • Last used: ${new Date(key.last_used_at).toLocaleDateString()}`}
                            </div>
                            {key.notes && <div className="text-slate-500 text-xs mt-1">{key.notes}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                fetch(`${API_BASE}/api/admin/provider-keys/${key.id}/${key.active ? 'deactivate' : 'activate'}`, {
                                  method: 'POST',
                                  headers: adminKey ? { 'X-Admin-Key': adminKey } : {}
                                }).then(() => {
                                  fetchProviderKeys()
                                  setToast({ message: `Key ${key.active ? 'deactivated' : 'activated'}`, type: 'success' })
                                  setTimeout(() => setToast(null), 3000)
                                })
                              }}
                              className={`p-2 rounded-lg transition-colors ${key.active ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 hover:text-green-400'}`}
                              title={key.active ? 'Deactivate' : 'Activate'}
                            >
                              {key.active ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => {
                                fetch(`${API_BASE}/api/admin/provider-keys/${key.id}`, {
                                  method: 'DELETE',
                                  headers: adminKey ? { 'X-Admin-Key': adminKey } : {}
                                }).then(() => {
                                  fetchProviderKeys()
                                  setToast({ message: 'Key deleted', type: 'success' })
                                  setTimeout(() => setToast(null), 3000)
                                })
                              }}
                              className="p-2 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* CTI Keys Tab */}
        {activeTab === 'cti' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">CTI Keys</h2>
                <p className="text-slate-400 text-sm">Manage student keys with token budgets</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveOnlyFilter(!activeOnlyFilter)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeOnlyFilter
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  {activeOnlyFilter ? 'All Keys' : 'Active Only'}
                </button>
                <button
                  onClick={() => { setShowBulkCreateModal(true); }}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Bulk Create
                </button>
                <button
                  onClick={exportUsage}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Usage
                </button>
                <button
                  onClick={() => { setShowCreateCTIKeyModal(true); }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create CTI Key
                </button>
              </div>
            </div>

            {/* CTI Keys */}
            {ctiKeys.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
                <KeyRound className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                <h2 className="text-xl font-medium text-white mb-2">No CTI keys found</h2>
                <p className="text-slate-400 mb-6">Create CTI keys for students to manage their token budgets.</p>
                <button
                  onClick={() => { setShowCreateCTIKeyModal(true); }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Key
                </button>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Key ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Provider Keys</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Token Usage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Last Used</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {ctiKeys.map((key) => {
                        const used = key.used_tokens_input + key.used_tokens_output
                        const remaining = key.total_budget_tokens - used
                        const percentage = (used / key.total_budget_tokens) * 100
                        return (
                          <tr key={key.id} className="hover:bg-slate-700/50 cursor-pointer" onClick={() => { setSelectedKeyForUsage(key); setShowUsageModal(true); }}>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-white">{key.student_name || key.student_email}</div>
                                <div className="text-xs text-slate-400">{key.student_email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-slate-300 font-mono">{key.id.slice(0, 8)}...</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {key.openai_key && (() => {
                                  const providerKey = providerKeys.find(pk => pk.id === key.openai_key)
                                  return <span className="text-xs px-2 py-1 bg-green-900/50 text-green-400 rounded">OpenAI ({providerKey?.label || key.openai_key.slice(0, 6)})</span>
                                })()}
                                {key.anthropic_key && (() => {
                                  const providerKey = providerKeys.find(pk => pk.id === key.anthropic_key)
                                  return <span className="text-xs px-2 py-1 bg-orange-900/50 text-orange-400 rounded">Anthropic ({providerKey?.label || key.anthropic_key.slice(0, 6)})</span>
                                })()}
                                {key.google_key && (() => {
                                  const providerKey = providerKeys.find(pk => pk.id === key.google_key)
                                  return <span className="text-xs px-2 py-1 bg-blue-900/50 text-blue-400 rounded">Google ({providerKey?.label || key.google_key.slice(0, 6)})</span>
                                })()}
                                {key.github_key && (() => {
                                  const providerKey = providerKeys.find(pk => pk.id === key.github_key)
                                  return <span className="text-xs px-2 py-1 bg-purple-900/50 text-purple-400 rounded">GitHub ({providerKey?.label || key.github_key.slice(0, 6)})</span>
                                })()}
                                {!key.openai_key && !key.anthropic_key && !key.google_key && !key.github_key && (
                                  <span className="text-xs text-slate-500">None (using pool)</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="w-48">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-slate-400">{used.toLocaleString()} / {key.total_budget_tokens.toLocaleString()}</span>
                                  <span className={percentage > 90 ? 'text-red-400' : percentage > 70 ? 'text-yellow-400' : 'text-green-400'}>
                                    {percentage.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                  />
                                </div>
                                <div className="text-xs text-slate-400 mt-1">{remaining.toLocaleString()} remaining</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-xs px-2 py-1 rounded ${key.active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                {key.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">
                              {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    setSelectedKeyForBudget(key.id)
                                    setShowAddBudgetModal(true)
                                  }}
                                  className="p-2 text-slate-400 hover:text-blue-400 rounded-lg transition-colors"
                                  title="Set Budget"
                                >
                                  <TrendingUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedKeyForDelete(key.id)
                                    setShowDeleteModal(true)
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    fetch(`${API_BASE}/api/admin/keys/${key.id}/${key.active ? 'deactivate' : 'reactivate'}`, {
                                      method: 'POST',
                                      headers: adminKey ? { 'X-Admin-Key': adminKey } : {}
                                    }).then(() => {
                                      fetchCTIKeys()
                                      setToast({ message: `Key ${key.active ? 'deactivated' : 'reactivated'}`, type: 'success' })
                                      setTimeout(() => setToast(null), 3000)
                                    })
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${key.active ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 hover:text-green-400'}`}
                                  title={key.active ? 'Deactivate' : 'Reactivate'}
                                >
                                  {key.active ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 ${
            toast.type === 'success' ? 'bg-green-900/90 border border-green-700 text-green-100' : 'bg-red-900/90 border border-red-700 text-red-100'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Create Provider Key Modal */}
        {showCreateProviderKeyModal && (
          <CreateProviderKeyModal
            onClose={() => setShowCreateProviderKeyModal(false)}
            API_BASE={API_BASE}
            setToast={setToast}
            onSuccess={() => { fetchProviderKeys(); }}
            adminKey={adminKey}
          />
        )}

        {/* Create CTI Key Modal */}
        {showCreateCTIKeyModal && (
          <CreateCTIKeyModal
            onClose={() => setShowCreateCTIKeyModal(false)}
            API_BASE={API_BASE}
            setToast={setToast}
            onSuccess={() => { fetchCTIKeys(); }}
            providerKeys={providerKeys}
            adminKey={adminKey}
          />
        )}

        {/* Add Budget Modal */}
        {showAddBudgetModal && selectedKeyForBudget && (() => {
          const key = ctiKeys.find(k => k.id === selectedKeyForBudget)
          return key ? (
            <AddBudgetModal
              onClose={() => { setShowAddBudgetModal(false); setSelectedKeyForBudget(null); }}
              API_BASE={API_BASE}
              keyId={selectedKeyForBudget}
              setToast={setToast}
              onSuccess={() => { fetchCTIKeys(); }}
              currentBudget={key.total_budget_tokens}
              adminKey={adminKey}
            />
          ) : null
        })()}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedKeyForDelete && (() => {
          const key = ctiKeys.find(k => k.id === selectedKeyForDelete)
          return key ? (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-900/50 rounded-full">
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Delete CTI Key</h2>
                    <p className="text-slate-400 text-sm">Confirm deletion</p>
                  </div>
                </div>
                <p className="text-slate-300 mb-4">
                  Are you sure you want to delete the CTI key for <span className="font-semibold text-white">{key.student_name || key.student_email}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setSelectedKeyForDelete(null); }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API_BASE}/api/admin/keys/${selectedKeyForDelete}`, {
                          method: 'DELETE',
                          headers: adminKey ? { 'X-Admin-Key': adminKey } : {}
                        })
                        if (!res.ok) throw new Error('Failed to delete CTI key')
                        setToast({ message: 'CTI key deleted successfully', type: 'success' })
                        fetchCTIKeys()
                        setShowDeleteModal(false)
                        setSelectedKeyForDelete(null)
                      } catch (err) {
                        setToast({ message: 'Failed to delete CTI key', type: 'error' })
                      }
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ) : null
        })()}

        {/* Bulk Create Modal */}
        {showBulkCreateModal && (
          <BulkCreateModal
            onClose={() => setShowBulkCreateModal(false)}
            API_BASE={API_BASE}
            setToast={setToast}
            onSuccess={() => { fetchCTIKeys(); }}
            adminKey={adminKey}
          />
        )}

        {/* Usage Modal */}
        {showUsageModal && selectedKeyForUsage && (
          <UsageModal
            onClose={() => { setShowUsageModal(false); setSelectedKeyForUsage(null); }}
            keyData={selectedKeyForUsage}
            providerKeys={providerKeys}
          />
        )}
      </div>
    </div>
  )
}

function CreateProviderKeyModal({
  onClose,
  API_BASE,
  setToast,
  onSuccess,
  adminKey
}: {
  onClose: () => void
  API_BASE: string
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void
  onSuccess: () => void
  adminKey: string | null
}) {
  const [provider, setProvider] = useState('openai')
  const [keyValue, setKeyValue] = useState('')
  const [label, setLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyValue) {
      setError('Key value is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/admin/provider-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminKey && { 'X-Admin-Key': adminKey })
        },
        body: JSON.stringify({
          provider,
          key_value: keyValue,
          label: label || null,
          notes: notes || null
        })
      })
      if (!res.ok) throw new Error('Failed to create provider key')
      setToast({ message: 'Provider key created successfully', type: 'success' })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating provider key')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-900/50 rounded-full">
            <Globe className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Add Provider Key</h2>
            <p className="text-slate-400 text-sm">Add an API key for a service provider</p>
          </div>
        </div>
        <p className="text-slate-300 mb-4">
          Add API keys for services like OpenAI, Anthropic, Google, or GitHub. These keys will be used when students make API calls.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="google">Google (Gemini)</option>
              <option value="github">GitHub</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">API Key Value</label>
            <input
              type="password"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter API key"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Label (Optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Production Account, Free Tier"
            />
            <p className="text-slate-500 text-xs mt-1">A short identifier to help distinguish this key</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Any additional notes about this key"
              rows={2}
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-800">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateCTIKeyModal({
  onClose,
  API_BASE,
  setToast,
  onSuccess,
  providerKeys,
  adminKey
}: {
  onClose: () => void
  API_BASE: string
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void
  onSuccess: () => void
  providerKeys: ProviderKey[]
  adminKey: string | null
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('5000000')
  const [expires, setExpires] = useState('')
  const [notes, setNotes] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [googleKey, setGoogleKey] = useState('')
  const [githubKey, setGithubKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Email is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/admin/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminKey && { 'X-Admin-Key': adminKey })
        },
        body: JSON.stringify({
          email,
          name: name || null,
          budget: parseInt(budget),
          expires: expires || null,
          notes: notes || null,
          openai_key: openaiKey || null,
          anthropic_key: anthropicKey || null,
          google_key: googleKey || null,
          github_key: githubKey || null
        })
      })
      if (!res.ok) throw new Error('Failed to create CTI key')
      setToast({ message: 'CTI key created successfully', type: 'success' })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating CTI key')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-900/50 rounded-full">
            <KeyRound className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Create CTI Key</h2>
            <p className="text-slate-400 text-sm">Create a key for a student</p>
          </div>
        </div>
        <p className="text-slate-300 mb-4">
          Create a CTI key for a student with a token budget. The student will use this key to access the Dojo.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Student Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="student@example.edu"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Student Name (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Token Budget</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5000000"
              min="1"
            />
            <p className="text-slate-500 text-xs mt-1">Total tokens (input + output)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Expiration Date (Optional)</label>
            <input
              type="date"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes about this key"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Linked Provider Keys (Optional)</label>
            <p className="text-slate-500 text-xs mb-2">Assign specific provider keys to this student. Leave blank to use the global pool.</p>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">OpenAI Key</label>
                <select
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Use global pool</option>
                  {providerKeys.filter(k => k.provider === 'openai').map(k => (
                    <option key={k.id} value={k.id}>{k.label || k.id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Anthropic Key</label>
                <select
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Use global pool</option>
                  {providerKeys.filter(k => k.provider === 'anthropic').map(k => (
                    <option key={k.id} value={k.id}>{k.label || k.id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Google Key</label>
                <select
                  value={googleKey}
                  onChange={(e) => setGoogleKey(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Use global pool</option>
                  {providerKeys.filter(k => k.provider === 'google').map(k => (
                    <option key={k.id} value={k.id}>{k.label || k.id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">GitHub Key</label>
                <select
                  value={githubKey}
                  onChange={(e) => setGithubKey(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Use global pool</option>
                  {providerKeys.filter(k => k.provider === 'github').map(k => (
                    <option key={k.id} value={k.id}>{k.label || k.id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-800">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddBudgetModal({
  onClose,
  API_BASE,
  keyId,
  setToast,
  onSuccess,
  currentBudget,
  adminKey
}: {
  onClose: () => void
  API_BASE: string
  keyId: string
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void
  onSuccess: () => void
  currentBudget: number
  adminKey: string | null
}) {
  const [tokens, setTokens] = useState(currentBudget.toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokens || parseInt(tokens) < 0) {
      setError('Please enter a valid number of tokens')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/admin/keys/${keyId}/add-budget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminKey && { 'X-Admin-Key': adminKey })
        },
        body: JSON.stringify({
          tokens: parseInt(tokens)
        })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to set budget')
      }
      setToast({ message: 'Budget updated successfully', type: 'success' })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error setting budget')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-900/50 rounded-full">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Set Budget</h2>
            <p className="text-slate-400 text-sm">Set the total token budget for a student</p>
          </div>
        </div>
        <p className="text-slate-300 mb-4">
          Set the total token budget for this student. Current budget: {currentBudget.toLocaleString()} tokens.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Total Budget (tokens)</label>
            <input
              type="number"
              value={tokens}
              onChange={(e) => setTokens(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="5000000"
              min="0"
              required
            />
            <p className="text-slate-500 text-xs mt-1">Set the absolute total budget (e.g., 5000000)</p>
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-800">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkCreateModal({
  onClose,
  API_BASE,
  setToast,
  onSuccess,
  adminKey
}: {
  onClose: () => void
  API_BASE: string
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void
  onSuccess: () => void
  adminKey: string | null
}) {
  const [csvContent, setCsvContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvContent.trim()) {
      setError('CSV content is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const lines = csvContent.trim().split('\n')
      const students = lines.map(line => {
        const parts = line.split(',')
        return {
          email: parts[0].trim(),
          name: parts[1]?.trim() || null,
          openai_key: parts[2]?.trim() || null,
          anthropic_key: parts[3]?.trim() || null,
          google_key: parts[4]?.trim() || null,
          github_key: parts[5]?.trim() || null
        }
      })

      const res = await fetch(`${API_BASE}/api/admin/keys/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminKey && { 'X-Admin-Key': adminKey })
        },
        body: JSON.stringify({
          students,
          budget: 5000000
        })
      })
      if (!res.ok) throw new Error('Failed to bulk create keys')
      const data = await res.json()
      setToast({
        message: `Created ${data.created.length} keys successfully`,
        type: 'success'
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating keys')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-orange-900/50 rounded-full">
            <FileText className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Bulk Create CTI Keys</h2>
            <p className="text-slate-400 text-sm">Create keys from CSV</p>
          </div>
        </div>
        <p className="text-slate-300 mb-4">
          Paste CSV content with email, optional name, and optional provider keys (one student per line):<br />
          <code className="text-xs bg-slate-700 px-2 py-1 rounded">student@example.edu,Student Name,openai_key_id,anthropic_key_id,google_key_id,github_key_id</code>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">CSV Content</label>
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="student1@example.edu,John Doe&#10;student2@example.edu,Jane Smith"
              rows={6}
              required
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-800">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Keys'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function UsageModal({
  onClose,
  keyData,
  providerKeys
}: {
  onClose: () => void
  keyData: CTIKey
  providerKeys: ProviderKey[]
}) {
  const used = keyData.used_tokens_input + keyData.used_tokens_output
  const remaining = keyData.total_budget_tokens - used
  const percentage = (used / keyData.total_budget_tokens) * 100
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(keyData.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-900/50 rounded-full">
            <Eye className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Detailed Usage</h2>
            <p className="text-slate-400 text-sm">{keyData.student_email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Token Budget</h3>
            <div className="text-2xl font-bold text-white">{keyData.total_budget_tokens.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Tokens Used</h3>
            <div className="text-2xl font-bold text-white">{used.toLocaleString()}</div>
            <div className="text-sm text-slate-400 mt-1">
              Input: {keyData.used_tokens_input.toLocaleString()} | Output: {keyData.used_tokens_output.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Remaining</h3>
            <div className={`text-2xl font-bold ${percentage > 90 ? 'text-red-400' : percentage > 70 ? 'text-yellow-400' : 'text-green-400'}`}>
              {remaining.toLocaleString()}
            </div>
            <div className="text-sm text-slate-400 mt-1">{percentage.toFixed(1)}% used</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Key Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Key ID:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono text-xs">{keyData.id}</span>
                  <button
                    onClick={copyToClipboard}
                    className="text-slate-400 hover:text-white transition-colors text-xs"
                    title="Copy key ID"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created:</span>
                <span className="text-white">{new Date(keyData.created_at).toLocaleDateString()}</span>
              </div>
              {keyData.expires_at && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Expires:</span>
                  <span className="text-white">{new Date(keyData.expires_at).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Last Used:</span>
                <span className="text-white">{keyData.last_used_at ? new Date(keyData.last_used_at).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Linked Provider Keys</h3>
            <div className="flex flex-wrap gap-2">
              {keyData.openai_key && (() => {
                const providerKey = providerKeys.find(pk => pk.id === keyData.openai_key)
                return <span className="text-xs px-2 py-1 bg-green-900/50 text-green-400 rounded">OpenAI ({providerKey?.label || keyData.openai_key.slice(0, 6)})</span>
              })()}
              {keyData.anthropic_key && (() => {
                const providerKey = providerKeys.find(pk => pk.id === keyData.anthropic_key)
                return <span className="text-xs px-2 py-1 bg-orange-900/50 text-orange-400 rounded">Anthropic ({providerKey?.label || keyData.anthropic_key.slice(0, 6)})</span>
              })()}
              {keyData.google_key && (() => {
                const providerKey = providerKeys.find(pk => pk.id === keyData.google_key)
                return <span className="text-xs px-2 py-1 bg-blue-900/50 text-blue-400 rounded">Google ({providerKey?.label || keyData.google_key.slice(0, 6)})</span>
              })()}
              {keyData.github_key && (() => {
                const providerKey = providerKeys.find(pk => pk.id === keyData.github_key)
                return <span className="text-xs px-2 py-1 bg-purple-900/50 text-purple-400 rounded">GitHub ({providerKey?.label || keyData.github_key.slice(0, 6)})</span>
              })()}
              {!keyData.openai_key && !keyData.anthropic_key && !keyData.google_key && !keyData.github_key && (
                <span className="text-xs text-slate-500">None (using global pool)</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function LoginModal({
  onClose,
  onLogin
}: {
  onClose: () => void
  onLogin: (key: string) => void
}) {
  const [adminKey, setAdminKeyInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminKey) {
      setError('Admin key is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Validate the admin key by making a test request
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API_BASE}/api/admin/provider-keys`, {
        headers: { 'X-Admin-Key': adminKey }
      })

      if (res.ok) {
        onLogin(adminKey)
      } else {
        setError('Invalid admin key')
      }
    } catch (err) {
      setError('Failed to validate admin key. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-900/50 rounded-full">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Admin Login</h2>
            <p className="text-slate-400 text-sm">Enter your admin key to access the dashboard</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Admin Key</label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKeyInput(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your admin key"
              required
            />
            <p className="text-slate-500 text-xs mt-1">This key is used to authenticate admin API requests</p>
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-800">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Validating...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
