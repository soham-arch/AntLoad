from __future__ import annotations
from typing import List, Dict
from backend.models.schemas import NodeMetrics, AlgorithmType
from backend.algorithms.base import BaseRouter, RoutingResult, get_healthy_nodes


class LeastRequestsRouter(BaseRouter):
    """
    Least Outstanding Requests / Least Loaded routing algorithm.
    Selects the node with the lowest number of active and queued requests.
    Ties broken deterministically by node id order.
    """
    algorithm_type: AlgorithmType = "least-requests"

    def route(self, nodes: List[NodeMetrics], request_id: int) -> RoutingResult:
        healthy = get_healthy_nodes(nodes)
        if not healthy:
            fallback = nodes[0].id if nodes else "GPU-01"
            return RoutingResult(
                selected_node=fallback,
                probabilities={},
                reasoning=["No healthy nodes available."],
            )

        # Calculate outstanding requests: active + queue
        # Sort by (outstanding_requests, node.id) for deterministic tie-breaking
        node_loads = [
            (n.active_requests + n.queue_length, n.id, n) for n in healthy
        ]
        node_loads.sort(key=lambda item: (item[0], item[1]))

        selected_load, selected_id, selected_node = node_loads[0]

        total_outstanding = sum(item[0] for item in node_loads)
        probabilities: Dict[str, float] = {}

        if total_outstanding == 0:
            # All idle -> equal distribution
            for n in healthy:
                probabilities[n.id] = 1.0 / len(healthy)
        else:
            # Inverse weighting: nodes with fewer outstanding requests have higher probability
            inv_weights = {
                n.id: 1.0 / (1.0 + (n.active_requests + n.queue_length))
                for n in healthy
            }
            sum_inv = sum(inv_weights.values())
            for n in healthy:
                probabilities[n.id] = inv_weights[n.id] / sum_inv

        reasoning = [
            f"{selected_node.id} ({selected_node.gpu_name}) has {selected_load} outstanding requests (active={selected_node.active_requests}, queue={selected_node.queue_length}), the lowest among active nodes.",
            "Least Outstanding Requests balances instantaneous concurrency without evaluating hardware compute capacity or latency history.",
        ]

        return RoutingResult(
            selected_node=selected_id,
            probabilities=probabilities,
            reasoning=reasoning,
        )

    def reset(self) -> None:
        pass
