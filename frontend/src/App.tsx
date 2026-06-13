import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Compare from './pages/Compare'
import TradeLog from './pages/TradeLog'
import Replay from './pages/Replay'
import DeepDive from './pages/DeepDive'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/deep-dive" element={<DeepDive />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/log" element={<TradeLog />} />
          <Route path="/replay" element={<Replay />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
