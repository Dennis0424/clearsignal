import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';

type Session = 'pre-market' | 'regular' | 'after-hours' | 'closed';

interface SessionInfo {
  status: Session;
  label: string;
  countdown: string;
  progress: number;
}

function getEasternTime(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  // EDT = UTC-4
  return new Date(utc - 4 * 3600000);
}

function getSessionInfo(): SessionInfo {
  const et = getEasternTime();
  const day = et.getDay(); // 0=Sun, 6=Sat
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const seconds = et.getSeconds();
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  // Weekend
  if (day === 0 || day === 6) {
    // Calculate seconds until Monday 4:00 AM ET
    const daysUntilMonday = day === 0 ? 1 : 2;
    const secondsUntilMonday = daysUntilMonday * 86400 - totalSeconds + 4 * 3600;
    return {
      status: 'closed',
      label: 'Market Closed',
      countdown: formatCountdown(secondsUntilMonday),
      progress: 0,
    };
  }

  // Session boundaries in seconds from midnight
  const preMarketStart = 4 * 3600;    // 4:00 AM
  const regularStart = 9.5 * 3600;    // 9:30 AM
  const regularEnd = 16 * 3600;       // 4:00 PM
  const afterHoursEnd = 20 * 3600;    // 8:00 PM

  if (totalSeconds >= preMarketStart && totalSeconds < regularStart) {
    const elapsed = totalSeconds - preMarketStart;
    const duration = regularStart - preMarketStart;
    const remaining = regularStart - totalSeconds;
    return {
      status: 'pre-market',
      label: 'Pre-Market',
      countdown: `Opens in ${formatCountdown(remaining)}`,
      progress: elapsed / duration,
    };
  }

  if (totalSeconds >= regularStart && totalSeconds < regularEnd) {
    const elapsed = totalSeconds - regularStart;
    const duration = regularEnd - regularStart;
    const remaining = regularEnd - totalSeconds;
    return {
      status: 'regular',
      label: 'Market Open',
      countdown: `Closes in ${formatCountdown(remaining)}`,
      progress: elapsed / duration,
    };
  }

  if (totalSeconds >= regularEnd && totalSeconds < afterHoursEnd) {
    const elapsed = totalSeconds - regularEnd;
    const duration = afterHoursEnd - regularEnd;
    const remaining = afterHoursEnd - totalSeconds;
    return {
      status: 'after-hours',
      label: 'After-Hours',
      countdown: `Ends in ${formatCountdown(remaining)}`,
      progress: elapsed / duration,
    };
  }

  // Closed (before 4 AM or after 8 PM)
  let secondsUntilPreMarket: number;
  if (totalSeconds < preMarketStart) {
    secondsUntilPreMarket = preMarketStart - totalSeconds;
  } else {
    // After 8 PM, next pre-market is tomorrow (or Monday if Friday)
    const remainingToday = 86400 - totalSeconds;
    if (day === 5) {
      // Friday after 8 PM -> Monday 4 AM
      secondsUntilPreMarket = remainingToday + 2 * 86400 + preMarketStart;
    } else {
      secondsUntilPreMarket = remainingToday + preMarketStart;
    }
  }

  return {
    status: 'closed',
    label: 'Market Closed',
    countdown: `Opens in ${formatCountdown(secondsUntilPreMarket)}`,
    progress: 0,
  };
}

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  const s = Math.floor(totalSeconds % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const dotColors: Record<Session, string> = {
  regular: 'bg-accent',
  'pre-market': 'bg-gold',
  'after-hours': 'bg-gold',
  closed: 'bg-text-muted',
};

const barColors: Record<Session, string> = {
  regular: 'bg-accent',
  'pre-market': 'bg-gold',
  'after-hours': 'bg-gold',
  closed: 'bg-text-muted',
};

export default function MarketStatus() {
  const [info, setInfo] = useState<SessionInfo>(getSessionInfo);

  useEffect(() => {
    const id = setInterval(() => {
      setInfo(getSessionInfo());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-bg-card px-4 py-3 inline-flex items-center gap-3">
      {/* Status dot */}
      <motion.span
        className={`h-2.5 w-2.5 rounded-full ${dotColors[info.status]}`}
        animate={
          info.status === 'regular'
            ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
            : info.status === 'pre-market' || info.status === 'after-hours'
              ? { opacity: [1, 0.5, 1] }
              : {}
        }
        transition={
          info.status !== 'closed'
            ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      />

      {/* Status label */}
      <span className="text-sm font-medium text-text-primary">
        {info.label}
      </span>

      {/* Divider */}
      <span className="h-4 w-px bg-border" />

      {/* Countdown */}
      <span className="flex items-center gap-1.5 text-xs text-text-muted">
        <Clock size={12} />
        {info.countdown}
      </span>

      {/* Progress bar */}
      {info.progress > 0 && (
        <div className="h-1.5 w-16 rounded-full bg-bg-elevated overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${barColors[info.status]}`}
            initial={{ width: 0 }}
            animate={{ width: `${info.progress * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      )}
    </div>
  );
}
