from __future__ import annotations
import math
import random
from typing import Tuple, Optional
from backend.models.schemas import (
    InferenceRequest,
    RequestComplexity,
    WorkloadPattern,
)


COMPLEXITY_PROFILES = {
    "light": {
        "compute_multiplier": 0.3,
        "latency_base": 40.0,
        "base_compute": 30.0,
    },
    "medium": {
        "compute_multiplier": 0.7,
        "latency_base": 90.0,
        "base_compute": 70.0,
    },
    "heavy": {
        "compute_multiplier": 1.5,
        "latency_base": 200.0,
        "base_compute": 150.0,
    },
}


class WorkloadGenerator:
    """
    Generates dynamic AI inference requests with varying complexities and arrival rates.
    Deterministic when initialized with a random seed.
    """

    def __init__(
        self,
        base_rate: float = 50.0,
        pattern: WorkloadPattern = "mixed",
        duration: float = 30.0,
        seed: Optional[int] = None,
    ) -> None:
        self.base_rate = base_rate
        self.pattern = pattern
        self.duration = duration
        self.rng = random.Random(seed) if seed is not None else random.Random()

    def get_current_rate(self, elapsed_time: float, is_burst: bool = False) -> float:
        """Calculates instantaneous request arrival rate at time t."""
        if is_burst:
            return min(250.0, self.base_rate * 3.5)

        t = elapsed_time
        total_duration = max(1.0, self.duration)

        if self.pattern == "stable":
            return self.base_rate
        elif self.pattern == "bursty":
            # Oscillating periodic traffic bursts with quiet intervals
            cycle = (math.sin(t * 0.8) + 1.0) / 2.0  # 0 to 1
            burst = 2.5 if (int(t) % 6 < 2) else 0.4
            return self.base_rate * (0.4 + 0.6 * cycle) * burst
        elif self.pattern == "increasing":
            progress = min(1.0, t / total_duration)
            return self.base_rate * (0.3 + 1.2 * progress)
        elif self.pattern == "decreasing":
            progress = min(1.0, t / total_duration)
            return max(5.0, self.base_rate * (1.2 - 0.9 * progress))
        elif self.pattern == "random":
            return max(5.0, self.base_rate * (0.4 + 1.2 * self.rng.random()))
        elif self.pattern == "heavy":
            return self.base_rate * 0.85
        elif self.pattern == "mixed":
            return self.base_rate * (0.75 + 0.35 * math.sin(t * 0.5))
        else:
            return self.base_rate

    def pick_complexity(self) -> RequestComplexity:
        """Selects request complexity based on workload pattern distribution."""
        r = self.rng.random()
        if self.pattern == "heavy":
            return "heavy" if r < 0.65 else ("medium" if r < 0.90 else "light")
        elif self.pattern == "mixed":
            # 35% light, 45% medium, 20% heavy
            return "light" if r < 0.35 else ("medium" if r < 0.80 else "heavy")
        else:
            # Default general distribution: 40% light, 40% medium, 20% heavy
            return "light" if r < 0.40 else ("medium" if r < 0.80 else "heavy")

    def create_request(self, request_id: int, arrival_time: float) -> InferenceRequest:
        """Creates a single new inference request with calculated compute requirement."""
        complexity = self.pick_complexity()
        profile = COMPLEXITY_PROFILES[complexity]
        compute_req = profile["compute_multiplier"] * (50.0 + self.rng.uniform(0.0, 50.0))

        return InferenceRequest(
            id=request_id,
            arrivalTime=round(arrival_time, 3),
            complexity=complexity,
            computeRequirement=round(compute_req, 2),
            assignedNode=None,
            startTime=0.0,
            completionTime=0.0,
            latency=0.0,
            status="queued",
        )
