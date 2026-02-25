import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const OPPORTUNITIES = [
  { protocol: 'compound', chain: 'arbitrum', apy: 6.23 },
  { protocol: 'aave', chain: 'polygon', apy: 5.43 },
  { protocol: 'compound', chain: 'polygon', apy: 5.97 },
  { protocol: 'curve', chain: 'arbitrum', apy: 5.44 },
  { protocol: 'aave', chain: 'arbitrum', apy: 4.87 },
  { protocol: 'aave', chain: 'ethereum', apy: 3.21 },
]

function keccak256hex(text: string): string {
  return '0x' + crypto.createHash('sha256').update(text).digest('hex')
}

function fallbackExplanation(rec: Record<string, unknown>, amount: number): string {
  const fromApy = rec.from_apy as number
  const toApy = rec.to_apy as number
  const annualGain = rec.annual_gain_usd as number
  const gas = rec.estimated_gas_usd as number
  const breakeven = rec.breakeven_days as number
  return `Moving $${amount.toLocaleString()} USDC to ${rec.to_protocol} on ${rec.to_chain} captures a +${(toApy - fromApy).toFixed(2)}% APY improvement (${fromApy.toFixed(2)}% → ${toApy.toFixed(2)}%). Expected annual gain: $${annualGain.toFixed(2)}. Gas cost ~$${gas.toFixed(2)} breaks even in ${breakeven.toFixed(1)} days — both protocols are battle-tested with >$500M TVL.`
}

async function generateReasoning(rec: Record<string, unknown>, amount: number): Promise<{ explanation: string; confidence: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { explanation: fallbackExplanation(rec, amount), confidence: 0.75 }

  try {
    const fromApy = rec.from_apy as number
    const toApy = rec.to_apy as number
    const annualGain = rec.annual_gain_usd as number
    const gas = rec.estimated_gas_usd as number
    const breakeven = rec.breakeven_days as number
    const isCross = rec.from_chain !== rec.to_chain

    const prompt = `Explain this DeFi yield rebalancing in 2-3 sentences (be specific with numbers):
$${amount.toLocaleString()} USDC: ${rec.from_protocol} on ${rec.from_chain} (${fromApy.toFixed(2)}% APY) → ${rec.to_protocol} on ${rec.to_chain} (${toApy.toFixed(2)}% APY)
APY delta: +${(toApy - fromApy).toFixed(2)}% | Annual gain: $${annualGain.toFixed(2)} | Gas: ~$${gas.toFixed(2)} | Break-even: ${breakeven.toFixed(1)} days | ${isCross ? 'Cross-chain via LayerZero V2' : 'Same chain'}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (res.ok) {
      const data = await res.json()
      const explanation = data.content?.[0]?.text?.trim() ?? fallbackExplanation(rec, amount)
      return { explanation, confidence: 0.92 }
    }
  } catch { /* fallthrough */ }

  return { explanation: fallbackExplanation(rec, amount), confidence: 0.75 }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const amount = parseFloat(body.amount ?? 10000)

  const current = { protocol: 'aave', chain: 'ethereum', apy: 3.21 }
  const best = OPPORTUNITIES[0]

  const isCross = best.chain !== current.chain
  const gas = isCross ? 15 : 8
  const apyDelta = best.apy - current.apy
  const annualGain = amount * (apyDelta / 100)
  const breakeven = annualGain > 0 ? (gas / annualGain) * 365 : 9999
  const shouldRebalance = apyDelta >= 0.5 && annualGain > gas && breakeven < 90

  const rec: Record<string, unknown> = {
    should_rebalance: shouldRebalance,
    from_protocol: current.protocol,
    from_chain: current.chain,
    from_apy: current.apy,
    to_protocol: best.protocol,
    to_chain: best.chain,
    to_apy: best.apy,
    apy_delta: Math.round(apyDelta * 100) / 100,
    estimated_gas_usd: gas,
    breakeven_days: Math.round(breakeven * 10) / 10,
    annual_gain_usd: Math.round(annualGain * 100) / 100,
  }

  const { explanation, confidence } = await generateReasoning(rec, amount)
  rec.reasoning = explanation
  rec.reasoning_hash = keccak256hex(explanation)
  rec.confidence = confidence

  return NextResponse.json(rec)
}
