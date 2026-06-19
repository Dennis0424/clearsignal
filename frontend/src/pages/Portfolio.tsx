import { useState } from 'react'
import { Wallet, Link2, KeyRound, AlertTriangle, CheckCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { getPortfolioAssets } from '../api'
import type { PortfolioAsset } from '../types'

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

export default function Portfolio() {
  const [connected, setConnected] = useState(false)
  const [assets, setAssets] = useState<PortfolioAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showKeyForm, setShowKeyForm] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
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
        setIsDemo(data.demo ?? false)
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
    <motion.div className="max-w-7xl mx-auto px-6 py-10" variants={pageVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div className="flex items-center gap-3 mb-8" variants={itemVariants}>
        <Wallet className="w-5 h-5 text-accent" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Portfolio</h1>
          <p className="text-text-secondary text-sm">Connect to Bitget to view your holdings</p>
        </div>
      </motion.div>

      {/* Connect Cards */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8" variants={containerVariants} initial="hidden" animate="visible">
        {/* Wallet Connect (placeholder for wagmi) */}
        <motion.div className="bg-bg-card border border-border rounded-xl p-5" variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-text-secondary" />
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Web3 Wallet</span>
          </div>
          <button className="w-full px-4 py-3 border border-accent/30 rounded-xl text-sm font-medium text-accent hover:bg-accent/5 transition-all cursor-pointer">
            Connect MetaMask
          </button>
          <p className="text-[10px] text-text-muted mt-2 text-center">Coming soon — wagmi integration</p>
        </motion.div>

        {/* Bitget API Connect */}
        <motion.div className="bg-bg-card border border-border rounded-xl p-5" variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-accent" />
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
                className="w-full px-3 py-2 bg-bg-deep border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-all" />
              <input type="password" placeholder="Secret Key" value={secretKey} onChange={e => setSecretKey(e.target.value)}
                className="w-full px-3 py-2 bg-bg-deep border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-all" />
              <input type="password" placeholder="Passphrase" value={passphrase} onChange={e => setPassphrase(e.target.value)}
                className="w-full px-3 py-2 bg-bg-deep border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-all" />
              <button onClick={handleSaveKeys} disabled={!apiKey || !secretKey || !passphrase}
                className="w-full px-4 py-2.5 bg-accent text-bg-deep rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer">
                Connect
              </button>
            </div>
          ) : (
            <button onClick={() => setShowKeyForm(true)}
              className="w-full px-4 py-3 border border-accent/30 rounded-xl text-sm font-medium text-accent hover:bg-accent/5 transition-all cursor-pointer">
              Enter API Keys
            </button>
          )}
        </motion.div>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="bg-bg-card border border-border rounded-xl px-5 py-4 text-sm text-bearish flex items-center gap-3 mb-6">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-bg-card border border-border rounded-xl p-6">
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
        <div className="bg-bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-text-primary">Holdings</h2>
              {isDemo && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-gold/10 text-gold border border-gold/20 rounded-md uppercase tracking-wide">
                  Demo
                </span>
              )}
            </div>
            <span className="text-xs text-text-muted">{nonZeroAssets.length} assets</span>
          </div>

          {nonZeroAssets.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-8 h-8 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted">No assets found in your spot account</p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 px-4 py-2 text-[11px] text-text-muted uppercase tracking-wide">
                <div>Asset</div>
                <div className="text-right">Available</div>
                <div className="text-right">Frozen</div>
              </div>
              {/* Rows */}
              {nonZeroAssets.map((asset) => (
                <div key={asset.coin} className="grid grid-cols-3 gap-4 px-4 py-3 border-b border-border">
                  <div className="font-semibold text-sm text-text-primary">{asset.coin}</div>
                  <div className="text-right text-sm text-text-primary font-mono">{parseFloat(asset.available).toFixed(6)}</div>
                  <div className="text-right text-sm text-text-muted font-mono">{parseFloat(asset.frozen).toFixed(6)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state when not connected */}
      {!connected && !loading && !error && (
        <motion.div className="bg-bg-card border border-border rounded-xl p-12 text-center" variants={itemVariants} initial="hidden" animate="visible">
          <Wallet className="w-10 h-10 text-text-muted mx-auto mb-4" />
          <h3 className="text-base font-semibold text-text-primary mb-2">Connect to see your portfolio</h3>
          <p className="text-sm text-text-secondary max-w-sm mx-auto">Enter your Bitget API keys above to view your spot holdings. Keys are stored locally and never sent to our servers.</p>
        </motion.div>
      )}
    </motion.div>
  )
}
