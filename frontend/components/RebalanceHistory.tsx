'use client'

import { CheckCircle, ArrowRight, Brain, ExternalLink } from 'lucide-react'

export default function RebalanceHistory({ history }: { history: any[] }) {
  if (!history?.length) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-slate-400">
        <p>No rebalancing history yet. Get your first AI recommendation above.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 mb-10">
      <h3 className="font-semibold text-lg mb-4">Rebalancing History</h3>
      {history.map((item: any, i: number) => (
        <div key={i} className="glass rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="font-medium text-sm">${item.amount?.toLocaleString()} {item.token}</span>
              <span className="text-slate-400 text-sm capitalize">{item.from_protocol} ({item.from_chain})</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-400 text-sm capitalize">{item.to_protocol} ({item.to_chain})</span>
            </div>
            <div className="text-right shrink-0">
              <div className="text-green-400 font-bold text-sm">+{item.apy_delta?.toFixed(2)}% APY</div>
              <div className="text-xs text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}</div>
            </div>
          </div>
          {item.reasoning && (
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5 text-xs text-violet-400">
                <Brain className="w-3 h-3" /> AI Reasoning
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{item.reasoning}</p>
            </div>
          )}
          {item.tx_hash && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <ExternalLink className="w-3 h-3" />
              <span className="font-mono">{item.tx_hash.slice(0, 20)}...</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
