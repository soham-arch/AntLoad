from __future__ import annotations
import random
from typing import List, Dict, Optional, Tuple
from backend.models.schemas import NodeMetrics, HeterogeneityLevel, NodeHealth


GPU_PROFILES: Dict[HeterogeneityLevel, List[Dict[str, float | str]]] = {
    "low": [
        {"name": "RTX 4090", "capacity": 100.0},
        {"name": "RTX 4090", "capacity": 95.0},
        {"name": "RTX 4090", "capacity": 100.0},
        {"name": "RTX 4090", "capacity": 95.0},
        {"name": "RTX 4090", "capacity": 100.0},
        {"name": "RTX 4090", "capacity": 95.0},
        {"name": "RTX 4090", "capacity": 100.0},
        {"name": "RTX 4090", "capacity": 95.0},
    ],
    "medium": [
        {"name": "RTX 4090", "capacity": 100.0},
        {"name": "RTX 3090", "capacity": 75.0},
        {"name": "RTX 4090", "capacity": 95.0},
        {"name": "RTX 3080", "capacity": 65.0},
        {"name": "RTX 3090", "capacity": 75.0},
        {"name": "RTX 4090", "capacity": 100.0},
        {"name": "RTX 3080", "capacity": 65.0},
        {"name": "RTX 3090", "capacity": 75.0},
    ],
    "high": [
        {"name": "RTX 4090", "capacity": 100.0},
        {"name": "RTX 3090", "capacity": 75.0},
        {"name": "RTX 3060", "capacity": 45.0},
        {"name": "A100 80GB", "capacity": 120.0},
        {"name": "RTX 3080", "capacity": 60.0},
        {"name": "T4", "capacity": 35.0},
        {"name": "RTX 4080", "capacity": 85.0},
        {"name": "RTX 3050", "capacity": 30.0},
    ],
}


def create_initial_nodes(
    count: int = 3,
    heterogeneity: HeterogeneityLevel = "high",
    seed: Optional[int] = None,
) -> List[NodeMetrics]:
    """
    Creates heterogeneous simulated inference nodes according to requested count and profile.
    Deterministic initial state if seed is provided.
    """
    rng = random.Random(seed) if seed is not None else random.Random(42)
    profiles = GPU_PROFILES.get(heterogeneity, GPU_PROFILES["high"])

    nodes: List[NodeMetrics] = []
    for i in range(count):
        profile = profiles[i % len(profiles)]
        node_id = f"GPU-{str(i + 1).zfill(2)}"
        # Baseline utilization around 20-30%
        init_util = 20.0 + rng.uniform(0.0, 10.0)
        init_lat = 50.0 + rng.uniform(0.0, 30.0)

        nodes.append(
            NodeMetrics(
                id=node_id,
                gpuName=str(profile["name"]),
                capacity=float(profile["capacity"]),
                utilization=round(init_util, 1),
                queueLength=0,
                activeRequests=0,
                averageLatency=round(init_lat, 1),
                throughput=0.0,
                pheromone=0.5,
                heuristic=0.5,
                health="healthy",
                degraded=False,
                totalProcessed=0,
                totalFailed=0,
            )
        )
    return nodes
