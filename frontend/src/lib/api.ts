import type { AnalyticsResponse, HealthResponse, PredictionResponse } from '../types/api'

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim()
const API_BASE = (configuredApiBase || '/api').replace(/\/+$/, '')

function endpoint(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${normalizedPath}`
}

async function parseError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null && 'detail' in body) {
      const detail = (body as { detail: unknown }).detail
      if (typeof detail === 'string') return detail
      if (Array.isArray(detail)) return detail.map((item) => typeof item === 'object' && item && 'msg' in item ? String(item.msg) : String(item)).join(', ')
    }
  } catch {
    // Fall back to the HTTP status when the response is not JSON.
  }
  return `Request failed (${response.status} ${response.statusText})`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(endpoint(path), {
      ...init,
      headers: { Accept: 'application/json', ...init?.headers },
    })
  } catch {
    throw new Error('Could not reach the SQLGuard API. Check the backend connection and API URL.')
  }
  if (!response.ok) throw new Error(await parseError(response))
  return response.json() as Promise<T>
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health')
}

export function getAnalytics(): Promise<AnalyticsResponse> {
  return request<AnalyticsResponse>('/analytics')
}

export function predictQuery(query: string): Promise<PredictionResponse> {
  return request<PredictionResponse>('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
}
