import { useEffect, useRef } from 'react'

interface SignalMarkProps {
  size?: number
  className?: string
  animate?: boolean
}

export default function SignalMark({ size = 32, className = '', animate = true }: SignalMarkProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!animate || !svgRef.current) return
    const paths = svgRef.current.querySelectorAll<SVGPathElement | SVGRectElement>('[data-draw]')
    paths.forEach((el, i) => {
      if (el instanceof SVGPathElement) {
        const len = el.getTotalLength()
        el.style.strokeDasharray = String(len)
        el.style.strokeDashoffset = String(len)
        el.style.transition = `stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.15 + 0.2}s`
        requestAnimationFrame(() => {
          el.style.strokeDashoffset = '0'
        })
      }
    })
    // Fade in the fill elements
    const fills = svgRef.current.querySelectorAll<SVGElement>('[data-fill]')
    fills.forEach((el, i) => {
      el.style.opacity = '0'
      el.style.transition = `opacity 0.4s ease ${i * 0.1 + 0.6}s`
      requestAnimationFrame(() => {
        el.style.opacity = '1'
      })
    })
  }, [animate])

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Signal arcs — draw in sequence */}
      {/* Outer arc */}
      <path
        data-draw
        d="M 7 18 A 10 10 0 0 1 25 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />
      {/* Middle arc */}
      <path
        data-draw
        d="M 10 18 A 6.5 6.5 0 0 1 22 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Inner arc */}
      <path
        data-draw
        d="M 13 18 A 3.2 3.2 0 0 1 19 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      {/* Candlestick body */}
      <rect
        data-fill
        x="14"
        y="18"
        width="4"
        height="7"
        rx="0.5"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Upper wick */}
      <line
        data-fill
        x1="16"
        y1="17"
        x2="16"
        y2="18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Lower wick */}
      <line
        data-fill
        x1="16"
        y1="25"
        x2="16"
        y2="27"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Center dot — signal point */}
      <circle
        data-fill
        cx="16"
        cy="17"
        r="1.2"
        fill="currentColor"
      />
    </svg>
  )
}
