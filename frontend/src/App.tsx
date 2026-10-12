import { useCallback, useEffect, useState } from 'react'
import { Sidebar, type PageKey } from './components/Sidebar'
import { Header } from './components/Header'
import { Dashboard } from './pages/Dashboard'
import { Analyze } from './pages/Analyze'
import { InfoPage } from './pages/InfoPage'
import { getHealth } from './lib/api'
import './App.css'

export default function App() {
  const [page, setPage] = useState<PageKey>('Dashboard')
  const [backend, setBackend] = useState<'checking' | 'online' | 'offline'>('checking')
  const [mobileNav, setMobileNav] = useState(false)

  const checkHealth = useCallback(async () => {
    try {
      const health = await getHealth()
      setBackend(health.status === 'healthy' ? 'online' : 'offline')
    } catch {
      setBackend('offline')
    }
  }, [])

  useEffect(() => {
    const initialCheck = window.setTimeout(() => { void checkHealth() }, 0)
    const timer = window.setInterval(() => { void checkHealth() }, 30000)
    return () => { window.clearTimeout(initialCheck); window.clearInterval(timer) }
  }, [checkHealth])

  function navigate(next: PageKey) { setPage(next); setMobileNav(false) }

  return <div className="app-shell">
    {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <div className={`sidebar-wrap ${mobileNav ? 'open' : ''}`}><Sidebar active={page} onNavigate={navigate} /></div>
    <main className="main-area"><Header title={page} backend={backend} onMenu={() => setMobileNav(!mobileNav)} />
      {page === 'Dashboard' ? <Dashboard onAnalyze={() => navigate('Analyze')} /> : page === 'Analyze' ? <Analyze /> : <InfoPage page={page} />}
      <footer className="app-footer"><span>SQLGuard <b>·</b> ML-powered SQL injection detection</span><span>Predictions are probabilistic signals; validate with secure coding practices.</span></footer>
    </main>
  </div>
}
