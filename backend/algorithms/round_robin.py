from __future__ import annotations
from typing import List, Dict
from backend.models.schemas import NodeMetrics, AlgorithmType
from backend.algorithms.base import BaseRouter, RoutingResult, get_healthy_nodes


class RoundRobinRouter(BaseRouter):
    """
    Deterministic Round Robin routing algorithm.
    Distributes requests cyclically across nodes without inspecting workload or capacity.
    """
    algorithm_type: AlgorithmType = "round-robin"

    def __init__(self) -> None:
        self.index: int = 0

    def route(self, nodes: List[NodeMetrics], request_id: int) -> RoutingResult:
        healthy = get_healthy_nodes(nodes)
        if not healthy:
            fallback = nodes[0].id if nodes else "GPU-01"
            return RoutingResult(
                selected_node=fallback,
                probabilities={},
                reasoning=["No healthy nodes available; defaulting to first node."],
            )

        selected = healthy[self.index % len(healthy)]
        self.index += 1

        probabilities: Dict[str, float] = {
            n.id: 1.0 / len(healthy) for n in healthy
        }

        reasoning = [
            f"Cyclic assignment: next node in rotation sequence is {selected.id} ({selected.gpu_name}).",
            "Round Robin strictly allocates requests sequentially, agnostic of node capacity and current load.",
        ]

        return RoutingResult(
            selected_node=selected.id,
            probabilities=probabilities,
            reasoning=reasoning,
        )

    def reset(self) -> None:
        self.index = 0
