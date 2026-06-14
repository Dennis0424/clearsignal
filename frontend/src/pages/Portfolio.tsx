import { useState } from 'react'
import { Wallet, Link2, KeyRound, AlertTriangle, CheckCircle } from 'lucide-react'
import { getPortfolioAssets } from '../api'
import type { PortfolioAsset } from '../types'

export default function Portfolio() {
  const [connected, setConnected] = useState(false)
  const [assets, setAssets] = useState<PortfolioAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showKeyForm, setShowKeyForm] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [passphrase, setPassphrase] = useState('')

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const data = await getPortfolioAssets()
      if (data.error) {
        setError(data.error)
      } else {
        setAssets(data.assets || [])
        setConnected(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  function handleSaveKeys() {
    if (!apiKey || !secretKey || !passphrase) return
    localStorage.setItem('bitget_api_key', apiKey)
    localStorage.setItem('bitget_secret_key', secretKey)
    localStorage.setItem('bitget_passphrase', passphrase)
    setShowKeyForm(false)
    handleConnect()
  }

  const nonZeroAssets = assets.filter(a => parseFloat(a.available) > 0 || parseFloat(a.frozen) > 0)

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bullish to-emerald-400 flex items-center justify-center glow-bullish">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Portfolio</h1>
          <p className="text-text-secondary text-sm">Connect to Bitget to view your holdings</p>
        </div>
      </div>

      {/* Connect Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Wallet Connect (placeholder for wagmi) */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-purple-light" />
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Web3 Wallet</span>
          </div>
          <button className="w-full px-4 py-3 border border-purple/30 rounded-xl text-sm font-medium text-purple-light hover:bg-purple/5 transition-all cursor-pointer">
            Connect MetaMask
          </button>
          <p className="text-[10px] text-text-muted mt-2 text-center">Coming soon — wagmi integration</p>
        </div>

        {/* Bitget API Connect */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-gold" />
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Bitget API</span>
          </div>
          {connected ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-bullish/[0.06] border border-bullish/20 rounded-xl">
              <CheckCircle className="w-4 h-4 text-bullish" />
              <span className="text-sm font-medium text-bullish">Connected</span>
            </div>
          ) : showKeyForm ? (
            <div className="space-y-2">
              <input type="password" placeholder="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-all" />
              <input type="password" placeholder="Secret Key" value={secretKey} onChange={e => setSecretKey(e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-all" />
              <input type="password" placeholder="Passphrase" value={passphrase} onChange={e => setPassphrase(e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-all" />
              <button onClick={handleSaveKeys} disabled={!apiKey || !secretKey || !passphrase}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-gold to-gold-light text-bg-deep rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer">
                Connect
              </button>
            </div>
          ) : (
            <button onClick={() => setShowKeyForm(true)}
              className="w-full px-4 py-3 border border-gold/30 rounded-xl text-sm font-medium text-gold hover:bg-gold/5 transition-all cursor-pointer">
              Enter API Keys
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card px-5 py-4 text-sm text-bearish flex items-center gap-3 mb-6 glow-bearish">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="glass-card p-6">
          <div className="h-5 shimmer rounded w-1/4 mb-4" />
          <div className="space-y-3">
            <div className="h-10 shimmer rounded-xl" />
            <div className="h-10 shimmer rounded-xl" />
            <div className="h-10 shimmer rounded-xl" />
          </div>
        </div>
      )}

      {/* Holdings Table */}
      {connected && !loading && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-text-primary">Holdings</h2>
            <span className="text-xs text-text-muted">{nonZeroAssets.length} assets</span>
          </div>

          {nonZeroAssets.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-8 h-8 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted">No assets found in your spot account</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 px-4 py-2 text-[11px] text-text-muted uppercase tracking-wide">
                <div>Asset</div>
                <div className="text-right">Available</div>
                <div className="text-right">Frozen</div>
              </div>
              {/* Rows */}
              {nonZeroAssets.map((asset) => (
                <div key={asset.coin} className="grid grid-cols-3 gap-4 px-4 py-3 bg-surface/50 rounded-xl border border-border">
                  <div className="font-semibold text-sm text-text-primary">{asset.coin}</div>
                  <div className="text-right text-sm text-text-primary tabular-nums">{parseFloat(asset.available).toFixed(6)}</div>
                  <div className="text-right text-sm text-text-muted tabular-nums">{parseFloat(asset.frozen).toFixed(6)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state when not connected */}
      {!connected && !loading && !error && (
        <div className="glass-card p-12 text-center">
          <Wallet className="w-10 h-10 text-text-muted mx-auto mb-4" />
          <h3 className="text-base font-semibold text-text-primary mb-2">Connect to see your portfolio</h3>
          <p className="text-sm text-text-secondary max-w-sm mx-auto">Enter your Bitget API keys above to view your spot holdings. Keys are stored locally and never sent to our servers.</p>
        </div>
      )}
    </div>
  )
}
