import { useState, useEffect, useRef } from 'react'
import { Wallet, Link2, KeyRound, AlertTriangle, CheckCircle, LogOut, TrendingUp, TrendingDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { getPortfolioAssets } from '../api'
import CorrelationMatrix from '../components/CorrelationMatrix'
import type { PortfolioAsset } from '../types'

const CRYPTO_PRICES: Record<string, number> = {
  BTC: 104832, ETH: 3912, SOL: 172, BNB: 695, USDT: 1,
  USDC: 1, XRP: 2.31, DOGE: 0.18, ADA: 0.77, AVAX: 38,
}

async function fetchLivePrices(coins: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {}
  await Promise.allSettled(
    coins.filter(c => c !== 'USDT').map(async (coin) => {
      try {
        const r = await fetch(`/price/${coin}USDT`)
        const d = await r.json()
        if (d.last_price) prices[coin] = parseFloat(d.last_price)
        else if (CRYPTO_PRICES[coin]) prices[coin] = CRYPTO_PRICES[coin]
      } catch {
        if (CRYPTO_PRICES[coin]) prices[coin] = CRYPTO_PRICES[coin]
      }
    })
  )
  prices.USDT = 1
  return prices
}

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
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showKeyForm, setShowKeyForm] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [passphrase, setPassphrase] = useState('')

  // Restore connection on mount if keys exist in localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('bitget_api_key')
    if (savedKey) handleConnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const data = await getPortfolioAssets()
      if (data.error) {
        setError(data.error)
      } else {
        const loadedAssets: PortfolioAsset[] = data.assets || []
        setAssets(loadedAssets)
        setIsDemo(data.demo ?? false)
        setConnected(true)
        // Fetch live prices for all coins
        const coins = loadedAssets.map((a: PortfolioAsset) => a.coin)
        const livePrices = await fetchLivePrices(coins)
        setPrices(livePrices)
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

  function handleDisconnect() {
    localStorage.removeItem('bitget_api_key')
    localStorage.removeItem('bitget_secret_key')
    localStorage.removeItem('bitget_passphrase')
    setConnected(false)
    setAssets([])
    setPrices({})
    setIsDemo(false)
    setApiKey('')
    setSecretKey('')
    setPassphrase('')
    setShowKeyForm(false)
  }

  const nonZeroAssets = assets.filter(a => parseFloat(a.available) > 0 || parseFloat(a.frozen) > 0)

  const totalUSD = nonZeroAssets.reduce((sum, a) => {
    const qty = parseFloat(a.available) + parseFloat(a.frozen)
    const price = prices[a.coin] ?? 0
    return sum + qty * price
  }, 0)

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
        {/* Web3 Wallet (placeholder) */}
        <motion.div className="bg-bg-card border border-border rounded-xl p-5" variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-text-secondary" />
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Web3 Wallet</span>
          </div>
          <button className="w-full px-4 py-3 border border-accent/30 rounded-xl text-sm font-medium text-accent hover:bg-accent/5 transition-all cursor-pointer">
            Connect MetaMask
          </button>
          <p className="text-[10px] text-text-muted mt-2 text-center">Coming soon</p>
        </motion.div>

        {/* Bitget API Connect */}
        <motion.div className="bg-bg-card border border-border rounded-xl p-5" variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Bitget API</span>
          </div>
          {connected ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-4 py-3 bg-bullish/[0.06] border border-bullish/20 rounded-xl">
                <CheckCircle className="w-4 h-4 text-bullish" />
                <span className="text-sm font-medium text-bullish">Connected</span>
                {isDemo && (
                  <span className="ml-auto px-2 py-0.5 text-[10px] font-mono font-bold bg-gold/10 text-gold border border-gold/20 rounded-md uppercase tracking-wide">
                    Demo
                  </span>
                )}
              </div>
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-muted hover:text-bearish hover:border-bearish/30 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
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
        <HoldingsPanel assets={nonZeroAssets} prices={prices} totalUSD={totalUSD} />
      )}

      {/* Correlation Matrix */}
      {connected && !loading && nonZeroAssets.length >= 2 && (
        <CorrelationWidget assets={nonZeroAssets} />
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

function HoldingsPanel({ assets, prices, totalUSD }: { assets: PortfolioAsset[]; prices: Record<string, number>; totalUSD: number }) {
  const hasPrices = Object.keys(prices).length > 0

  return (
    <div className="space-y-4 mb-6">
      {/* Portfolio value header */}
      {hasPrices && totalUSD > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="bg-bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-text-muted uppercase tracking-widest mb-1">Total Portfolio Value</div>
              <div className="text-3xl font-black text-text-primary tabular-nums tracking-tight">
                ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-text-muted uppercase tracking-widest mb-1">Assets</div>
              <div className="text-2xl font-bold text-text-primary">{assets.length}</div>
            </div>
          </div>
          {/* Allocation strip */}
          <AllocationStrip assets={assets} prices={prices} totalUSD={totalUSD} />
        </motion.div>
      )}

      {/* Holdings rows */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Holdings</h2>
          <span className="text-xs text-text-muted">{assets.length} assets</span>
        </div>

        {assets.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-8 h-8 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">No assets found in your spot account</p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-2 text-[10px] text-text-muted uppercase tracking-widest border-b border-border">
              <div>Asset</div>
              <div className="text-right">Balance</div>
              <div className="text-right">Price</div>
              <div className="text-right">Value</div>
            </div>
            {/* Rows */}
            <AnimatePresence>
              {assets.map((asset, i) => {
                const qty = parseFloat(asset.available) + parseFloat(asset.frozen)
                const price = prices[asset.coin] ?? 0
                const usdValue = qty * price
                const allocPct = totalUSD > 0 ? (usdValue / totalUSD) * 100 : 0

                return (
                  <motion.div
                    key={asset.coin}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="group grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-accent">{asset.coin.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-text-primary">{asset.coin}</div>
                        {allocPct > 0 && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="h-1 rounded-full bg-accent/20 w-12 overflow-hidden">
                              <motion.div
                                className="h-full bg-accent rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(allocPct, 100)}%` }}
                                transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                              />
                            </div>
                            <span className="text-[10px] text-text-muted tabular-nums">{allocPct.toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-text-primary font-mono tabular-nums">
                        {qty < 0.001 ? qty.toFixed(6) : qty.toFixed(4)}
                      </div>
                      {parseFloat(asset.frozen) > 0 && (
                        <div className="text-[10px] text-text-muted font-mono">
                          {parseFloat(asset.frozen).toFixed(4)} frozen
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-text-muted font-mono tabular-nums">
                      {price > 0 ? `$${price.toLocaleString('en-US', { maximumFractionDigits: price < 1 ? 4 : 2 })}` : '—'}
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold tabular-nums ${usdValue > 0 ? 'text-text-primary' : 'text-text-muted'}`}>
                        {usdValue > 0 ? `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

function AllocationStrip({ assets, prices, totalUSD }: { assets: PortfolioAsset[]; prices: Record<string, number>; totalUSD: number }) {
  if (totalUSD === 0) return null

  const segments = assets
    .map(a => {
      const qty = parseFloat(a.available) + parseFloat(a.frozen)
      const usdValue = qty * (prices[a.coin] ?? 0)
      return { coin: a.coin, usdValue, pct: (usdValue / totalUSD) * 100 }
    })
    .filter(s => s.pct > 0.5)
    .sort((a, b) => b.usdValue - a.usdValue)

  const COLORS = ['bg-accent', 'bg-gold', 'bg-bearish/70', 'bg-blue-400', 'bg-purple-400']

  return (
    <div className="mt-4">
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {segments.map((s, i) => (
          <motion.div
            key={s.coin}
            className={`${COLORS[i % COLORS.length]} rounded-full`}
            title={`${s.coin}: ${s.pct.toFixed(1)}%`}
            initial={{ flex: 0 }}
            animate={{ flex: s.pct }}
            transition={{ duration: 0.8, delay: 0.3 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {segments.slice(0, 5).map((s, i) => (
          <div key={s.coin} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${COLORS[i % COLORS.length]}`} />
            <span className="text-[10px] text-text-muted font-mono">{s.coin} {s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CorrelationWidget({ assets }: { assets: PortfolioAsset[] }) {
  const [data, setData] = useState<{ assets: string[]; matrix: number[][] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tickers = assets.map(a => a.coin).filter(c => c !== 'USDT').join(',')
    if (!tickers || tickers.split(',').length < 2) { setLoading(false); return }
    fetch(`/correlation?tickers=${tickers}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [assets])

  return <div className="mt-0"><CorrelationMatrix data={data} loading={loading} /></div>
}
