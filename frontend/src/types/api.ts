export interface HealthResponse {
  status: string
  service: string
}

export interface CandidateResult {
  text: string
  type: string
  start: number
  end: number
  prediction: 0 | 1
  label: 'attack' | 'benign'
  attack_probability: number
  threshold: number
}

export interface PredictionResponse {
  prediction: 0 | 1
  label: 'attack' | 'benign'
  attack_probability: number
  threshold: number
  candidate_count: number
  candidates: CandidateResult[]
}

export interface DailyActivity {
  date: string
  total_queries: number
  flagged_attacks: number
}

export interface RecentPrediction {
  id: number
  created_at: string
  label: 'attack' | 'benign'
  prediction: 0 | 1
  attack_probability: number
  threshold: number
  candidate_count: number
  extracted_pattern_types: string[]
}

export interface AnalyticsResponse {
  total_queries: number
  flagged_attacks: number
  attack_rate: number | null
  total_candidates: number
  daily_activity: DailyActivity[]
  recent_activity: RecentPrediction[]
}
