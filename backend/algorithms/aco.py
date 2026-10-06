from __future__ import annotations
import math
import random
from typing import List, Dict, Optional, Tuple
from backend.models.schemas import NodeMetrics, AlgorithmType, ACOParams
from backend.algorithms.base import (
    BaseRouter,
    RoutingResult,
    get_healthy_nodes,
    normalize_utilization,
    compute_heuristic_for_node,
)


class ACORouter(BaseRouter):
    """
    Workload-Aware Ant Colony Optimization (ACO) Load Balancing Router.
    
    Principles:
      - Historical Routing Quality (Pheromone τ_i): Updated upon inference completion based on actual latency.
      - Real-Time Desirability (Heuristic η_i): Normalized multi-factor fitness of node's immediate state.
      - Probability Formulation:
            P_i = (τ_i^α * η_i^β) / Σ_j (τ_j^α * η_j^β)
      - Pheromone Evaporation:
            τ_i(t + dt) = max(τ_min, τ_i(t) * (1 - ρ))
      - Pheromone Reinforcement:
            Δτ = Q * max(0.1, 1 - Latency / RefLatency)
            τ_i(new) = min(τ_max, τ_i + Δτ)
    """
    algorithm_type: AlgorithmType = "aco"

    TAU_MIN: float = 0.01
    TAU_MAX: float = 5.0
    DEFAULT_TAU: float = 0.5
    REFERENCE_LATENCY_MS: float = 300.0

    def __init__(
        self,
        params: Optional[ACOParams] = None,
        seed: Optional[int] = None,
    ) -> None:
        self.params: ACOParams = params or ACOParams()
        self.pheromones: Dict[str, float] = {}
        self.rng = random.Random(seed) if seed is not None else random.Random()
        self.last_update_info: Dict[str, float] = {}

    def set_seed(self, seed: Optional[int]) -> None:
        self.rng = random.Random(seed) if seed is not None else random.Random()

    def set_params(self, params: ACOParams) -> None:
        self.params = params

    def get_params(self) -> ACOParams:
        return self.params

    def get_pheromones(self) -> Dict[str, float]:
        return {k: round(v, 4) for k, v in self.pheromones.items()}

    def set_pheromones(self, p: Dict[str, float]) -> None:
        self.pheromones = {
            k: max(self.TAU_MIN, min(self.TAU_MAX, float(v))) for k, v in p.items()
        }

    def ensure_pheromones(self, nodes: List[NodeMetrics]) -> None:
        """Initialize pheromone for any new node."""
        for n in nodes:
            if n.id not in self.pheromones:
                self.pheromones[n.id] = self.DEFAULT_TAU

    def compute_heuristic(self, node: NodeMetrics) -> float:
        """
        Workload-aware heuristic desirability η_i in range [0.01, 1.0].
        Calculated from instantaneous node state.
        """
        return compute_heuristic_for_node(node)

    def route(self, nodes: List[NodeMetrics], request_id: int) -> RoutingResult:
        self.ensure_pheromones(nodes)
        healthy = get_healthy_nodes(nodes)
        if not healthy:
            fallback = nodes[0].id if nodes else "GPU-01"
            return RoutingResult(
                selected_node=fallback,
                probabilities={},
                reasoning=["No healthy nodes available."],
            )

        # Calculate τ_i^α * η_i^β for each candidate
        candidates: List[Dict[str, float | NodeMetrics]] = []
        raw_weights: List[float] = []

        for n in healthy:
            tau = self.pheromones.get(n.id, self.DEFAULT_TAU)
            eta = self.compute_heuristic(n)

            # Prevent underflow / zero
            safe_tau = max(self.TAU_MIN, tau)
            safe_eta = max(0.01, eta)

            # Weight calculation with exponent bounds to prevent overflow
            alpha = max(0.0, min(10.0, self.params.alpha))
            beta = max(0.0, min(10.0, self.params.beta))

            weight = (safe_tau ** alpha) * (safe_eta ** beta)
            weight = max(1e-9, weight)
            raw_weights.append(weight)

            candidates.append({
                "node": n,
                "id": n.id,
                "tau": safe_tau,
                "eta": safe_eta,
                "weight": weight,
            })

        total_weight = sum(raw_weights)
        probabilities: Dict[str, float] = {}
        for c in candidates:
            nid = str(c["id"])
            w = float(c["weight"])
            probabilities[nid] = w / total_weight if total_weight > 0 else 1.0 / len(healthy)

        # Stochastic selection proportional to probability distribution
        r = self.rng.random()
        cumulative = 0.0
        selected_candidate = candidates[0]

        for c in candidates:
            nid = str(c["id"])
            prob = probabilities[nid]
            cumulative += prob
            if r <= cumulative or c == candidates[-1]:
                selected_candidate = c
                break

        selected_node: NodeMetrics = selected_candidate["node"]  # type: ignore
        selected_tau = float(selected_candidate["tau"])
        selected_eta = float(selected_candidate["eta"])
        selected_prob = probabilities[selected_node.id]

        # Construct transparent reasoning explaining the ACO decision
        reasoning = [
            f"ACO Choice: Selected {selected_node.id} ({selected_node.gpu_name}) with probability P={selected_prob * 100:.1f}%.",
            f"Node Status: Pheromone (τ)={selected_tau:.3f}, Heuristic (η)={selected_eta:.3f}, Parameters: α={self.params.alpha:.1f}, β={self.params.beta:.1f}.",
        ]

        if selected_eta > 0.65:
            reasoning.append("High instantaneous desirability: node has low queue and favorable capacity-to-load ratio.")
        elif selected_tau > 0.65:
            reasoning.append("High pheromone trail: node has a strong historical track record of fast completions.")
        else:
            reasoning.append("Balanced exploration: stochastic routing selected this path based on combined trail and heuristic weights.")

        if selected_node.degraded:
            reasoning.append("Node is degraded: heuristic was penalized, but pheromone will further decay if latency increases.")

        return RoutingResult(
            selected_node=selected_node.id,
            probabilities=probabilities,
            reasoning=reasoning,
        )

    def on_complete(self, node_id: str, latency: float, success: bool) -> None:
        """
        ACO Pheromone Reinforcement Rule:
        Successful completion deposits pheromone inversely related to execution latency.
        Failures deposit no reinforcement.
        """
        current_tau = self.pheromones.get(node_id, self.DEFAULT_TAU)
        if success:
            # Latency efficiency factor: lower latency -> higher reward
            efficiency = max(0.1, 1.0 - (latency / self.REFERENCE_LATENCY_MS))
            reward = self.params.reinforcement_base * efficiency
            new_tau = min(self.TAU_MAX, current_tau + reward)
            self.last_update_info[node_id] = reward
        else:
            # Penalty or zero deposit
            new_tau = max(self.TAU_MIN, current_tau * 0.8)
            self.last_update_info[node_id] = 0.0

        self.pheromones[node_id] = new_tau

    def tick(self, dt: float) -> None:
        """
        ACO Pheromone Evaporation:
        Simulates information decay over elapsed time.
        """
        # Evaporation rate adjusted by dt (e.g. rate per second)
        evap_factor = max(0.0, min(1.0, 1.0 - (self.params.evaporation_rate * dt)))
        for nid in list(self.pheromones.keys()):
            self.pheromones[nid] = max(
                self.TAU_MIN, self.pheromones[nid] * evap_factor
            )

    def reset(self) -> None:
        self.pheromones = {}
        self.last_update_info = {}
