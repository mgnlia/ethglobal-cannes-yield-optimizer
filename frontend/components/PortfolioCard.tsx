'use client'

import { Globe, TrendingUp, ArrowUpRight } from 'lucide-react'

export default function PortfolioCard({ yields }: { yields: any }) {
  const bestApy = yields?.best_apy ?? 6.23
  const currentApy = 3.21
  const amount = 10000
  const annualGain = amount * ((bestApy - currentApy) / 100)

  return (
    <div className="mb-10 space-y-4">
      <h3 className="font-semibold text-lg">Demo Portfolio</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Current position */}
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-3 uppercase tracking-wider">Current Position</div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold">$10,000</div>
              <div className="text-sm text-slate-400">USDC</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-400">{currentApy}%</div>
              <div className="text-xs text-slate-400">APY</div>
            </div>
          </div>
          <div className="text-xs text-slate-500 bg-white/5 rounded-lg px-3 py-2">
            👻 Aave V3 · Ethereum
          </div>
        </div>

        {/* Optimized position */}
        <div className="glass rounded-2xl p-5 border border-green-500/20">
          <div className="text-xs text-green-400 mb-3 uppercase tracking-wider">Optimized Position</div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold">$10,000</div>
              <div className="text-sm text-slate-400">USDC</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">{bestApy.toFixed(2)}%</div>
              <div className="text-xs text-slate-400">APY</div>
            </div>
          </div>
          <div className="text-xs text-green-400/70 bg-green-500/10 rounded-lg px-3 py-2">
            🏦 Compound V3 · Arbitrum
          </div>
        </div>
      </div>

      {/* Opportunity card */}
      <div className="glass rounded-2xl p-5 border border-sky-500/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400 mb-1">Annual Optimization Gain</div>
            <div className="text-3xl font-bold text-green-400">
              +${annualGain.toFixed(0)}/year
            </div>
            <div className="text-xs text-slate-400 mt-1">
              +{(bestApy - currentApy).toFixed(2)}% APY improvement via LayerZero V2
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
            <ArrowUpRight className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
