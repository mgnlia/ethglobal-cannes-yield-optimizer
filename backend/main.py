"""
Cross-Chain Yield Optimizer — FastAPI Backend
ETHGlobal Cannes 2026
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import asyncio
import logging
from datetime import datetime

from yield_aggregator import YieldAggregator
from llm_reasoning import LLMReasoningEngine
from rebalancer import RebalancingEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Cross-Chain Yield Optimizer API",
    description="AI-powered yield optimization with LayerZero V2 cross-chain messaging",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
yield_aggregator = YieldAggregator()
reasoning_engine = LLMReasoningEngine()
rebalancer = RebalancingEngine()


# ─────────────────────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────────────────────

class PortfolioRequest(BaseModel):
    wallet_address: str = Field(..., description="Ethereum wallet address")
    token: str = Field(default="USDC", description="Token to optimize")
    amount: float = Field(..., description="Amount to optimize (in token units)")

class RebalanceRequest(BaseModel):
    wallet_address: str
    token: str
    amount: float
    from_chain: str = Field(default="ethereum", description="Source chain")
    to_chain: Optional[str] = Field(None, description="Target chain (auto-selected if None)")

class YieldRatesResponse(BaseModel):
    timestamp: str
    rates: dict
    best_protocol: str
    best_chain: str
    best_apy: float

class RebalanceRecommendation(BaseModel):
    should_rebalance: bool
    from_protocol: str
    from_chain: str
    from_apy: float
    to_protocol: str
    to_chain: str
    to_apy: float
    apy_delta: float
    estimated_gas_usd: float
    breakeven_days: float
    annual_gain_usd: float
    reasoning: str
    reasoning_hash: str
    confidence: float


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "yield-optimizer-api",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/yields", response_model=YieldRatesResponse)
async def get_yield_rates():
    """Fetch current yield rates from Aave, Compound, and Curve across all chains."""
    try:
        rates = await yield_aggregator.fetch_all_rates()
        best = yield_aggregator.find_best_opportunity(rates)
        return YieldRatesResponse(
            timestamp=datetime.utcnow().isoformat(),
            rates=rates,
            best_protocol=best["protocol"],
            best_chain=best["chain"],
            best_apy=best["apy"],
        )
    except Exception as e:
        logger.error(f"Error fetching yield rates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend", response_model=RebalanceRecommendation)
async def get_rebalance_recommendation(request: PortfolioRequest):
    """
    Get an AI-powered rebalancing recommendation for a portfolio position.
    Includes Claude LLM reasoning explaining the decision in plain English.
    """
    try:
        # Fetch current rates
        rates = await yield_aggregator.fetch_all_rates()

        # Get current position (simulated — in prod, read from contract)
        current_position = rebalancer.get_simulated_position(
            request.wallet_address, request.token, request.amount
        )

        # Calculate optimal rebalancing
        recommendation = rebalancer.calculate_optimal_rebalance(
            current_position, rates, request.amount
        )

        # Generate LLM reasoning
        reasoning = await reasoning_engine.explain_recommendation(
            recommendation, current_position, rates, request.amount
        )

        recommendation["reasoning"] = reasoning["explanation"]
        recommendation["reasoning_hash"] = reasoning["hash"]
        recommendation["confidence"] = reasoning["confidence"]

        return RebalanceRecommendation(**recommendation)

    except Exception as e:
        logger.error(f"Error generating recommendation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rebalance")
async def execute_rebalance(request: RebalanceRequest, background_tasks: BackgroundTasks):
    """
    Execute a cross-chain rebalance via LayerZero V2.
    Returns immediately with a job ID; status can be polled.
    """
    try:
        job_id = rebalancer.queue_rebalance(
            wallet=request.wallet_address,
            token=request.token,
            amount=request.amount,
            from_chain=request.from_chain,
            to_chain=request.to_chain,
        )

        background_tasks.add_task(rebalancer.execute_rebalance_async, job_id)

        return {
            "job_id": job_id,
            "status": "queued",
            "message": "Rebalance queued. Poll /rebalance/{job_id} for status.",
        }
    except Exception as e:
        logger.error(f"Error queuing rebalance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/rebalance/{job_id}")
async def get_rebalance_status(job_id: str):
    """Poll status of a queued rebalance job."""
    status = rebalancer.get_job_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
    return status


@app.get("/history")
async def get_rebalance_history(limit: int = 20):
    """Get recent rebalancing history with AI reasoning for each decision."""
    return rebalancer.get_history(limit)


@app.get("/portfolio/{wallet_address}")
async def get_portfolio(wallet_address: str):
    """Get portfolio summary for a wallet address."""
    try:
        rates = await yield_aggregator.fetch_all_rates()
        portfolio = rebalancer.get_portfolio_summary(wallet_address, rates)
        return portfolio
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/protocols")
async def get_supported_protocols():
    """List supported protocols and chains."""
    return {
        "protocols": [
            {
                "name": "Aave V3",
                "chains": ["ethereum", "arbitrum", "optimism", "polygon", "avalanche"],
                "tokens": ["USDC", "USDT", "DAI", "WETH", "WBTC"],
            },
            {
                "name": "Compound V3",
                "chains": ["ethereum", "arbitrum", "polygon"],
                "tokens": ["USDC", "USDT", "WETH"],
            },
            {
                "name": "Curve",
                "chains": ["ethereum", "arbitrum", "optimism"],
                "tokens": ["USDC", "USDT", "DAI", "3CRV"],
            },
        ],
        "layerzero_chains": [
            {"name": "Ethereum Sepolia", "eid": 40161, "testnet": True},
            {"name": "Arbitrum Sepolia", "eid": 40231, "testnet": True},
        ],
    }
