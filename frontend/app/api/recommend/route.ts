import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import Anthropic from '@anthropic-ai/sdk'

const MOCK_RATES = {
  aave: {
    ethereum: { USDC: 3.21, arbitrum: { USDC: 4.87 } },
    arbitrum: { USDC: 4.87 },
    polygon: { USDC: 5.43 },
  },
  compound: {
    ethereum: { USDC: 5.82 },
    arbitrum: { USDC: 6.23 },
    polygon: { USDC: 5.97 },
  },
  curve: {
    ethereum: { USDC: 4.15 },
    arbitrum: { USDC: 5.44 },
  },
}

// Flatten rates into sorted opportunities
function getOpportunities(token = 'USDC') {
  const opps: { protocol: string; chain: string; apy: number }[] = []
  for (const [protocol, chains] of Object.entries(MOCK_RATES)) {
    for (const [chain, tokens] of Object.entries(chains as Record<string, Record<string, number>>)) {
      const apy = (tokens as Record<string, number>)[token]
      if (typeof apy === 'number') opps.push({ protocol, chain, apy })
    }
  }
  return opps.sort((a, b) => b.apy - a.apy)
}

function keccak256(text: string): string {
  return '0x' + crypto.createHash('sha256').update(text).digest('hex')
}

async function generateReasoning(rec: Record<string, unknown>, amount: number): Promise<{ explanation: string; confidence: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { explanation: fallbackExplanation(rec, amount), confidence: 0.75 }

  try {
    const client = new Anthropic({ apiKey })
    const from_apy = rec.from_apy as number
    const to_apy = rec.to_apy as number
    const annual_gain = rec.annual_gain_usd as number
    const gas = rec.estimated_gas_usd as number
    const breakeven = rec.breakeven_days as number
    const from_chain = rec.from_chain as string
    const to_chain = rec.to_chain as string
    const is_cross = from_chain !== to_chain

    const prompt = `Explain this yield rebalancing decision in 2-3 sentences:
Position: $${amount.toLocaleString()} USDC
Current: ${rec.from_protocol} on ${from_chain} @ ${from_apy.toFixed(2)}% APY
Target: ${rec.to_protocol} on ${to_chain} @ ${to_apy.toFixed(2)}% APY
APY improvement: +${(to_apy - from_apy).toFixed(2)}%
Annual gain: $${annual_gain.toFixed(2)}
Gas cost: ~$${gas.toFixed(2)} | Break-even: ${breakeven.toFixed(1)} days
Cross-chain: ${is_cross ? 'Yes (LayerZero V2)' : 'No'}
Cover APY delta, gas economics, and risk briefly.`

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })
    const explanation = (msg.content[0] as { text: string }).text.trim()
    return { explanation, confidence: 0.92 }
  } catch {
    return { explanation: fallbackExplanation(rec, amount), confidence: 0.75 }
  }
}

function fallbackExplanation(rec: Record<string, unknown>, amount: number): string {
  const from_apy = rec.from_apy as number
  const to_apy = rec.to_apy as number
  const annual_gain = rec.annual_gain_usd as number
  const gas = rec.estimated_gas_usd as number
  const breakeven = rec.breakeven_days as number
  return `Moving $${amount.toLocaleString()} USDC to ${rec.to_protocol} on ${rec.to_chain} captures a +${(to_apy - from_apy).toFixed(2)}% APY improvement (${from_apy.toFixed(2)}% → ${to_apy.toFixed(2)}%). Expected annual gain: $${annual_gain.toFixed(2)}. Gas cost ~$${gas.toFixed(2)} breaks even in ${breakeven.toFixed(1)} days — both protocols are battle-tested with >$500M TVL.`
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const amount = parseFloat(body.amount ?? 10000)
  const token = body.token ?? 'USDC'

  const opps = getOpportunities(token)
  const current = { protocol: 'aave', chain: 'ethereum', apy: 3.21 }
  const best = opps[0]

  const is_cross = best.chain !== current.chain
  const gas = is_cross ? 15 : 8
  const apy_delta = best.apy - current.apy
  const annual_gain = amount * (apy_delta / 100)
  const breakeven = annual_gain > 0 ? (gas / annual_gain) * 365 : 9999
  const should_rebalance = apy_delta >= 0.5 && annual_gain > gas && breakeven < 90

  const rec: Record<string, unknown> = {
    should_rebalance,
    from_protocol: current.protocol,
    from_chain: current.chain,
    from_apy: current.apy,
    to_protocol: best.protocol,
    to_chain: best.chain,
    to_apy: best.apy,
    apy_delta: Math.round(apy_delta * 100) / 100,
    estimated_gas_usd: gas,
    breakeven_days: Math.round(breakeven * 10) / 10,
    annual_gain_usd: Math.round(annual_gain * 100) / 100,
  }

  const { explanation, confidence } = await generateReasoning(rec, amount)
  rec.reasoning = explanation
  rec.reasoning_hash = keccak256(explanation)
  rec.confidence = confidence

  return NextResponse.json(rec)
}
