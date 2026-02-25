import { NextResponse } from 'next/server'

type ChainRates = Record<string, number>
type ProtocolRates = Record<string, ChainRates>

// Representative rates used when live protocol APIs are unreachable.
// Labeled "source: mock" in the response _meta field.
const MOCK_RATES: Record<string, ProtocolRates> = {
  aave: {
    ethereum: { USDC: 3.21, USDT: 3.15, DAI: 3.08, WETH: 1.95 },
    arbitrum: { USDC: 4.87, USDT: 4.72, DAI: 4.65, WETH: 2.31 },
    optimism: { USDC: 4.12, USDT: 3.98, DAI: 3.91, WETH: 2.10 },
    polygon:  { USDC: 5.43, USDT: 5.21, DAI: 5.18, WETH: 2.67 },
    avalanche:{ USDC: 4.56, USDT: 4.44, DAI: 4.39, WETH: 2.45 },
  },
  compound: {
    ethereum: { USDC: 5.82, USDT: 5.61, WETH: 2.14 },
    arbitrum: { USDC: 6.23, USDT: 6.01, WETH: 2.89 },
    polygon:  { USDC: 5.97, USDT: 5.78, WETH: 2.55 },
  },
  curve: {
    ethereum: { '3CRV': 4.31, USDC: 4.15, USDT: 4.09, DAI: 4.02 },
    arbitrum: { '3CRV': 5.67, USDC: 5.44, USDT: 5.38 },
    optimism: { '3CRV': 5.12, USDC: 4.98, USDT: 4.91 },
  },
}

// Aave V3 subgraph endpoints
const AAVE_SUBGRAPHS: Record<string, string> = {
  ethereum: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3',
  arbitrum: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-arbitrum',
}

async function tryFetchLiveRates(): Promise<{ rates: Record<string, ProtocolRates>; live: boolean }> {
  try {
    const query = `{ reserves(where:{isActive:true},first:8) { symbol liquidityRate } }`
    const res = await fetch(AAVE_SUBGRAPHS.ethereum, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) throw new Error(`Aave subgraph ${res.status}`)
    const data = await res.json()
    const reserves = data?.data?.reserves ?? []
    if (reserves.length === 0) throw new Error('Empty reserves')

    const ethRates: ChainRates = {}
    for (const r of reserves) {
      const apy = (parseFloat(r.liquidityRate) / 1e27) * 100
      if (apy > 0) ethRates[r.symbol] = Math.round(apy * 100) / 100
    }

    // Got live Aave data — merge with mock for other protocols/chains
    const rates: Record<string, ProtocolRates> = {
      aave: { ...MOCK_RATES.aave, ethereum: ethRates },
      compound: MOCK_RATES.compound,
      curve: MOCK_RATES.curve,
    }
    return { rates, live: true }
  } catch {
    return { rates: MOCK_RATES, live: false }
  }
}

function findBest(rates: Record<string, ProtocolRates>) {
  let best = { protocol: 'compound', chain: 'arbitrum', token: 'USDC', apy: 0 }
  for (const [protocol, chains] of Object.entries(rates)) {
    for (const [chain, tokens] of Object.entries(chains)) {
      for (const [token, apy] of Object.entries(tokens)) {
        if (typeof apy === 'number' && apy > best.apy) {
          best = { protocol, chain, token, apy }
        }
      }
    }
  }
  return best
}

export async function GET() {
  const { rates, live } = await tryFetchLiveRates()
  const best = findBest(rates)

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    rates: {
      ...rates,
      _meta: {
        fetched_at: new Date().toISOString(),
        source: live ? 'live' : 'mock',
        note: live
          ? 'Aave V3 rates from The Graph; Compound/Curve use representative values.'
          : 'Live protocol APIs unreachable — displaying representative rates. Deploy backend for live data.',
      },
    },
    best_protocol: best.protocol,
    best_chain: best.chain,
    best_apy: best.apy,
    data_source: live ? 'live' : 'mock',
  })
}
