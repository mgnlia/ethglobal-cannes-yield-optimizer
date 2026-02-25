import { NextResponse } from 'next/server'

const HISTORY = [
  {
    id: 'abc12345', status: 'completed', token: 'USDC', amount: 5000,
    from_chain: 'ethereum', to_chain: 'arbitrum',
    from_protocol: 'aave', to_protocol: 'compound',
    from_apy: 3.21, to_apy: 6.23, apy_delta: 3.02, annual_gain_usd: 151.0,
    tx_hash: '0x' + 'a'.repeat(64),
    created_at: '2026-02-25T10:00:00Z', completed_at: '2026-02-25T10:00:45Z',
    reasoning: 'Moving $5,000 USDC from Ethereum Aave (3.21% APY) to Arbitrum Compound (6.23% APY) captures a +3.02% APY improvement worth $151/year. Gas cost ~$15 breaks even in 36 days. Both protocols have >$1B TVL; LayerZero V2 bridge is battle-tested with 99.9% uptime.',
    reasoning_hash: '0x7f4e2b1c9a8d3f6e5b0c4a2d8e1f7b3a9c5d2e6f4b8a1c3d7e9f2b4a6c8d0e2f',
  },
  {
    id: 'def67890', status: 'completed', token: 'USDC', amount: 3000,
    from_chain: 'arbitrum', to_chain: 'polygon',
    from_protocol: 'compound', to_protocol: 'aave',
    from_apy: 5.12, to_apy: 5.43, apy_delta: 0.31, annual_gain_usd: 9.3,
    tx_hash: '0x' + 'b'.repeat(64),
    created_at: '2026-02-24T15:30:00Z', completed_at: '2026-02-24T15:31:12Z',
    reasoning: 'Minor rebalance: $3,000 USDC from Arbitrum Compound (5.12%) to Polygon Aave (5.43%). Small +0.31% gain ($9.30/year) but gas is minimal ($8) — break-even in 314 days. Executed as part of portfolio optimization sweep.',
    reasoning_hash: '0x3a1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
  },
  {
    id: 'ghi11223', status: 'completed', token: 'USDC', amount: 12000,
    from_chain: 'ethereum', to_chain: 'polygon',
    from_protocol: 'curve', to_protocol: 'aave',
    from_apy: 4.15, to_apy: 5.43, apy_delta: 1.28, annual_gain_usd: 153.6,
    tx_hash: '0x' + 'c'.repeat(64),
    created_at: '2026-02-23T08:15:00Z', completed_at: '2026-02-23T08:16:02Z',
    reasoning: 'Shifting $12,000 USDC from Ethereum Curve (4.15%) to Polygon Aave (5.43%) yields +1.28% APY improvement ($153.60/year). Cross-chain gas ~$15 breaks even in 36 days. Polygon Aave V3 carries similar risk to Ethereum Aave with higher yield due to liquidity incentives.',
    reasoning_hash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
  },
]

export async function GET() {
  return NextResponse.json(HISTORY)
}
