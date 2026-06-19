import { motion, useMotionValue, useMotionTemplate } from 'motion/react'

export default function SpotlightCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const opacity = useMotionValue(0)

  const background = useMotionTemplate`radial-gradient(200px circle at ${mouseX}px ${mouseY}px, rgba(16,185,129,0.12), transparent 80%)`

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - left)
    mouseY.set(e.clientY - top)
    opacity.set(1)
  }

  return (
    <div
      className={`relative rounded-xl border border-border bg-bg-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => opacity.set(0)}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ background, opacity }}
      />
      {children}
    </div>
  )
}
