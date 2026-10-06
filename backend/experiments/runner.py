from __future__ import annotations
from typing import List, Dict, Optional
from backend.models.schemas import (
    ExperimentConfig,
    ExperimentResult,
    AlgorithmResult,
    AlgorithmType,
    SimulationConfig,
    RankingItem,
)
from backend.simulation.engine import SimulationEngine


PREDEFINED_EXPERIMENTS: Dict[str, ExperimentConfig] = {
    "exp1-stable": ExperimentConfig(
        id="exp1-stable",
        name="Stable Workload",
        description="Constant request rate with mixed complexity. Establishes baseline performance under steady-state conditions.",
        workloadPattern="stable",
        requestRate=50.0,
        duration=30.0,
        nodeCount=3,
        heterogeneity="high",
        seed=101,
    ),
    "exp2-burst": ExperimentConfig(
        id="exp2-burst",
        name="Sudden Traffic Burst",
        description="Simulates a sudden increase in inference traffic to evaluate how quickly each routing strategy adapts to load spikes.",
        workloadPattern="bursty",
        requestRate=60.0,
        duration=30.0,
        nodeCount=3,
        heterogeneity="high",
        seed=102,
    ),
    "exp3-heterogeneous": ExperimentConfig(
        id="exp3-heterogeneous",
        name="Heterogeneous GPU Cluster",
        description="Highly diverse GPU cluster with varying capacities. Tests whether algorithms account for node heterogeneity in routing decisions.",
        workloadPattern="mixed",
        requestRate=50.0,
        duration=30.0,
        nodeCount=5,
        heterogeneity="high",
        seed=103,
    ),
    "exp4-degradation": ExperimentConfig(
        id="exp4-degradation",
        name="Node Performance Degradation",
        description="One node degrades mid-experiment. Evaluates how quickly each algorithm detects the degradation and reroutes traffic away from the affected node.",
        workloadPattern="mixed",
        requestRate=50.0,
        duration=30.0,
        nodeCount=3,
        heterogeneity="high",
        degradeNode="GPU-01",
        seed=104,
    ),
    "exp5-increasing": ExperimentConfig(
        id="exp5-increasing",
        name="Increasing Workload",
        description="Request rate ramps up over time. Tests behavior under sustained rising load and whether algorithms can prevent cascading overload.",
        workloadPattern="increasing",
        requestRate=80.0,
        duration=30.0,
        nodeCount=3,
        heterogeneity="high",
        seed=105,
    ),
    "exp6-mixed-complexity": ExperimentConfig(
        id="exp6-mixed-complexity",
        name="Mixed Request Complexity",
        description="Realistic blend of light, medium, and heavy inference requests. General-purpose evaluation mimicking production AI inference traffic.",
        workloadPattern="mixed",
        requestRate=55.0,
        duration=30.0,
        nodeCount=4,
        heterogeneity="medium",
        seed=106,
    ),
}


