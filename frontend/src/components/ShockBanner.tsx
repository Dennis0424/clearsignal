import { AlertTriangle } from 'lucide-react'

export default function ShockBanner() {
  return (
    <div className="flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-xl px-4 py-3">
      <AlertTriangle className="w-5 h-5 text-accent shrink-0" />
      <p className="text-sm text-accent">
        <span className="font-semibold">Macro/news shock detected</span> — signal may be distorted by fear-driven conditions. Exercise caution.
      </p>
    </div>
  )
}
