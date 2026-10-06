from __future__ import annotations
from typing import Optional
from backend.models.schemas import AlgorithmType, ACOParams, WeightedParams
from backend.algorithms.base import BaseRouter, RoutingResult, compute_heuristic_for_node
from backend.algorithms.round_robin import RoundRobinRouter
from backend.algorithms.least_requests import LeastRequestsRouter
from backend.algorithms.weighted import WeightedWorkloadRouter
from backend.algorithms.aco import ACORouter


def create_router(
    algorithm: AlgorithmType,
    aco_params: Optional[ACOParams] = None,
    weighted_params: Optional[WeightedParams] = None,
    seed: Optional[int] = None,
) -> BaseRouter:
    """Factory to instantiate the appropriate router."""
    if algorithm == "round-robin":
        return RoundRobinRouter()
    elif algorithm == "least-requests":
        return LeastRequestsRouter()
    elif algorithm == "weighted":
        return WeightedWorkloadRouter(params=weighted_params)
    elif algorithm == "aco":
        return ACORouter(params=aco_params, seed=seed)
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")


__all__ = [
    "BaseRouter",
    "RoutingResult",
    "compute_heuristic_for_node",
    "RoundRobinRouter",
    "LeastRequestsRouter",
    "WeightedWorkloadRouter",
    "ACORouter",
    "create_router",
]
