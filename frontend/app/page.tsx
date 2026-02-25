'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Zap, Globe, Brain, ArrowRight, Shield, BarChart3, History, AlertCircle, CheckCircle2 } from 'lucide-react'
import YieldTable from '@/components/YieldTable'
import RecommendationCard from '@/components/RecommendationCard'
import RebalanceHistory from '@/components/RebalanceHistory'
import PortfolioCard from '@/components/PortfolioCard'
import StatsBar from '@/components/StatsBar'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export default function Home() {
  const [yields, setYields] = useState<any>(null)
  const [recommendation, setRecommendation] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recLoading, setRecLoading] = useState(false)
  const [amount, setAmount] = useState('10000')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'history'>('dashboard')
  const [dataSource, setDataSource] = useState<'live' | 'mock' | null>(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      const [yieldsRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/api/yields`).then(r => r.json()),
        fetch(`${API_URL}/api/history`).then(r => r.json()),
      ])
      setYields(yieldsRes)
      setDataSource(yieldsRes?.data_source ?? 'mock')
      setHistory(historyRes)
    } catch (e) {
      console.error('API error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function getRecommendation() {
    setRecLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: '0xDemo0000000000000000000000000000000000001',
          token: 'USDC',
          amount: parseFloat(amount),
        }),
      })
      const data = await res.json()
      setRecommendation(data)
    } catch (e) {
      console.error('Recommendation error:', e)
    } finally {
      setRecLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Data source banner */}
      {dataSource === 'mock' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs text-center py-2 px-4 flex items-center justify-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Live protocol APIs unreachable — displaying representative rates. Set{' '}
          <code className="font-mono bg-amber-500/20 px-1 rounded">ANTHROPIC_API_KEY</code> and connect a
          wallet for live data.
        </div>
      )}
      {dataSource === 'live' && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300 text-xs text-center py-2 px-4 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Live yield data from Aave V3 (The Graph). Compound &amp; Curve rates are representative.
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">CrossYield</h1>
              <p className="text-xs text-slate-400">Cross-Chain Yield Optimizer</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-400 pulse-green inline-block" />
              Sepolia + Arb Sepolia
            </span>
            <a
              href="https://ethglobal.com/events/cannes2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-gradient-to-r from-sky-500 to-violet-600 text-white px-3 py-1.5 rounded-full font-medium"
            >
              ETHGlobal Cannes 2026
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-sky-400 bg-sky-400/10 border border-sky-400/20 px-4 py-2 rounded-full mb-6">
          <Brain className="w-3.5 h-3.5" />
          First yield optimizer with LLM reasoning for every rebalancing decision
        </div>
        <h2 className="text-4xl sm:text-6xl font-bold mb-4">
          <span className="gradient-text">AI-Powered</span> Cross-Chain<br />Yield Optimization
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
          Monitor Aave, Compound &amp; Curve across 5 chains. Claude AI explains every rebalancing decision.
          LayerZero V2 executes atomically.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="flex items-center gap-2 glass rounded-xl px-4 py-3">
            <span className="text-slate-400 text-sm">Amount (USDC)</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="bg-transparent text-white font-bold w-28 outline-none text-right"
              min="100"
            />
          </div>
          <button
            onClick={getRecommendation}
            disabled={recLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {recLoading ? 'Analyzing...' : 'Get AI Recommendation'}
            {!recLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </section>

      {/* Stats */}
      <StatsBar yields={yields} />

      {/* Recommendation */}
      {recommendation && (
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <RecommendationCard rec={recommendation} />
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit mb-6">
          {(['dashboard', 'portfolio', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'dashboard' && <BarChart3 className="w-4 h-4 inline mr-1.5" />}
              {tab === 'portfolio' && <Globe className="w-4 h-4 inline mr-1.5" />}
              {tab === 'history' && <History className="w-4 h-4 inline mr-1.5" />}
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <YieldTable yields={yields} loading={loading} />
        )}
        {activeTab === 'portfolio' && (
          <PortfolioCard yields={yields} />
        )}
        {activeTab === 'history' && (
          <RebalanceHistory history={history} />
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 mt-16 border-t border-white/10 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-6 mb-4">
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> LayerZero V2</span>
          <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> Claude AI</span>
          <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Aave · Compound · Curve</span>
        </div>
        Built for{' '}
        <a href="https://ethglobal.com/events/cannes2026" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">
          ETHGlobal Cannes 2026
        </a>{' '}
        · April 3–5, 2026 · $275K Prize Pool
      </footer>
    </div>
  )
}
