import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Star, Trash2, TrendingUp, TrendingDown, Plus } from 'lucide-react'

const STORAGE_KEY = 'clearsignal_watchlist'

type WatchItem = {
  ticker: string
  addedAt: number
  price?: number
  change?: number
}

function useWatchlist() {
  const [list, setList] = useState<WatchItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch { return [] }
  })

  function add(ticker: string) {
    setList(prev => {
      if (prev.find(i => i.ticker === ticker)) return prev
      const next = [{ ticker, addedAt: Date.now() }, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function remove(ticker: string) {
    setList(prev => {
      const next = prev.filter(i => i.ticker !== ticker)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function isWatched(ticker: string) {
    return list.some(i => i.ticker === ticker)
  }

  return { list, add, remove, isWatched }
}

export function WatchlistButton({ ticker }: { ticker: string }) {
  const { add, remove, isWatched } = useWatchlist()
  const watched = isWatched(ticker)

  return (
    <motion.button
      onClick={() => watched ? remove(ticker) : add(ticker)}
      whileTap={{ scale: 0.92 }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
        watched
          ? 'bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20'
          : 'bg-bg-elevated border border-border text-text-muted hover:text-text-secondary hover:border-border-light'
      }`}
    >
      <Star className={`w-3.5 h-3.5 ${watched ? 'fill-gold' : ''}`} />
      {watched ? 'Watching' : 'Watch'}
    </motion.button>
  )
}

async function fetchLivePriceForTicker(ticker: string): Promise<{ price: number; change: number } | null> {
  try {
    const symbol = `${ticker}USDT`
    const r = await fetch(`/price/${symbol}`)
    const d = await r.json()
    if (d.last_price) {
      return {
        price: parseFloat(d.last_price),
        change: parseFloat(d.change_24h || '0') * 100,
      }
    }
  } catch { /* fall through */ }
  return null
}

export default function Watchlist() {
  const { list, remove } = useWatchlist()
  const [priceMap, setPriceMap] = useState<Record<string, { price: number; change: number }>>({})
  const [newTicker, setNewTicker] = useState('')
  const { add } = useWatchlist()
  const navigate = useNavigate()

  useEffect(() => {
    const cryptoTickers = list.filter(item => {
      const known = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'MATIC', 'DOT']
      return known.includes(item.ticker.toUpperCase())
    })
    Promise.all(
      cryptoTickers.map(async (item) => {
        const data = await fetchLivePriceForTicker(item.ticker)
        if (data) setPriceMap(prev => ({ ...prev, [item.ticker]: data }))
      })
    )
  }, [list.length])

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const t = newTicker.trim().toUpperCase()
    if (t) { add(t); setNewTicker('') }
  }

  if (list.length === 0) return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-gold" />
        <span className="text-sm font-semibold text-text-primary">Watchlist</span>
      </div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <input
          value={newTicker}
          onChange={e => setNewTicker(e.target.value.toUpperCase())}
          placeholder="Add ticker (BTC, AAPL...)"
          className="flex-1 px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-all"
        />
        <button type="submit" className="px-3 py-2 bg-accent/10 border border-accent/20 text-accent rounded-lg hover:bg-accent/20 transition-all cursor-pointer">
          <Plus className="w-4 h-4" />
        </button>
      </form>
      <p className="text-xs text-text-muted text-center py-4">No tickers yet. Add some or click the star on any research.</p>
    </div>
  )

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-gold fill-gold" />
          <span className="text-sm font-semibold text-text-primary">Watchlist</span>
          <span className="text-[10px] font-mono text-text-muted">{list.length}</span>
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 px-4 py-3 border-b border-border">
        <input
          value={newTicker}
          onChange={e => setNewTicker(e.target.value.toUpperCase())}
          placeholder="Add ticker (BTC, AAPL...)"
          className="flex-1 px-3 py-1.5 bg-bg-elevated border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-all"
        />
        <button type="submit" className="px-2.5 py-1.5 bg-accent/10 border border-accent/20 text-accent rounded-lg hover:bg-accent/20 transition-all cursor-pointer text-xs">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>

      <AnimatePresence>
        {list.map((item, i) => {
          const priceData = priceMap[item.ticker]
          const isPositive = priceData ? priceData.change >= 0 : true
          return (
            <motion.div
              key={item.ticker}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="border-b border-border last:border-b-0"
            >
              <div className="flex items-center gap-3 px-5 py-3 group">
                <button
                  onClick={() => navigate(`/research?ticker=${item.ticker}`)}
                  className="flex-1 flex items-center gap-3 cursor-pointer text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-gold">{item.ticker.slice(0, 2)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{item.ticker}</div>
                    {priceData && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-text-muted">
                          ${priceData.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] font-mono ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                          {isPositive ? <TrendingUp className="w-2.5 h-2.5 inline" /> : <TrendingDown className="w-2.5 h-2.5 inline" />}
                          {' '}{priceData.change >= 0 ? '+' : ''}{priceData.change.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => remove(item.ticker)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-bearish transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
