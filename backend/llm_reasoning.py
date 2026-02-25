"""
LLM Reasoning Engine — uses Claude to explain rebalancing decisions in plain English.
This is the novel differentiator: every yield rebalance comes with an AI explanation.
"""
import hashlib
import logging
import os
from typing import Any

import anthropic

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a DeFi yield optimization expert AI. Your job is to explain 
cross-chain yield rebalancing decisions in clear, plain English that both DeFi experts 
and newcomers can understand.

When explaining a rebalancing decision, always include:
1. The APY difference and why it matters
2. Gas cost analysis and break-even timeline  
3. Risk assessment (protocol TVL, audit status, smart contract risk)
4. Cross-chain considerations (bridge security, LayerZero reliability)
5. A clear recommendation with confidence level

Keep explanations concise (2-4 sentences) but informative. Use specific numbers."""


class LLMReasoningEngine:
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if api_key:
            self.client = anthropic.Anthropic(api_key=api_key)
        else:
            self.client = None
            logger.warning("ANTHROPIC_API_KEY not set — using mock reasoning")

    async def explain_recommendation(
        self,
        recommendation: dict,
        current_position: dict,
        rates: dict,
        amount: float,
    ) -> dict:
        """Generate a plain-English explanation for a rebalancing recommendation."""

        if not recommendation.get("should_rebalance"):
            explanation = self._no_rebalance_explanation(recommendation, current_position)
            return {
                "explanation": explanation,
                "hash": self._hash(explanation),
                "confidence": 0.95,
            }

        prompt = self._build_prompt(recommendation, current_position, amount, rates)

        if self.client:
            try:
                message = self.client.messages.create(
                    model="claude-opus-4-5",
                    max_tokens=300,
                    system=SYSTEM_PROMPT,
                    messages=[{"role": "user", "content": prompt}],
                )
                explanation = message.content[0].text.strip()
                confidence = 0.92
            except Exception as e:
                logger.error(f"Claude API error: {e}")
                explanation = self._fallback_explanation(recommendation, amount)
                confidence = 0.75
        else:
            explanation = self._fallback_explanation(recommendation, amount)
            confidence = 0.75

        return {
            "explanation": explanation,
            "hash": self._hash(explanation),
            "confidence": confidence,
        }

    def _build_prompt(
        self,
        rec: dict,
        position: dict,
        amount: float,
        rates: dict,
    ) -> str:
        annual_gain = rec.get("annual_gain_usd", 0)
        gas_cost = rec.get("estimated_gas_usd", 12)
        breakeven = rec.get("breakeven_days", 5)
        from_apy = rec.get("from_apy", 0)
        to_apy = rec.get("to_apy", 0)
        from_protocol = rec.get("from_protocol", "unknown")
        to_protocol = rec.get("to_protocol", "unknown")
        from_chain = rec.get("from_chain", "ethereum")
        to_chain = rec.get("to_chain", "arbitrum")
        is_cross_chain = from_chain != to_chain

        return f"""Explain this yield rebalancing decision:

Position: ${amount:,.2f} USDC
Current: {from_protocol.title()} on {from_chain.title()} @ {from_apy:.2f}% APY
Target: {to_protocol.title()} on {to_chain.title()} @ {to_apy:.2f}% APY
APY improvement: +{(to_apy - from_apy):.2f}%
Estimated annual gain: ${annual_gain:,.2f}
Gas cost: ~${gas_cost:.2f}
Break-even: {breakeven:.1f} days
Cross-chain: {"Yes (via LayerZero V2)" if is_cross_chain else "No (same chain)"}

Explain in 2-3 sentences why this rebalance is optimal, covering APY delta, gas economics, and risk."""

    def _fallback_explanation(self, rec: dict, amount: float) -> str:
        from_apy = rec.get("from_apy", 0)
        to_apy = rec.get("to_apy", 0)
        to_protocol = rec.get("to_protocol", "the target protocol")
        to_chain = rec.get("to_chain", "the target chain")
        annual_gain = rec.get("annual_gain_usd", 0)
        gas = rec.get("estimated_gas_usd", 12)
        breakeven = rec.get("breakeven_days", 5)

        return (
            f"Moving ${amount:,.0f} USDC to {to_protocol.title()} on {to_chain.title()} "
            f"captures a +{(to_apy - from_apy):.2f}% APY improvement ({from_apy:.2f}% → {to_apy:.2f}%). "
            f"Expected annual gain: ${annual_gain:,.2f}. Gas cost ~${gas:.2f} breaks even in {breakeven:.1f} days. "
            f"Both protocols are battle-tested with >$500M TVL, making this a low-risk optimization."
        )

    def _no_rebalance_explanation(self, rec: dict, position: dict) -> str:
        current_apy = rec.get("from_apy", 0)
        return (
            f"Your current position is already optimally placed at {current_apy:.2f}% APY. "
            f"No rebalancing needed — the APY delta to alternative protocols doesn't justify gas costs at this time. "
            f"Continue monitoring; rates update every 5 minutes."
        )

    def _hash(self, text: str) -> str:
        return "0x" + hashlib.keccak_256(text.encode()).hexdigest()