class ExperimentRunner:
    """
    Executes controlled experiments comparing all 4 routing algorithms under identical workload conditions.
    """

    ALGORITHMS: List[AlgorithmType] = [
        "round-robin",
        "least-requests",
        "weighted",
        "aco",
    ]

    @classmethod
    def run_experiment(cls, exp_config: ExperimentConfig) -> ExperimentResult:
        base_sim_config = SimulationConfig(
            algorithm="aco",
            workloadPattern=exp_config.workload_pattern,
            requestRate=exp_config.request_rate,
            nodeCount=exp_config.node_count,
            heterogeneity=exp_config.heterogeneity,
            duration=exp_config.duration,
            seed=exp_config.seed or 42,
        )

        results: List[AlgorithmResult] = []
        for algo in cls.ALGORITHMS:
            # Identical seed and workload configuration for every algorithm
            res = SimulationEngine.run_full_simulation(
                base_config=base_sim_config,
                algorithm=algo,
                degrade_node_id=exp_config.degrade_node,
                seed=exp_config.seed or 42,
            )
            results.append(res)

        # Identify genuine metric leaders (no hardcoding!)
        best_latency = min(results, key=lambda r: r.average_latency).algorithm
        best_throughput = max(results, key=lambda r: r.throughput).algorithm
        best_load_balance = max(results, key=lambda r: r.load_balance_score).algorithm
        lowest_p95 = min(results, key=lambda r: r.p95_latency).algorithm
        best_utilization = max(results, key=lambda r: r.gpu_utilization).algorithm

        # Multi-objective composite score:
        # Lower latency is better (1 / (lat + 1))
        # Higher throughput is better
        # Higher load balance is better
        # Lower P95 tail latency is better
        scored_items = []
        for r in results:
            score = (
                (1.0 / (r.average_latency + 1.0)) * 30.0
                + (r.throughput / 100.0) * 25.0
                + (r.load_balance_score / 100.0) * 25.0
                + (1.0 / (r.p95_latency + 1.0)) * 20.0
            )
            scored_items.append({"algorithm": r.algorithm, "score": round(score, 4)})

        scored_items.sort(key=lambda x: x["score"], reverse=True)
        rankings = [
            RankingItem(
                algorithm=item["algorithm"],
                score=item["score"],
                rank=idx + 1,
            )
            for idx, item in enumerate(scored_items)
        ]

        insight = cls._generate_scientific_insight(
            config=exp_config,
            results=results,
            best_latency=best_latency,
            best_load_balance=best_load_balance,
        )

        return ExperimentResult(
            config=exp_config,
            results=results,
            bestLatency=best_latency,
            bestThroughput=best_throughput,
            bestLoadBalance=best_load_balance,
            lowestP95=lowest_p95,
            bestUtilization=best_utilization,
            insight=insight,
            rankings=rankings,
        )

    @classmethod
    def _generate_scientific_insight(
        cls,
        config: ExperimentConfig,
        results: List[AlgorithmResult],
        best_latency: AlgorithmType,
        best_load_balance: AlgorithmType,
    ) -> str:
        aco_res = next(r for r in results if r.algorithm == "aco")
        best_lat_res = next(r for r in results if r.algorithm == best_latency)
        rr_res = next(r for r in results if r.algorithm == "round-robin")

        parts: List[str] = []

        # Latency evaluation
        if best_latency == "aco":
            parts.append(
                f"Workload-aware ACO achieved the lowest average latency ({aco_res.average_latency:.1f}ms) under '{config.name}' conditions. "
                "The combination of historical pheromone trails and live queue heuristics effectively avoided saturating lower-capacity GPUs."
            )
        elif best_latency == "weighted":
            parts.append(
                f"Weighted Workload routing achieved the lowest average latency ({best_lat_res.average_latency:.1f}ms). "
                "In this scenario, immediate deterministic multi-factor scoring proved more responsive than probabilistic pheromone convergence."
            )
        elif best_latency == "least-requests":
            parts.append(
                f"Least Outstanding Requests achieved the lowest average latency ({best_lat_res.average_latency:.1f}ms). "
                "Direct concurrency tracking effectively mitigated queue formation without needing multi-parameter tuning."
            )
        else:
            parts.append(
                f"Round Robin routing achieved the lowest average latency ({best_lat_res.average_latency:.1f}ms). "
                "Uniform cyclic distribution maintained balanced throughput under this specific workload distribution."
            )

        # Load balance evaluation
        if best_load_balance == "aco":
            parts.append(
                f"ACO also maintained superior load balancing (score: {aco_res.load_balance_score:.1f}%), dynamically adjusting routing probabilities as pheromone evaporated on congested nodes."
            )
        else:
            best_lb_res = next(r for r in results if r.algorithm == best_load_balance)
            parts.append(
                f"{best_load_balance.replace('-', ' ').title()} achieved the strongest load balance score ({best_lb_res.load_balance_score:.1f}%)."
            )

        # Degradation reaction
        if config.degrade_node:
            if best_latency == "aco" or best_load_balance == "aco":
                parts.append(
                    f"When node {config.degrade_node} experienced capacity degradation, ACO's pheromone evaporation allowed it to gradually taper traffic without causing abrupt thundering herd effects on alternative nodes."
                )
            else:
                parts.append(
                    f"Under simulated degradation of node {config.degrade_node}, {best_latency.replace('-', ' ').title()} reacted rapidly to the shifted capacity profile."
                )

        return " ".join(parts)
