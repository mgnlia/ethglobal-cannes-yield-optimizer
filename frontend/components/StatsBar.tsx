'use client'

import { TrendingUp, Activity, Globe, Zap } from 'lucide-react'

export default function StatsBar({ yields }: { yields: any }) {
  const bestApy = yields?.best_apy ?? 6.23
  const bestProtocol = yields?.best_protocol ?? 'compound'
  const bestChain = yields?.best_chain ?? 'arbitrum'

  const stats = [
    { icon: TrendingUp, label: 'Best APY', value: `${bestApy.toFixed(2)}%`, sub: `${bestProtocol} · ${bestChain}`, color: 'text-green-400' },
    { icon: Activity, label: 'Protocols', value: '3', sub: 'Aave · Compound · Curve', color: 'text-sky-400' },
    { icon: Globe, label: 'Chains', value: '5', sub: 'ETH · ARB · OP · POLY · AVAX', color: 'text-violet-400' },
    { icon: Zap, label: 'Bridge', value: 'LZ V2', sub: 'OApp · atomic', color: 'text-amber-400' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 mb-10">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="glass rounded-2xl p-4">
            <div className={`${color} mb-2`}><Icon className="w-5 h-5" /></div>
            <div className="font-bold text-xl text-white">{value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{label}</div>
            <div className="text-xs text-slate-500 mt-1">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
