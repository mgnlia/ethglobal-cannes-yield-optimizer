import { NextResponse } from 'next/server'

type ChainRates = Record<string, number>
type ProtocolRates = Record<string, ChainRates>

const MOCK_RATES: Record<string, ProtocolRates> = {
  aave: {
    ethereum: { USDC: 3.21, USDT: 3.15, DAI: 3.08, WETH: 1.95 },
    arbitrum: { USDC: 4.87, USDT: 4.72, DAI: 4.65, WETH: 2.31 },
    optimism: { USDC: 4.12, USDT: 3.98, DAI: 3.91, WETH: 2.10 },
    polygon: { USDC: 5.43, USDT: 5.21, DAI: 5.18, WETH: 2.67 },
    avalanche: { USDC: 4.56, USDT: 4.44, DAI: 4.39, WETH: 2.45 },
  },
  compound: {
    ethereum: { USDC: 5.82, USDT: 5.61, WETH: 2.14 },
    arbitrum: { USDC: 6.23, USDT: 6.01, WETH: 2.89 },
    polygon: { USDC: 5.97, USDT: 5.78, WETH: 2.55 },
  },
  curve: {
    ethereum: { '3CRV': 4.31, USDC: 4.15, USDT: 4.09, DAI: 4.02 },
    arbitrum: { '3CRV': 5.67, USDC: 5.44, USDT: 5.38 },
    optimism: { '3CRV': 5.12, USDC: 4.98, USDT: 4.91 },
  },
}

function findBest(rates: Record<string, ProtocolRates>) {
  let best = { protocol: 'compound', chain: 'arbitrum', token: 'USDC', apy: 0 }
  for (const [protocol, chains] of Object.entries(rates)) {
    if (protocol.startsWith('_')) continue
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
  const rates: Record<string, ProtocolRates | Record<string, string>> = {
    ...MOCK_RATES,
    _meta: { fetched_at: new Date().toISOString(), source: 'mock' },
  }
  const best = findBest(MOCK_RATES)
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    rates,
    best_protocol: best.protocol,
    best_chain: best.chain,
    best_apy: best.apy,
  })
}
