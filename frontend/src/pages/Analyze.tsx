import { useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle2, LoaderCircle, Play, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react'
import { predictQuery } from '../lib/api'
import type { PredictionResponse } from '../types/api'

const example = "SELECT * FROM users WHERE username = 'admin' OR '1'='1' --"

export function Analyze() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<PredictionResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) { setError('Enter a SQL query to analyze.'); setResult(null); return }
    if (trimmed.length > 10000) { setError('Query must be 10,000 characters or fewer.'); setResult(null); return }
    setLoading(true); setError(''); setResult(null)
    try { setResult(await predictQuery(trimmed)) } catch (cause) { setError(cause instanceof Error ? cause.message : 'An unexpected error occurred.') } finally { setLoading(false) }
  }

  return <div className="page-content">
    <div className="page-heading"><div><div className="eyebrow">LIVE INFERENCE</div><h1>Analyze a query</h1><p>Submit SQL to the connected detection model for review.</p></div><span className="live-badge"><i /> REAL API</span></div>
    <div className="analyzer-grid">
      <form className="panel query-panel" onSubmit={submit} noValidate>
        <div className="panel-heading"><div><h2>SQL query</h2><p>Query content is sent to the SQLGuard API for inference.</p></div></div>
        <label className="sr-only" htmlFor="sql-query">SQL query to analyze</label>
        <textarea id="sql-query" className="query-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={'Paste or type a SQL query…\n\nExample: SELECT * FROM users WHERE id = 1;'} maxLength={10000} spellCheck={false} />
        <div className="input-meta"><span>{query.length.toLocaleString()} / 10,000 characters</span><button type="button" className="text-button" onClick={() => { setQuery(example); setError('') }}>Load example</button></div>
        {error && <div role="alert" className="error-banner"><AlertCircle size={17} /><span>{error}</span></div>}
        <div className="query-actions"><button className="button-secondary" type="button" onClick={() => { setQuery(''); setResult(null); setError('') }}><RotateCcw size={15} />Clear</button><button className="button-primary" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={16} />Analyzing…</> : <><Play size={15} fill="currentColor" />Analyze query</>}</button></div>
        <p className="privacy-note">Analysis runs against the configured model. Avoid submitting sensitive production data.</p>
      </form>
      <section className="panel result-panel" aria-live="polite">
        <div className="panel-heading"><div><h2>Analysis result</h2><p>Model classification and extracted fragments</p></div></div>
        {!result && !loading && <div className="empty-state"><div className="empty-icon"><ShieldCheck size={25} /></div><strong>Ready to analyze</strong><span>Submit a query to see its classification, score and candidate fragments.</span></div>}
        {loading && <div className="empty-state"><LoaderCircle className="spin loading-icon" size={28} /><strong>Analyzing query</strong><span>Waiting for the model response…</span></div>}
        {result && <div className="result-content"><div className={`verdict ${result.prediction === 1 ? 'attack' : 'benign'}`}><div className="verdict-icon">{result.prediction === 1 ? <ShieldAlert size={22} /> : <CheckCircle2 size={22} />}</div><div><span>OVERALL CLASSIFICATION</span><strong>{result.label === 'attack' ? 'Potential threat detected' : 'No threat detected'}</strong></div><b>{result.label.toUpperCase()}</b></div>
          <div className="score-grid"><div><span>Attack probability</span><strong>{(result.attack_probability * 100).toFixed(1)}<small>%</small></strong><div className="score-track"><i style={{ width: `${Math.min(result.attack_probability * 100, 100)}%` }} className={result.prediction === 1 ? 'red-fill' : ''} /></div></div><div><span>Decision threshold</span><strong>{(result.threshold * 100).toFixed(1)}<small>%</small></strong><p>Model cutoff</p></div></div>
          <div className="candidate-heading"><strong>Candidate fragments</strong><span>{result.candidate_count} {result.candidate_count === 1 ? 'candidate' : 'candidates'}</span></div>
          {result.candidates.length === 0 ? <p className="muted-note">No candidate fragments were returned.</p> : <div className="candidate-list">{result.candidates.map((candidate, index) => <article className="candidate" key={`${candidate.start}-${candidate.end}-${candidate.type}-${index}`}><div className="candidate-top"><span className={`candidate-label ${candidate.label}`}>{candidate.label === 'attack' ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}{candidate.label}</span><span className="candidate-type">{candidate.type.replaceAll('_', ' ')}</span><span className="candidate-score">{(candidate.attack_probability * 100).toFixed(1)}%</span></div><pre>{candidate.text}</pre><span className="candidate-position">Characters {candidate.start}–{candidate.end}</span></article>)}</div>}
        </div>}
      </section>
    </div>
  </div>
}
