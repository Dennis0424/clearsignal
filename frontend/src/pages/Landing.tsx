import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'motion/react'
import SignalMark from '../components/SignalMark'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ─── Particle canvas background ─── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let w = canvas.offsetWidth
    let h = canvas.offsetHeight
    canvas.width = w
    canvas.height = h

    const COUNT = Math.floor((w * h) / 18000)
    const CONNECT_DIST = 140
    const COLOR = '16, 185, 129' // emerald RGB

    type Particle = { x: number; y: number; vx: number; vy: number; r: number }

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.2 + 0.6,
    }))

    function draw() {
      ctx!.clearRect(0, 0, w, h)

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.15
            ctx!.beginPath()
            ctx!.strokeStyle = `rgba(${COLOR}, ${alpha})`
            ctx!.lineWidth = 0.5
            ctx!.moveTo(particles[i].x, particles[i].y)
            ctx!.lineTo(particles[j].x, particles[j].y)
            ctx!.stroke()
          }
        }
      }

      // Draw dots
      for (const p of particles) {
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${COLOR}, 0.35)`
        ctx!.fill()

        // Move
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    const handleResize = () => {
      w = canvas.offsetWidth
      h = canvas.offsetHeight
      canvas.width = w
      canvas.height = h
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  )
}

/* ─── Scroll Progress Bar ─── */
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-accent z-50 origin-left"
      style={{ scaleX: scrollYProgress }}
    />
  )
}

/* ─── Counter that animates from 00 to target when in view ─── */
function AnimatedNumber({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const target = parseInt(value, 10)

  useEffect(() => {
    if (!isInView || !ref.current) return
    const el = ref.current
    let frame: number
    const duration = 600
    const start = performance.now()

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * target)
      el.textContent = current.toString().padStart(2, '0')
      if (progress < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [isInView, target])

  return <span ref={ref}>00</span>
}

/* ─── Typewriter code block ─── */
function TypewriterLines({ children }: { children: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <div ref={ref}>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -4 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }}
          transition={{ delay: i * 0.1, duration: 0.3, ease: 'easeOut' }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}

/* ─── Hero stagger variants ─── */
const heroContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const heroItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
}

/* ─── Live platform stats strip ─── */
function StatsStrip() {
  const [decisionCount, setDecisionCount] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  useEffect(() => {
    fetch('/decision-log')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setDecisionCount(data.length)
      })
      .catch(() => null)
  }, [])

  const stats = [
    { label: 'Tickers Supported', value: '15+', sub: 'stocks & crypto' },
    { label: 'Decisions Logged', value: decisionCount != null ? String(decisionCount) : '—', sub: 'in this session' },
    { label: 'AI Agents', value: '5', sub: 'per analysis' },
    { label: 'Behavioral Checks', value: '8', sub: 'FOMO signals' },
  ]

  return (
    <div ref={ref} className="border-t border-border px-6 md:px-12 py-8">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-2xl font-black text-text-primary font-mono tabular-nums">{s.value}</div>
            <div className="text-xs font-semibold text-text-primary mt-0.5">{s.label}</div>
            <div className="text-[10px] text-text-muted">{s.sub}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ─── Feature card reveal variants ─── */
const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 80, damping: 16 },
  },
}

/* ─── Apple-style sticky scroll feature tour ─── */
function ScrollFeatureSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      label: 'Multi-Agent Scoring',
      heading: 'Five AI agents argue so you don\'t have to.',
      body: 'Technical, sentiment, macro, news, and market intel — each module scores independently. No single point of failure. No echo chamber.',
      highlight: 'technical',
    },
    {
      label: 'FOMO Guardian',
      heading: 'Your behavioral blind spots, exposed.',
      body: 'Before you trade, a behavioral analysis scores your emotional state. Consecutive green days, recent losses, position sizing errors — all flagged.',
      highlight: 'fomo',
    },
    {
      label: 'Decision Journal',
      heading: 'Every trade is a bet. Track whether you\'re right.',
      body: 'Log your reasoning and confidence before executing. Review outcomes. The journal turns gut feeling into data.',
      highlight: 'journal',
    },
    {
      label: 'Bitget Execution',
      heading: 'Research to order in one flow.',
      body: 'No tab switching. No copy-pasting tickers. Connect your Bitget API and execute directly from the research interface.',
      highlight: 'execute',
    },
  ]

  useEffect(() => {
    if (!containerRef.current) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      steps.forEach((_, i) => {
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: `top+=${i * 25}% center`,
          end: `top+=${(i + 1) * 25}% center`,
          onEnter: () => setActiveStep(i),
          onEnterBack: () => setActiveStep(i),
        })
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const agentRows = [
    { key: 'technical', label: 'Technical', value: '+1.4σ', color: 'text-bullish' },
    { key: 'fomo', label: 'FOMO Check', value: 'LOW', color: 'text-accent' },
    { key: 'journal', label: 'Journal', value: 'Logged', color: 'text-gold' },
    { key: 'execute', label: 'Execution', value: 'Ready', color: 'text-accent' },
  ]

  return (
    <section className="px-6 md:px-12 py-24 border-t border-border">
      <div className="max-w-7xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-16">
          <div className="h-[1px] w-8 bg-accent" />
          <span className="text-xs font-mono text-accent uppercase tracking-[0.16em]">Platform Tour</span>
        </div>

        {/* Sticky scroll container */}
        <div ref={containerRef} className="relative h-[150vh]">
          <div className="sticky top-[15vh] grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-16 items-center">

            {/* Left: swapping text */}
            <div className="relative min-h-[280px]">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={activeStep === i
                    ? { opacity: 1, y: 0, pointerEvents: 'auto' }
                    : { opacity: 0, y: activeStep > i ? -16 : 16, pointerEvents: 'none' }
                  }
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-mono text-accent">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-xs font-mono text-text-muted uppercase tracking-widest">{step.label}</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight leading-[1.1] mb-5">
                    {step.heading}
                  </h2>
                  <p className="text-base text-text-secondary leading-relaxed max-w-[46ch]">
                    {step.body}
                  </p>
                </motion.div>
              ))}

              {/* Step dots */}
              <div className="absolute bottom-0 flex items-center gap-2">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-[2px] transition-all duration-300 rounded-full ${activeStep === i ? 'w-6 bg-accent' : 'w-2 bg-border'}`}
                  />
                ))}
              </div>
            </div>

            {/* Right: product UI that highlights active row */}
            <div className="hidden lg:block bg-bg-card border border-border rounded-xl p-5 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs font-mono text-text-muted">AAPL — Live Analysis</span>
                </div>
                <span className="text-xs font-mono text-text-muted">Score 7.2/10</span>
              </div>
              <div className="space-y-1">
                {agentRows.map((row) => (
                  <motion.div
                    key={row.key}
                    animate={steps[activeStep]?.highlight === row.key
                      ? { backgroundColor: 'rgba(16,185,129,0.06)', x: 2 }
                      : { backgroundColor: 'rgba(0,0,0,0)', x: 0 }
                    }
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-transparent"
                    style={steps[activeStep]?.highlight === row.key ? { borderColor: 'rgba(16,185,129,0.15)' } : {}}
                  >
                    <span className="text-xs text-text-secondary">{row.label}</span>
                    <span className={`text-xs font-mono font-semibold ${steps[activeStep]?.highlight === row.key ? row.color : 'text-text-muted'}`}>
                      {row.value}
                    </span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-xs font-mono text-text-muted mb-1">Confluence</div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <div key={n} className={`h-1 flex-1 rounded-full ${n <= 4 ? 'bg-accent' : 'bg-border'}`} />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  /* Parallax for preview card */
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const previewY = useTransform(heroScroll, [0, 1], [0, 80])

  /* GSAP: horizontal line grows between steps */
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: stepsRef.current,
              start: 'top 80%',
              end: 'bottom 60%',
              scrub: 0.5,
            },
          }
        )
      }
    })

    return () => ctx.revert()
  }, [])

  /* Smooth scroll for anchor links */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a[href^="#"]')
      if (!anchor) return
      const id = anchor.getAttribute('href')
      if (!id) return
      const el = document.querySelector(id)
      if (el) {
        e.preventDefault()
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  /* ─── Feature section inView ─── */
  const featuresRef = useRef<HTMLDivElement>(null)
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.1 })

  /* ─── How it works inView ─── */
  const howRef = useRef<HTMLDivElement>(null)
  const howInView = useInView(howRef, { once: true, amount: 0.1 })

  /* ─── Trust bar inView ─── */
  const trustRef = useRef<HTMLDivElement>(null)
  const trustInView = useInView(trustRef, { once: true, amount: 0.1 })

  /* ─── CTA inView ─── */
  const ctaRef = useRef<HTMLDivElement>(null)
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.1 })

  return (
    <div className="min-h-[100dvh] bg-bg-deep">
      <ScrollProgressBar />

      {/* Hero - left-aligned, asymmetric */}
      <section ref={heroRef} className="min-h-[80dvh] flex items-center px-6 md:px-12 pt-20 pb-16 relative overflow-hidden">
        <ParticleCanvas />
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-16 items-center">
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={heroItem} className="flex items-center gap-3 mb-8">
              <SignalMark size={28} className="text-accent" animate={true} />
              <div className="h-[1px] w-12 bg-accent/40" />
            </motion.div>
            <motion.h1
              variants={heroItem}
              className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-text-primary leading-[1.08] tracking-tighter mb-4"
            >
              73% of retail traders<br className="hidden md:block" /> lose money.
            </motion.h1>
            <motion.p
              variants={heroItem}
              className="text-lg text-accent font-medium mb-5"
            >
              You don't have to.
            </motion.p>
            <motion.p
              variants={heroItem}
              className="text-base text-text-secondary max-w-[52ch] leading-relaxed mb-10"
            >
              Five AI agents score every trade independently. A behavioral guardian catches FOMO before you click buy. One flow, one platform.
            </motion.p>
            <motion.div variants={heroItem} className="flex items-center gap-4">
              <Link
                to="/research"
                className="px-6 py-3 bg-accent text-bg-deep rounded-lg font-semibold text-sm hover:bg-accent-light transition-colors duration-200"
              >
                Open App
              </Link>
              <a
                href="#features"
                className="text-sm text-text-muted hover:text-text-secondary transition-colors duration-200"
              >
                How it works
              </a>
            </motion.div>
          </motion.div>

          {/* Product preview - real UI snippet, not fake orbs */}
          <div className="hidden lg:block" ref={previewRef}>
            <motion.div
              initial={{ opacity: 0, y: 40, rotateX: 4 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                type: 'spring',
                stiffness: 60,
                damping: 18,
                delay: 0.6,
              }}
              style={{ y: previewY, perspective: 800 }}
              className="bg-bg-card border border-border rounded-xl p-5 shadow-2xl shadow-black/40"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-xs font-mono text-text-muted">NVDA</span>
                </div>
                <span className="text-xs font-mono text-text-muted">Score 7.2/10</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-text-secondary">Technical</span>
                  <span className="text-xs font-mono text-accent">Bullish</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-text-secondary">Sentiment</span>
                  <span className="text-xs font-mono text-accent">Bullish</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-text-secondary">Macro</span>
                  <span className="text-xs font-mono text-text-muted">Neutral</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-text-secondary">News</span>
                  <span className="text-xs font-mono text-accent">Bullish</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-text-secondary">Market Intel</span>
                  <span className="text-xs font-mono text-bearish">Bearish</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-text-muted">Confluence</span>
                <span className="text-sm font-semibold text-text-primary">4/5 Bullish</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <StatsStrip />

      {/* Features - asymmetric bento, NOT 3 equal cards */}
      <section id="features" className="px-6 md:px-12 py-24">
        <div className="max-w-7xl mx-auto" ref={featuresRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Large feature - spans full width on first row */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate={featuresInView ? 'visible' : 'hidden'}
              className="md:col-span-2 bg-bg-card border border-border rounded-xl p-8 md:p-10 grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-8 items-center hover:-translate-y-0.5 hover:border-border-light transition-all duration-200"
            >
              <div>
                <span className="text-xs font-mono text-accent mb-3 block">Multi-Agent Research</span>
                <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight mb-3">
                  Five agents, one verdict.
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Technical analysis, social sentiment, macro conditions, news flow, and market intelligence - scored independently, debated by AI, judged impartially.
                </p>
              </div>
              <div className="bg-bg-deep border border-border rounded-lg p-5 font-mono text-xs">
                <TypewriterLines>
                  <div className="text-text-muted mb-2"># Agent consensus for AAPL</div>
                  <div className="flex justify-between"><span className="text-text-secondary">technical</span><span className="text-accent">+1.4&sigma; bullish</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">sentiment</span><span className="text-accent">+0.8&sigma; bullish</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">macro</span><span className="text-text-muted">-0.2&sigma; neutral</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">news</span><span className="text-accent">+1.1&sigma; bullish</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">intel</span><span className="text-bearish">-1.3&sigma; bearish</span></div>
                  <div className="mt-3 pt-3 border-t border-border text-text-primary">
                    verdict: <span className="text-accent">BULLISH</span> (4/5 confluence)
                  </div>
                </TypewriterLines>
              </div>
            </motion.div>

            {/* Two smaller cards */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate={featuresInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.15 }}
              className="bg-bg-card border border-border rounded-xl p-7 hover:-translate-y-0.5 hover:border-border-light transition-all duration-200"
            >
              <span className="text-xs font-mono text-gold mb-3 block">FOMO Guardian</span>
              <h3 className="text-lg font-bold text-text-primary tracking-tight mb-2">
                Stop. Think. Then trade.
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-5">
                Before every trade, a behavioral check scores your emotional state. If you're chasing green candles, you'll know it.
              </p>
              <div className="bg-bg-deep border border-border rounded-lg px-4 py-3 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                  <span className="text-gold font-mono">MODERATE RISK</span>
                </div>
                <span className="text-text-muted">3 consecutive green days detected. Regret: -$420 at 10% drawdown.</span>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate={featuresInView ? 'visible' : 'hidden'}
              transition={{ delay: 0.3 }}
              className="bg-bg-card border border-border rounded-xl p-7 hover:-translate-y-0.5 hover:border-border-light transition-all duration-200"
            >
              <span className="text-xs font-mono text-accent mb-3 block">One-Click Execute</span>
              <h3 className="text-lg font-bold text-text-primary tracking-tight mb-2">
                Research to trade in one flow.
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-5">
                Connected directly to Bitget. No tab switching, no copy-pasting symbols. Decide and execute in the same interface.
              </p>
              <div className="bg-bg-deep border border-border rounded-lg px-4 py-3 text-xs font-mono">
                <span className="text-text-muted">$ </span>
                <span className="text-text-secondary">BUY 0.5 BTCUSDT @ market</span>
                <div className="text-accent mt-1">Order filled. Decision logged.</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Kinetic marquee strip */}
      <section className="py-8 border-t border-border overflow-hidden">
        <div className="relative">
          <style>{`
            @keyframes marquee-landing { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .marquee-landing-track { animation: marquee-landing 25s linear infinite; }
            .marquee-landing-track:hover { animation-play-state: paused; }
          `}</style>
          <div className="marquee-landing-track inline-flex w-max items-center gap-12 px-6">
            {[...Array(2)].map((_, dup) => (
              <div key={dup} className="inline-flex items-center gap-12">
                {['Multi-Agent Research', 'FOMO Detection', 'Bull vs Bear Debate', 'Earnings Calendar', 'Insider Tracking', 'Position Sizing', 'Decision Journal', 'Degen Score'].map((item) => (
                  <span key={`${dup}-${item}`} className="text-sm font-medium text-text-muted/50 whitespace-nowrap uppercase tracking-[0.2em]">
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <ScrollFeatureSection />

      {/* How it works - horizontal numbered steps, no gradient circles */}
      <section className="px-6 md:px-12 py-24 border-t border-border">
        <div className="max-w-7xl mx-auto" ref={howRef}>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={howInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight mb-12"
          >
            Three steps to a better trade.
          </motion.h2>
          <div ref={stepsRef} className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Connecting line (hidden on mobile) */}
            <div
              ref={lineRef}
              className="hidden md:block absolute top-[1.8rem] left-[10%] right-[10%] h-[1px] bg-accent/30 origin-left"
              style={{ transform: 'scaleX(0)' }}
            />
            {[
              { num: '01', title: 'Research', desc: 'Enter any ticker. Five independent AI modules score it on technical, sentiment, macro, news, and market intel dimensions.' },
              { num: '02', title: 'Check yourself', desc: 'The FOMO guardian runs a behavioral analysis. Journal your reasoning and confidence. See the worst-case regret simulation.' },
              { num: '03', title: 'Execute', desc: 'Trade directly via Bitget integration. Your decision is recorded. Track outcomes over time in the autopsy report.' },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                animate={howInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: i * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="text-4xl font-bold text-text-muted/30 tabular-nums block mb-3">
                  <AnimatedNumber value={step.num} />
                </span>
                <h3 className="text-base font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Tech bar */}
      <section className="px-6 md:px-12 py-12 border-t border-border">
        <motion.div
          ref={trustRef}
          initial={{ opacity: 0, y: 12 }}
          animate={trustInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto flex items-center gap-6 flex-wrap"
        >
          <span className="text-xs text-text-muted">Built with</span>
          {['FastAPI', 'React', 'Claude AI', 'Bitget MCP', 'Tailwind'].map((tech) => (
            <span key={tech} className="text-xs font-mono text-text-secondary">{tech}</span>
          ))}
          <span className="text-xs text-text-muted ml-auto">Bitget Hackathon S1, Track 3</span>
        </motion.div>
      </section>

      {/* Final CTA - minimal, not another gradient blob */}
      <section className="px-6 md:px-12 py-24 border-t border-border">
        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 16 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight mb-2">
                Ready to trade with clarity?
              </h2>
              <p className="text-sm text-text-secondary">No signup. Connect your Bitget API keys and go.</p>
            </div>
            <Link
              to="/research"
              className="px-6 py-3 bg-accent text-bg-deep rounded-lg font-semibold text-sm hover:bg-accent-light transition-colors duration-200 shrink-0"
            >
              Open App
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-xs font-semibold text-text-secondary tracking-tight">ClearSignal</span>
          <span className="text-xs text-text-muted">2026</span>
        </div>
      </footer>
    </div>
  )
}
