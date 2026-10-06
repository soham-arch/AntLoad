from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List, Dict, Tuple, Optional
from backend.models.schemas import NodeMetrics, AlgorithmType, RoutingDecision


def normalize_utilization(node: NodeMetrics) -> float:
    """Normalize utilization from [0, 100] to [0, 1]."""
    return min(1.0, max(0.0, node.utilization / 100.0))


def get_healthy_nodes(nodes: List[NodeMetrics]) -> List[NodeMetrics]:
    """Return nodes that are not offline."""
    return [n for n in nodes if n.health != "offline"]


def compute_heuristic_for_node(node: NodeMetrics) -> float:
    """
    Standard heuristic suitability function for a node:
    Combines utilization, queue length penalty, latency penalty, and capacity factor.
    Degraded nodes receive a penalty.
    Returns value in [0.01, 1.0].
    """
    util = normalize_utilization(node)
    queue_penalty = min(1.0, node.queue_length / 20.0)
    latency_penalty = min(1.0, node.average_latency / 300.0)
    capacity_bonus = node.capacity / 100.0
    degraded_penalty = 0.3 if node.degraded else 0.0

    h = (
        0.30 * (1.0 - util)
        + 0.25 * (1.0 - queue_penalty)
        + 0.20 * (1.0 - latency_penalty)
        + 0.25 * capacity_bonus
        - degraded_penalty
    )
    return float(max(0.01, h))


class RoutingResult:
    def __init__(
        self,
        selected_node: str,
        probabilities: Dict[str, float],
        reasoning: List[str],
    ):
        self.selected_node = selected_node
        self.probabilities = probabilities
        self.reasoning = reasoning


class BaseRouter(ABC):
    algorithm_type: AlgorithmType

    @abstractmethod
    def route(self, nodes: List[NodeMetrics], request_id: int) -> RoutingResult:
        """Route request_id across nodes and return chosen node and reasoning."""
        pass

    def on_complete(self, node_id: str, latency: float, success: bool) -> None:
        """Callback when an inference request completes on a node."""
        pass

    def tick(self, dt: float) -> None:
        """Advance time step (e.g. for evaporation)."""
        pass

    def reset(self) -> None:
        """Reset internal state."""
        pass
