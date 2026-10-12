import { Bell, Menu, Search } from 'lucide-react'

export function Header({ title, backend, onMenu }: { title: string; backend: 'checking' | 'online' | 'offline'; onMenu: () => void }) {
  const statusText = backend === 'online' ? 'API connected' : backend === 'offline' ? 'API unavailable' : 'Checking API'
  return <header className="topbar">
    <button className="icon-button menu-toggle" aria-label="Open navigation" onClick={onMenu}><Menu size={20} /></button>
    <div className="breadcrumbs"><span>SQLGuard</span><span className="crumb-sep">/</span><strong>{title}</strong></div>
    <div className="topbar-actions">
      <div className={`api-status ${backend}`} role="status"><span className="status-dot" />{statusText}</div>
      <button className="icon-button search-button" aria-label="Search is not available yet" title="Search is not available yet" disabled><Search size={18} /></button>
      <button className="icon-button notification-button" aria-label="Notifications are not configured" title="Notifications are not configured" disabled><Bell size={18} /></button>
      <div className="user-avatar" aria-label="User profile">SG</div>
    </div>
  </header>
}
