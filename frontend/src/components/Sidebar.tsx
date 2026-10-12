import { Activity, BarChart3, LayoutDashboard, LockKeyhole, Settings2, ShieldAlert, ShieldCheck } from 'lucide-react'

export type PageKey = 'Dashboard' | 'Analyze' | 'Attacks' | 'Analytics' | 'Models' | 'Settings'

const items: { label: PageKey; icon: typeof LayoutDashboard }[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Analyze', icon: Activity },
  { label: 'Attacks', icon: ShieldAlert },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Models', icon: LockKeyhole },
  { label: 'Settings', icon: Settings2 },
]

export function Sidebar({ active, onNavigate }: { active: PageKey; onNavigate: (page: PageKey) => void }) {
  return <aside className="sidebar">
    <a className="brand" href="#dashboard" onClick={(event) => { event.preventDefault(); onNavigate('Dashboard') }}>
      <span className="brand-mark"><ShieldCheck size={20} /></span>
      <span><strong>SQLGuard</strong><small>SECURITY CONSOLE</small></span>
    </a>
    <div className="nav-label">WORKSPACE</div>
    <nav aria-label="Main navigation" className="nav-list">
      {items.map(({ label, icon: Icon }) => <button key={label} type="button" className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => onNavigate(label)} aria-current={active === label ? 'page' : undefined}>
        <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === 'Attacks' && <i className="nav-dot" aria-label="new activity" />}
      </button>)}
    </nav>
    <div className="sidebar-foot"><div className="shield-small"><ShieldCheck size={17} /></div><div><strong>Protected by ML</strong><span>Baseline model v1.0</span></div></div>
  </aside>
}
