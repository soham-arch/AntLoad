from __future__ import annotations
from typing import List, Dict, Tuple, Optional
from backend.models.schemas import NodeMetrics, AlgorithmType, WeightedParams
from backend.algorithms.base import (
    BaseRouter,
    RoutingResult,
    get_healthy_nodes,
    normalize_utilization,
)


class WeightedWorkloadRouter(BaseRouter):
    """
    Weighted Workload-Based Routing Algorithm.
    Scores each node using a normalized multi-criteria formula combining:
      - Resource utilization (lower is better)
      - Queue length penalty (lower is better)
      - Average latency penalty (lower is better)
      - Computational capacity bonus (higher is better)
      - Degradation penalty (if node is degraded)
    """
    algorithm_type: AlgorithmType = "weighted"

    def __init__(self, params: Optional[WeightedParams] = None) -> None:
        self.params = params or WeightedParams()

    def set_params(self, params: WeightedParams) -> None:
        self.params = params

    def get_params(self) -> WeightedParams:
        return self.params

    def compute_node_score(self, node: NodeMetrics) -> Tuple[float, Dict[str, float]]:
        """
        Calculates normalized composite score and component factors.
        Returns: (final_score, breakdown_dict)
        """
        util_norm = normalize_utilization(node)
        queue_norm = min(1.0, max(0.0, node.queue_length / 20.0))
        latency_norm = min(1.0, max(0.0, node.average_latency / 300.0))
        capacity_norm = max(0.1, node.capacity / 100.0)
        degraded_pen = 0.3 if node.degraded else 0.0

        # Term calculation:
        # High utilization -> high penalty (term = 1 - util_norm)
        # High queue -> high penalty (term = 1 - queue_norm)
        # High latency -> high penalty (term = 1 - latency_norm)
        # High capacity -> bonus
        term_util = self.params.w_utilization * (1.0 - util_norm)
        term_queue = self.params.w_queue * (1.0 - queue_norm)
        term_latency = self.params.w_latency * (1.0 - latency_norm)
        term_capacity = self.params.w_capacity * capacity_norm

        raw_score = term_util + term_queue + term_latency + term_capacity - degraded_pen
        score = max(0.001, raw_score)

        breakdown = {
            "util_norm": util_norm,
            "queue_norm": queue_norm,
            "latency_norm": latency_norm,
            "capacity_norm": capacity_norm,
            "term_util": term_util,
            "term_queue": term_queue,
            "term_latency": term_latency,
            "term_capacity": term_capacity,
            "degraded_pen": degraded_pen,
            "final_score": score,
        }
        return score, breakdown

    def route(self, nodes: List[NodeMetrics], request_id: int) -> RoutingResult:
        healthy = get_healthy_nodes(nodes)
        if not healthy:
            fallback = nodes[0].id if nodes else "GPU-01"
            return RoutingResult(
                selected_node=fallback,
                probabilities={},
                reasoning=["No healthy nodes available."],
            )

        scored_nodes = []
        for n in healthy:
            score, breakdown = self.compute_node_score(n)
            scored_nodes.append((score, n.id, n, breakdown))

        # Sort descending by score, tie-break by node.id
        scored_nodes.sort(key=lambda x: (-x[0], x[1]))
        best_score, selected_id, selected_node, best_breakdown = scored_nodes[0]

        total_score = sum(item[0] for item in scored_nodes)
        probabilities: Dict[str, float] = {}
        for score, nid, _, _ in scored_nodes:
            probabilities[nid] = score / total_score if total_score > 0 else 1.0 / len(healthy)

        reasoning = [
            f"Selected {selected_node.id} ({selected_node.gpu_name}) with highest composite score {best_score:.3f}.",
            f"Metrics breakdown: Util={selected_node.utilization:.1f}% (penalty={best_breakdown['util_norm']:.2f}), "
            f"Queue={selected_node.queue_length} (penalty={best_breakdown['queue_norm']:.2f}), "
            f"Latency={selected_node.average_latency:.0f}ms (penalty={best_breakdown['latency_norm']:.2f}), "
            f"Capacity={selected_node.capacity:.0f} (bonus={best_breakdown['capacity_norm']:.2f}).",
        ]
        if selected_node.degraded:
            reasoning.append("Warning: Node is degraded (applied 0.30 penalty to composite score).")

        return RoutingResult(
            selected_node=selected_id,
            probabilities=probabilities,
            reasoning=reasoning,
        )

    def reset(self) -> None:
        pass
