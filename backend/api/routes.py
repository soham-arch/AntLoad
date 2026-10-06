from __future__ import annotations
import time
from typing import List, Dict, Optional, Any
from fastapi import APIRouter, HTTPException, Path, Body

from backend.models.schemas import (
    NodeMetrics,
    SimulationConfig,
    SimulationState,
    AlgorithmResult,
    ExperimentConfig,
    ExperimentResult,
    RoutingDecision,
    InferenceRequest,
    ComparisonRequest,
    DecisionRequest,
    TickRequest,
)
from backend.simulation.engine import SimulationEngine
from backend.experiments.runner import ExperimentRunner, PREDEFINED_EXPERIMENTS
from backend.algorithms import create_router, compute_heuristic_for_node

router = APIRouter(prefix="/api", tags=["simulation"])

# Singleton simulation instance for interactive live session
_default_config = SimulationConfig(
    algorithm="aco",
    workloadPattern="mixed",
    requestRate=50.0,
    nodeCount=3,
    heterogeneity="high",
    duration=30.0,
)
live_engine = SimulationEngine(_default_config)
server_start_time = time.time()


@router.get("/health")
def get_health() -> Dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "AI Inference Load Balancing Engine",
        "uptime_seconds": round(time.time() - server_start_time, 1),
        "simulation_status": live_engine.status,
    }


@router.get("/nodes", response_model=List[NodeMetrics])
def get_nodes() -> List[NodeMetrics]:
    """Returns current live inference node states."""
    state = live_engine.get_state()
    return state.nodes


@router.post("/simulation/start")
def start_simulation(config: Optional[SimulationConfig] = None) -> Dict[str, Any]:
    """Starts or resumes the simulation."""
    if config:
        live_engine.set_config(config.model_dump(by_alias=False))
    live_engine.start()
    return {"message": "Simulation started", "status": live_engine.status}


@router.post("/simulation/pause")
def pause_simulation() -> Dict[str, Any]:
    """Pauses the running simulation."""
    live_engine.pause()
    return {"message": "Simulation paused", "status": live_engine.status}


@router.post("/simulation/reset")
def reset_simulation() -> Dict[str, Any]:
    """Resets the simulation to initial configuration."""
    live_engine.reset()
    return {"message": "Simulation reset", "status": live_engine.status}


@router.post("/simulation/tick", response_model=SimulationState)
def tick_simulation(req: TickRequest = Body(default=TickRequest())) -> SimulationState:
    """Advances simulation clock by dt seconds and returns the new state."""
    live_engine.tick(req.dt)
    return live_engine.get_state()


@router.post("/simulation/config")
def update_config(config: SimulationConfig) -> Dict[str, Any]:
    """Updates the active simulation configuration."""
    live_engine.set_config(config.model_dump(by_alias=False))
    return {"message": "Configuration updated", "config": live_engine.config}


@router.post("/simulation/burst")
def inject_burst() -> Dict[str, Any]:
    """Injects a sudden inference traffic burst."""
    live_engine.inject_burst()
    return {"message": "Traffic burst injected", "burstActive": True}


@router.post("/nodes/{node_id}/degrade")
def degrade_node(node_id: str = Path(..., description="ID of node to degrade")) -> Dict[str, Any]:
    """Simulates performance degradation on an inference node."""
    node = next((n for n in live_engine.nodes if n.id == node_id), None)
    if not node:
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found")
    live_engine.degrade_node(node_id)
    return {"message": f"Node {node_id} degraded", "capacity": node.capacity, "health": node.health}


@router.post("/nodes/{node_id}/restore")
def restore_node(node_id: str = Path(..., description="ID of node to restore")) -> Dict[str, Any]:
    """Restores a degraded inference node back to normal health and capacity."""
    node = next((n for n in live_engine.nodes if n.id == node_id), None)
    if not node:
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found")
    live_engine.restore_node(node_id)
    return {"message": f"Node {node_id} restored", "capacity": node.capacity, "health": node.health}


@router.get("/simulation/state", response_model=SimulationState)
def get_simulation_state() -> SimulationState:
    """Returns the complete snapshot of the simulation state."""
    return live_engine.get_state()


@router.post("/simulation/request", response_model=RoutingDecision)
def route_single_request() -> RoutingDecision:
    """Generates and routes a single ad-hoc inference request through the active engine."""
    live_engine.current_request_id += 1
    req = live_engine.workload_gen.create_request(live_engine.current_request_id, live_engine.elapsed_time)
    res = live_engine.router.route(live_engine.nodes, req.id)
    req.assigned_node = res.selected_node

    decision = RoutingDecision(
        requestId=req.id,
        algorithm=live_engine.config.algorithm,
        selectedNode=res.selected_node,
        probabilities={k: round(v, 4) for k, v in res.probabilities.items()},
        reasoning=res.reasoning,
        timestamp=round(live_engine.elapsed_time, 2),
    )
    live_engine.recent_decisions.append(decision)
    live_engine.requests.append(req)
    return decision


@router.post("/algorithms/decision", response_model=RoutingDecision)
def get_algorithm_decision(req: DecisionRequest) -> RoutingDecision:
    """
    Computes an isolated routing decision for a given algorithm and node state list.
    Allows inspection of algorithm decision logic without advancing the global simulation clock.
    """
    router_inst = create_router(
        algorithm=req.algorithm,
        aco_params=req.aco_params,
        weighted_params=req.weighted_params,
    )
    res = router_inst.route(req.nodes, req.request_id)
    return RoutingDecision(
        requestId=req.request_id,
        algorithm=req.algorithm,
        selectedNode=res.selected_node,
        probabilities={k: round(v, 4) for k, v in res.probabilities.items()},
        reasoning=res.reasoning,
        timestamp=0.0,
    )


@router.post("/comparison/run", response_model=List[AlgorithmResult])
def run_comparison(req: ComparisonRequest) -> List[AlgorithmResult]:
    """
    Runs an identical workload across all specified algorithms and returns comparative metrics.
    """
    algorithms = req.algorithms or ["round-robin", "least-requests", "weighted", "aco"]
    results: List[AlgorithmResult] = []

    for algo in algorithms:
        res = SimulationEngine.run_full_simulation(
            base_config=req.base_config,
            algorithm=algo,
            seed=req.seed or 42,
        )
        results.append(res)
    return results


@router.post("/experiments/run", response_model=ExperimentResult)
def run_experiment(config: ExperimentConfig) -> ExperimentResult:
    """Executes a full controlled experiment comparing all 4 routing algorithms."""
    return ExperimentRunner.run_experiment(config)


@router.get("/experiments", response_model=List[ExperimentConfig])
def list_experiments() -> List[ExperimentConfig]:
    """Returns the list of predefined research experiment scenarios."""
    return list(PREDEFINED_EXPERIMENTS.values())


@router.get("/experiments/{experiment_id}", response_model=ExperimentResult)
def run_predefined_experiment(experiment_id: str = Path(..., description="ID of predefined experiment")) -> ExperimentResult:
    """Runs a predefined research experiment by ID and returns genuine calculated results."""
    if experiment_id not in PREDEFINED_EXPERIMENTS:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found")
    exp_config = PREDEFINED_EXPERIMENTS[experiment_id]
    return ExperimentRunner.run_experiment(exp_config)
