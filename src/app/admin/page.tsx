'use client'

import { useState, useEffect } from 'react'
import { Trash2, RefreshCw, Plus, Globe, CheckCircle, AlertCircle, Pencil } from 'lucide-react'

interface ProviderKey {
  id: string
  provider: string
  label: string | null
  active: boolean
  created_at: string
  last_used_at: string | null
  notes: string | null
}

export default function AdminDashboard() {
  const [providerKeys, setProviderKeys] = useState<ProviderKey[]>([])
  const [showProviderKeysModal, setShowProviderKeysModal] = useState(false)
  const [showCreateProviderKeyModal, setShowCreateProviderKeyModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const fetchProviderKeys = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/provider-keys`)
      if (res.ok) {
        const data = await res.json()
        setProviderKeys(data)
      }
    } catch (err) {
      console.error('Error fetching provider keys:', err)
    }
  }

  // Fetch provider keys on mount
  useEffect(() => {
    fetchProviderKeys()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Provider API Keys</h1>
            <p className="text-slate-400 mt-1">Manage API keys for OpenAI, Anthropic, Google, GitHub</p>
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
                            // Toggle active status
                            fetch(`${API_BASE}/api/admin/provider-keys/${key.id}/${key.active ? 'deactivate' : 'activate'}`, {
                              method: 'POST',
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
  onSuccess 
}: { 
  onClose: () => void
  API_BASE: string
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void
  onSuccess: () => void
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
          'Content-Type': 'application/json'
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
