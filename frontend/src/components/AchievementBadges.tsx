import { motion } from 'motion/react'
import { Shield, Heart, Diamond, BookOpen, Zap } from 'lucide-react'

interface Decision {
  fomo_score: string
  confidence: number
  outcome_pct: number | null
  reasoning: string
}

interface Props {
  decisions: Decision[]
}

interface Badge {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  check: (decisions: Decision[]) => boolean
  color: string
}

const badges: Badge[] = [
  {
    id: 'first-blood',
    name: 'First Blood',
    icon: Shield,
    check: (d) => d.length >= 1,
    color: 'border-accent text-accent',
  },
  {
    id: 'fomo-survivor',
    name: 'FOMO Survivor',
    icon: Heart,
    check: (d) =>
      d.filter((t) => t.fomo_score === 'HIGH' && t.outcome_pct !== null && t.outcome_pct > 0).length >= 3,
    color: 'border-accent text-accent',
  },
  {
    id: 'diamond-hands',
    name: 'Diamond Hands',
    icon: Diamond,
    check: (d) =>
      d.some((t) => t.confidence >= 9 && t.outcome_pct !== null && t.outcome_pct > 10),
    color: 'border-gold text-gold',
  },
  {
    id: 'loss-learner',
    name: 'Loss Learner',
    icon: BookOpen,
    check: (d) => {
      for (let i = 1; i < d.length; i++) {
        const prev = d[i - 1]
        if (prev.outcome_pct !== null && prev.outcome_pct < 0 && d[i].reasoning.length > 50) {
          return true
        }
      }
      return false
    },
    color: 'border-accent text-accent',
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    icon: Zap,
    check: (d) => {
      let streak = 0
      for (const t of d) {
        if (t.outcome_pct !== null && t.outcome_pct > 0) {
          streak++
          if (streak >= 3) return true
        } else {
          streak = 0
        }
      }
      return false
    },
    color: 'border-gold text-gold',
  },
]

export default function AchievementBadges({ decisions }: Props) {
  return (
    <motion.div
      className="flex gap-4 overflow-x-auto pb-2 scrollbar-none"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    >
      {badges.map((badge) => {
        const unlocked = badge.check(decisions)
        const Icon = badge.icon

        return (
          <motion.div
            key={badge.id}
            className="flex flex-col items-center gap-1.5 shrink-0"
            variants={{
              hidden: { opacity: 0, scale: 0 },
              visible: unlocked
                ? { opacity: 1, scale: [0, 1.2, 1], transition: { type: 'spring', stiffness: 300, damping: 20 } }
                : { opacity: 1, scale: 1 },
            }}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                unlocked
                  ? `${badge.color} bg-bg-elevated`
                  : 'border-dashed border-border text-text-muted opacity-40 bg-bg-card'
              }`}
            >
              {unlocked && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
              )}
              {!unlocked && <Icon className="w-5 h-5" />}
            </div>
            <span className="text-[10px] font-mono text-text-muted whitespace-nowrap">
              {badge.name}
            </span>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
