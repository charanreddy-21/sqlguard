import { lazy, Suspense, useEffect, useState } from 'react'
import { Activity, Database, ShieldAlert, ShieldCheck } from 'lucide-react'
import { getAnalytics } from '../lib/api'
import type { AnalyticsResponse } from '../types/api'

const AttackFrequencyChart = lazy(() => import('../components/Charts').then((module) => ({ default: module.AttackFrequencyChart })))

const metricCards = [
  { label: 'Queries analyzed', key: 'total_queries', icon: Database, tone: 'teal' },
  { label: 'Threats flagged', key: 'flagged_attacks', icon: ShieldAlert, tone: 'red' },
  { label: 'Attack rate', key: 'attack_rate', icon: Activity, tone: 'blue' },
  { label: 'Candidate fragments', key: 'total_candidates', icon: ShieldCheck, tone: 'amber' },
] as const

function metricValue(key: typeof metricCards[number]['key'], analytics: AnalyticsResponse | null) {
  if (!analytics) return '—'
  if (key === 'attack_rate') return analytics.attack_rate === null ? '—' : `${(analytics.attack_rate * 100).toFixed(1)}%`
  return analytics[key].toLocaleString()
}

export function Dashboard({ onAnalyze }: { onAnalyze: () => void }) {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    getAnalytics().then((data) => {
      if (active) setAnalytics(data)
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Could not load prediction analytics.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [reload])

  const hasPredictions = (analytics?.total_queries ?? 0) > 0

  return <div className="page-content">
    <div className="page-heading"><div><div className="eyebrow">STORED PREDICTION ANALYTICS</div><h1>Security dashboard</h1><p>Summary and recent activity from successful SQLGuard analyses.</p></div><span className={`live-badge ${error ? 'offline' : loading ? 'checking' : ''}`}><i />{error ? 'UNAVAILABLE' : loading ? 'LOADING' : 'LIVE DATABASE'}</span></div>
    {error && <div className="error-banner dashboard-error" role="alert"><span>{error}</span><button type="button" className="text-button" onClick={() => { setAnalytics(null); setError(''); setLoading(true); setReload((value) => value + 1) }}>Retry</button></div>}
    <section className="metrics-grid" aria-label="Prediction summary">{metricCards.map(({ label, key, icon: Icon, tone }) => <article className="metric-card" key={key}><div className={`metric-icon ${tone}`}><Icon size={18} /></div><span className="metric-label">{label}</span><strong className="metric-value">{loading ? '…' : metricValue(key, analytics)}</strong><span className="metric-detail">{key === 'attack_rate' ? 'of saved predictions' : key === 'total_candidates' ? 'extracted for inference' : key === 'flagged_attacks' ? 'classified as attacks' : 'saved successfully'}</span></article>)}</section>
    <section className="charts-grid dashboard-charts">
      <article className="panel frequency-panel"><div className="panel-heading"><div><h2>Query activity</h2><p>Daily predictions and flagged attacks · last 7 UTC days</p></div></div><div className="chart-legend"><span><i className="legend-teal" />Queries analyzed</span><span><i className="legend-red" />Flagged attacks</span></div>
        {loading ? <div className="analytics-message">Loading saved prediction history…</div> : error ? <div className="analytics-message">Analytics could not be loaded.</div> : hasPredictions && analytics ? <Suspense fallback={<div className="chart-wrap analytics-loading" aria-label="Loading chart" />}><AttackFrequencyChart data={analytics.daily_activity} /></Suspense> : <div className="analytics-message"><strong>No predictions saved yet</strong><span>Analyze a query to populate these real database metrics.</span><button type="button" className="button-primary" onClick={onAnalyze}>Analyze a query</button></div>}
      </article>
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent predictions</h2><p>Latest saved results · query text is not shown</p></div></div>
        {loading ? <div className="analytics-message short-message">Loading recent activity…</div> : error ? <div className="analytics-message short-message">Recent activity is unavailable.</div> : analytics?.recent_activity.length ? <div className="activity-list">{analytics.recent_activity.map((row) => <article className="activity-row" key={row.id}><div className={`activity-icon ${row.prediction ? 'danger' : 'safe'}`}>{row.prediction ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}</div><div className="activity-query"><strong>{row.label === 'attack' ? 'Potential threat detected' : 'No threat detected'}</strong><span>{row.candidate_count} {row.candidate_count === 1 ? 'candidate' : 'candidates'} · extracted pattern types: {row.extracted_pattern_types.map((type) => type.replaceAll('_', ' ')).join(', ') || 'none'}</span></div><strong className={row.prediction ? 'danger-text' : 'safe-text'}>{(row.attack_probability * 100).toFixed(1)}%</strong><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString()}</time></article>)}</div> : <div className="analytics-message short-message"><strong>No recent predictions</strong><span>Saved analysis activity will appear here.</span></div>}
      </section>
    </section>
  </div>
}
