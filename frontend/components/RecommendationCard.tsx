'use client'

import { Brain, ArrowRight, TrendingUp, Zap, Clock } from 'lucide-react'

export default function RecommendationCard({ rec }: { rec: any }) {
  if (!rec) return null

  const shouldRebalance = rec.should_rebalance

  return (
    <div className={`glass rounded-2xl p-6 border ${shouldRebalance ? 'border-green-500/30' : 'border-slate-700'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold">AI Recommendation</h3>
            <p className="text-xs text-slate-400">Powered by Claude</p>
          </div>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          shouldRebalance
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-slate-700 text-slate-300'
        }`}>
          {shouldRebalance ? '✓ Rebalance Recommended' : '— Hold Current Position'}
        </span>
      </div>

      {shouldRebalance && (
        <div className="flex items-center gap-3 mb-5 p-3 bg-white/5 rounded-xl">
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">From</div>
            <div className="font-semibold capitalize">{rec.from_protocol}</div>
            <div className="text-xs text-slate-400 capitalize">{rec.from_chain}</div>
            <div className="text-green-400 font-bold">{rec.from_apy?.toFixed(2)}%</div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">To</div>
            <div className="font-semibold capitalize">{rec.to_protocol}</div>
            <div className="text-xs text-slate-400 capitalize">{rec.to_chain}</div>
            <div className="text-green-400 font-bold">{rec.to_apy?.toFixed(2)}%</div>
          </div>
          <div className="ml-auto grid grid-cols-2 gap-3 text-right">
            <div>
              <div className="text-xs text-slate-400">Annual Gain</div>
              <div className="font-bold text-green-400">${rec.annual_gain_usd?.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Gas Cost</div>
              <div className="font-medium text-slate-300">${rec.estimated_gas_usd?.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">APY Delta</div>
              <div className="font-bold text-sky-400">+{rec.apy_delta?.toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Break-even</div>
              <div className="font-medium text-slate-300">{rec.breakeven_days?.toFixed(0)}d</div>
            </div>
          </div>
        </div>
      )}

      {/* LLM Reasoning */}
      {rec.reasoning && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-xs text-violet-400">
            <Brain className="w-3.5 h-3.5" />
            Claude&apos;s Reasoning
            {rec.confidence && (
              <span className="ml-auto text-slate-400">
                {(rec.confidence * 100).toFixed(0)}% confidence
              </span>
            )}
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{rec.reasoning}</p>
          {rec.reasoning_hash && (
            <div className="mt-2 text-xs text-slate-500 font-mono truncate">
              {rec.reasoning_hash.slice(0, 42)}...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
