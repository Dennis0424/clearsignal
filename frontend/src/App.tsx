import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingNav from './components/LandingNav'
import Landing from './pages/Landing'
import DeepDive from './pages/DeepDive'
import Portfolio from './pages/Portfolio'
import Decisions from './pages/Decisions'

function Layout() {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'

  return (
    <>
      {isLanding ? <LandingNav /> : <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/research" element={<DeepDive />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/decisions" element={<Decisions />} />
        </Routes>
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
