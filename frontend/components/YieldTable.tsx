'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

const MOCK_ROWS = [
  { protocol: 'Compound V3', chain: 'Arbitrum', token: 'USDC', apy: 6.23, tvl: '1.2B', risk: 'Low', badge: 'BEST' },
  { protocol: 'Aave V3', chain: 'Polygon', token: 'USDC', apy: 5.43, tvl: '890M', risk: 'Low', badge: null },
  { protocol: 'Curve', chain: 'Arbitrum', token: '3CRV', apy: 5.67, tvl: '340M', risk: 'Low', badge: null },
  { protocol: 'Compound V3', chain: 'Ethereum', token: 'USDC', apy: 5.82, tvl: '2.1B', risk: 'Low', badge: null },
  { protocol: 'Aave V3', chain: 'Avalanche', token: 'USDC', apy: 4.56, tvl: '210M', risk: 'Low', badge: null },
  { protocol: 'Curve', chain: 'Optimism', token: 'USDC', apy: 4.98, tvl: '180M', risk: 'Low', badge: null },
  { protocol: 'Aave V3', chain: 'Optimism', token: 'USDC', apy: 4.12, tvl: '320M', risk: 'Low', badge: null },
  { protocol: 'Aave V3', chain: 'Ethereum', token: 'USDC', apy: 3.21, tvl: '4.5B', risk: 'Low', badge: null },
]

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: 'bg-blue-500/20 text-blue-300',
  Arbitrum: 'bg-sky-500/20 text-sky-300',
  Optimism: 'bg-red-500/20 text-red-300',
  Polygon: 'bg-violet-500/20 text-violet-300',
  Avalanche: 'bg-orange-500/20 text-orange-300',
}

const PROTOCOL_ICONS: Record<string, string> = {
  'Aave V3': '👻',
  'Compound V3': '🏦',
  'Curve': '🌊',
}

export default function YieldTable({ yields, loading }: { yields: any; loading: boolean }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Live Yield Rates</h3>
        <span className="text-xs text-slate-500">
          {yields?._meta?.fetched_at
            ? `Updated ${new Date(yields._meta.fetched_at).toLocaleTimeString()}`
            : 'Auto-updates every 60s'}
        </span>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Protocol</th>
              <th className="text-left px-5 py-3">Chain</th>
              <th className="text-left px-5 py-3 hidden sm:table-cell">Token</th>
              <th className="text-right px-5 py-3">APY</th>
              <th className="text-right px-5 py-3 hidden md:table-cell">TVL</th>
              <th className="text-right px-5 py-3 hidden md:table-cell">Risk</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : MOCK_ROWS.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span>{PROTOCOL_ICONS[row.protocol]}</span>
                        <span className="font-medium text-sm">{row.protocol}</span>
                        {row.badge && (
                          <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                            {row.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CHAIN_COLORS[row.chain] || 'bg-slate-700 text-slate-300'}`}>
                        {row.chain}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell text-sm text-slate-300">{row.token}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-bold text-lg ${row.apy > 5 ? 'text-green-400' : row.apy > 4 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {row.apy.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-right text-sm text-slate-400">${row.tvl}</td>
                    <td className="px-5 py-4 hidden md:table-cell text-right">
                      <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">{row.risk}</span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
