import { ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts'
import type { DailyActivity } from '../types/api'

export function AttackFrequencyChart({ data }: { data: DailyActivity[] }) {
  return <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
    <defs><linearGradient id="attackFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ee6b6b" stopOpacity={0.22} /><stop offset="100%" stopColor="#ee6b6b" stopOpacity={0} /></linearGradient></defs>
    <CartesianGrid stroke="#27333d" strokeDasharray="3 5" vertical={false} />
    <XAxis dataKey="date" tickFormatter={(date: string) => date.slice(5)} axisLine={false} tickLine={false} tick={{ fill: '#82909e', fontSize: 12 }} dy={10} />
    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#82909e', fontSize: 11 }} />
    <Tooltip labelFormatter={(date) => `UTC ${date}`} contentStyle={{ background: '#17212a', border: '1px solid #2b3945', borderRadius: 9, color: '#e5edf2' }} />
    <Area type="monotone" dataKey="total_queries" name="Queries analyzed" stroke="#55c9aa" strokeWidth={2} fill="#55c9aa" fillOpacity={0.07} />
    <Area type="monotone" dataKey="flagged_attacks" name="Flagged attacks" stroke="#ee6b6b" strokeWidth={2} fill="url(#attackFill)" />
  </AreaChart></ResponsiveContainer></div>
}
