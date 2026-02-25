"""
Rebalancing Engine — calculates optimal rebalancing decisions and manages job queue.
"""
import uuid
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# Gas cost estimates in USD per chain
GAS_COSTS = {
    "same_chain": 8,
    "cross_chain_lz": 15,  # LayerZero V2 cross-chain
}

# Minimum APY improvement to justify rebalancing (basis points)
MIN_APY_DELTA = 0.5  # 0.5%

# Simulated current positions (in production, read from contract)
SIMULATED_POSITIONS = {
    "default": {
        "protocol": "aave",
        "chain": "ethereum",
        "token": "USDC",
        "apy": 3.21,
    }
}


class RebalancingEngine:
    def __init__(self):
        self._jobs: dict = {}
        self._history: list = []

    def get_simulated_position(self, wallet: str, token: str, amount: float) -> dict:
        """Return a simulated current position (replace with on-chain read in prod)."""
        pos = SIMULATED_POSITIONS.get(wallet, SIMULATED_POSITIONS["default"])
        return {**pos, "wallet": wallet, "token": token, "amount": amount}

    def calculate_optimal_rebalance(
        self, position: dict, rates: dict, amount: float
    ) -> dict:
        """Find the best rebalancing opportunity given current rates."""
        from yield_aggregator import YieldAggregator
        aggregator = YieldAggregator()

        current_protocol = position.get("protocol", "aave")
        current_chain = position.get("chain", "ethereum")
        current_apy = position.get("apy", 0)

        # Get all opportunities for this token
        opportunities = aggregator.get_rates_for_token(rates, position.get("token", "USDC"))

        if not opportunities:
            return self._no_rebalance(current_protocol, current_chain, current_apy)

        best = opportunities[0]

        # Skip if already at best
        if (
            best["protocol"] == current_protocol
            and best["chain"] == current_chain
        ):
            return self._no_rebalance(current_protocol, current_chain, current_apy)

        apy_delta = best["apy"] - current_apy
        is_cross_chain = best["chain"] != current_chain
        gas_usd = GAS_COSTS["cross_chain_lz"] if is_cross_chain else GAS_COSTS["same_chain"]

        # Annual gain
        annual_gain = amount * (apy_delta / 100)

        # Break-even in days
        if annual_gain > 0:
            breakeven_days = (gas_usd / annual_gain) * 365
        else:
            breakeven_days = 9999

        # Decide whether to rebalance
        should_rebalance = (
            apy_delta >= MIN_APY_DELTA
            and annual_gain > gas_usd
            and breakeven_days < 90
        )

        return {
            "should_rebalance": should_rebalance,
            "from_protocol": current_protocol,
            "from_chain": current_chain,
            "from_apy": current_apy,
            "to_protocol": best["protocol"],
            "to_chain": best["chain"],
            "to_apy": best["apy"],
            "apy_delta": round(apy_delta, 2),
            "estimated_gas_usd": gas_usd,
            "breakeven_days": round(breakeven_days, 1),
            "annual_gain_usd": round(annual_gain, 2),
            "reasoning": "",  # filled by LLM
            "reasoning_hash": "",
            "confidence": 0.0,
        }

    def queue_rebalance(
        self,
        wallet: str,
        token: str,
        amount: float,
        from_chain: str,
        to_chain: Optional[str],
    ) -> str:
        job_id = str(uuid.uuid4())[:8]
        self._jobs[job_id] = {
            "id": job_id,
            "status": "queued",
            "wallet": wallet,
            "token": token,
            "amount": amount,
            "from_chain": from_chain,
            "to_chain": to_chain,
            "created_at": datetime.utcnow().isoformat(),
            "tx_hash": None,
            "error": None,
        }
        return job_id

    async def execute_rebalance_async(self, job_id: str):
        """Simulate async rebalance execution (replace with actual LZ call in prod)."""
        import asyncio
        job = self._jobs.get(job_id)
        if not job:
            return

        job["status"] = "executing"
        await asyncio.sleep(3)  # Simulate tx time

        # Simulate success
        job["status"] = "completed"
        job["tx_hash"] = "0x" + "a" * 64
        job["completed_at"] = datetime.utcnow().isoformat()

        self._history.insert(0, {**job})

    def get_job_status(self, job_id: str) -> Optional[dict]:
        return self._jobs.get(job_id)

    def get_history(self, limit: int = 20) -> list:
        # Return mock history if empty
        if not self._history:
            return self._mock_history()
        return self._history[:limit]

    def get_portfolio_summary(self, wallet: str, rates: dict) -> dict:
        from yield_aggregator import YieldAggregator
        aggregator = YieldAggregator()
        best = aggregator.find_best_opportunity(rates)
        return {
            "wallet": wallet,
            "positions": [
                {
                    "token": "USDC",
                    "amount": 10000,
                    "protocol": "aave",
                    "chain": "ethereum",
                    "apy": 3.21,
                    "value_usd": 10000,
                }
            ],
            "total_value_usd": 10000,
            "weighted_apy": 3.21,
            "best_available_apy": best["apy"],
            "optimization_opportunity": best["apy"] - 3.21,
        }

    def _no_rebalance(self, protocol: str, chain: str, apy: float) -> dict:
        return {
            "should_rebalance": False,
            "from_protocol": protocol,
            "from_chain": chain,
            "from_apy": apy,
            "to_protocol": protocol,
            "to_chain": chain,
            "to_apy": apy,
            "apy_delta": 0.0,
            "estimated_gas_usd": 0.0,
            "breakeven_days": 0.0,
            "annual_gain_usd": 0.0,
            "reasoning": "",
            "reasoning_hash": "",
            "confidence": 0.0,
        }

    def _mock_history(self) -> list:
        return [
            {
                "id": "abc12345",
                "status": "completed",
                "wallet": "0xDemo...",
                "token": "USDC",
                "amount": 5000,
                "from_chain": "ethereum",
                "to_chain": "arbitrum",
                "from_protocol": "aave",
                "to_protocol": "compound",
                "from_apy": 3.21,
                "to_apy": 6.23,
                "apy_delta": 3.02,
                "annual_gain_usd": 151.0,
                "tx_hash": "0x" + "b" * 64,
                "created_at": "2026-02-25T10:00:00Z",
                "completed_at": "2026-02-25T10:00:45Z",
                "reasoning": (
                    "Moving $5,000 USDC from Ethereum Aave (3.21% APY) to Arbitrum Compound (6.23% APY) "
                    "captures a +3.02% APY improvement worth $151/year. Gas cost ~$15 breaks even in 36 days. "
                    "Both protocols have >$1B TVL; LayerZero V2 bridge is battle-tested with 99.9% uptime."
                ),
            },
            {
                "id": "def67890",
                "status": "completed",
                "wallet": "0xDemo...",
                "token": "USDC",
                "amount": 3000,
                "from_chain": "arbitrum",
                "to_chain": "polygon",
                "from_protocol": "compound",
                "to_protocol": "aave",
                "from_apy": 5.12,
                "to_apy": 5.43,
                "apy_delta": 0.31,
                "annual_gain_usd": 9.3,
                "tx_hash": "0x" + "c" * 64,
                "created_at": "2026-02-24T15:30:00Z",
                "completed_at": "2026-02-24T15:31:12Z",
                "reasoning": (
                    "Minor rebalance: $3,000 USDC from Arbitrum Compound (5.12%) to Polygon Aave (5.43%). "
                    "Small +0.31% gain ($9.30/year) but gas is minimal ($8) — break-even in 314 days. "
                    "Executed as part of portfolio optimization sweep."
                ),
            },
        ]
