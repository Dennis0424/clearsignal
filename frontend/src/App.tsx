import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import Navbar from './components/Navbar'
import LandingNav from './components/LandingNav'
import TickerTape from './components/TickerTape'
import Landing from './pages/Landing'
import DeepDive from './pages/DeepDive'
import Portfolio from './pages/Portfolio'
import Decisions from './pages/Decisions'

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
}

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  )
}

function Layout() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <>
      {!isLanding && <TickerTape />}
      {isLanding ? <LandingNav /> : <Navbar />}
      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AnimatedPage><Landing /></AnimatedPage>} />
            <Route path="/research" element={<AnimatedPage><DeepDive /></AnimatedPage>} />
            <Route path="/portfolio" element={<AnimatedPage><Portfolio /></AnimatedPage>} />
            <Route path="/decisions" element={<AnimatedPage><Decisions /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
