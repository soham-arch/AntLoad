from __future__ import annotations
import math
import random
from typing import List, Dict, Optional, Set, Any
import numpy as np
from backend.models.schemas import (
    SimulationConfig,
    SimulationState,
    NodeMetrics,
    InferenceRequest,
    RoutingDecision,
    MetricsSnapshot,
    AlgorithmType,
    AlgorithmResult,
    LatencyTimeSeriesPoint,
    UtilizationTimeSeriesPoint,
    QueueTimeSeriesPoint,
)
from backend.algorithms import create_router, BaseRouter, compute_heuristic_for_node
from backend.simulation.nodes import create_initial_nodes
from backend.simulation.workload import WorkloadGenerator
from backend.metrics.calculator import (
    calculate_latency_for_request,
    calculate_metrics_snapshot,
)


class ProcessingItem:
    def __init__(
        self,
        request: InferenceRequest,
        node_id: str,
        start_time: float,
        duration: float,
    ) -> None:
        self.request = request
        self.node_id = node_id
        self.start_time = start_time
        self.duration = duration  # in seconds


class SimulationEngine:
    """
    Core event/time-based AI inference load balancing simulation engine.
    Models request arrivals, routing decisions, node execution, queues,
    latency, metric calculations, and algorithm feedback loops.
    """

    def __init__(self, config: SimulationConfig) -> None:
        self.config: SimulationConfig = config.model_copy()
        self.nodes: List[NodeMetrics] = create_initial_nodes(
            count=self.config.node_count,
            heterogeneity=self.config.heterogeneity,
            seed=self.config.seed,
        )
        self.router: BaseRouter = create_router(
            algorithm=self.config.algorithm,
            aco_params=self.config.aco_params,
            weighted_params=self.config.weighted_params,
            seed=self.config.seed,
        )
        self.workload_gen = WorkloadGenerator(
            base_rate=self.config.request_rate,
            pattern=self.config.workload_pattern,
            duration=self.config.duration,
            seed=self.config.seed,
        )
        self.requests: List[InferenceRequest] = []
        self.processing: List[ProcessingItem] = []
        self.recent_decisions: List[RoutingDecision] = []
        self.pheromone_history: List[Dict[str, float]] = []
        self.metrics_history: List[MetricsSnapshot] = []

        self.status: str = "idle"
        self.elapsed_time: float = 0.0
        self.current_request_id: int = 0
        self.request_accumulator: float = 0.0
        self.burst_active: bool = False
        self.burst_timer: float = 0.0
        self.last_snapshot_time: float = 0.0
        self.request_count_since_snapshot: int = 0
        self.degraded_node_ids: Set[str] = set()
        self.rng = random.Random(self.config.seed) if self.config.seed is not None else random.Random()

        self._init_node_states()

    def _init_node_states(self) -> None:
        """Initializes pheromone and heuristic values on nodes."""
        if hasattr(self.router, "get_pheromones"):
            pheromones = self.router.get_pheromones()
        else:
            pheromones = {}

        for n in self.nodes:
            n.heuristic = compute_heuristic_for_node(n)
            n.pheromone = pheromones.get(n.id, 0.5)

    def set_config(self, updates: Dict[str, Any]) -> None:
        """Dynamically updates simulation configuration."""
        old_algo = self.config.algorithm
        old_count = self.config.node_count
        old_hetero = self.config.heterogeneity

        config_dict = self.config.model_dump(by_alias=False)
        config_dict.update(updates)
        self.config = SimulationConfig.model_validate(config_dict)

        if self.config.algorithm != old_algo:
            self.router = create_router(
                algorithm=self.config.algorithm,
                aco_params=self.config.aco_params,
                weighted_params=self.config.weighted_params,
                seed=self.config.seed,
            )
            self._init_node_states()

        if self.config.node_count != old_count or self.config.heterogeneity != old_hetero:
            self.nodes = create_initial_nodes(
                count=self.config.node_count,
                heterogeneity=self.config.heterogeneity,
                seed=self.config.seed,
            )
            self.processing.clear()
            self._init_node_states()

        self.workload_gen = WorkloadGenerator(
            base_rate=self.config.request_rate,
            pattern=self.config.workload_pattern,
            duration=self.config.duration,
            seed=self.config.seed,
        )

    def start(self) -> None:
        if self.status == "completed":
            self.reset()
        self.status = "running"

    def pause(self) -> None:
        self.status = "paused"

    def reset(self) -> None:
        self.status = "idle"
        self.nodes = create_initial_nodes(
            count=self.config.node_count,
            heterogeneity=self.config.heterogeneity,
            seed=self.config.seed,
        )
        self.router = create_router(
            algorithm=self.config.algorithm,
            aco_params=self.config.aco_params,
            weighted_params=self.config.weighted_params,
            seed=self.config.seed,
        )
        self.workload_gen = WorkloadGenerator(
            base_rate=self.config.request_rate,
            pattern=self.config.workload_pattern,
            duration=self.config.duration,
            seed=self.config.seed,
        )
        self.requests.clear()
        self.processing.clear()
        self.recent_decisions.clear()
        self.pheromone_history.clear()
        self.metrics_history.clear()
        self.elapsed_time = 0.0
        self.current_request_id = 0
        self.request_accumulator = 0.0
        self.burst_active = False
        self.burst_timer = 0.0
        self.last_snapshot_time = 0.0
        self.request_count_since_snapshot = 0
        self.degraded_node_ids.clear()
        self.rng = random.Random(self.config.seed) if self.config.seed is not None else random.Random()
        self._init_node_states()

    def inject_burst(self) -> None:
        self.burst_active = True
        self.burst_timer = 5.0

    def degrade_node(self, node_id: str) -> None:
        node = next((n for n in self.nodes if n.id == node_id), None)
        if node:
            node.degraded = True
            node.health = "degraded"
            node.capacity = max(10.0, round(node.capacity * 0.5))
            self.degraded_node_ids.add(node_id)
            node.heuristic = compute_heuristic_for_node(node)

    def restore_node(self, node_id: str) -> None:
        node = next((n for n in self.nodes if n.id == node_id), None)
        if node:
            fresh = create_initial_nodes(
                count=self.config.node_count,
                heterogeneity=self.config.heterogeneity,
                seed=self.config.seed,
            )
            orig = next((fn for fn in fresh if fn.id == node_id), None)
            node.degraded = False
            node.health = "healthy"
            if orig:
                node.capacity = orig.capacity
            self.degraded_node_ids.discard(node_id)
            node.heuristic = compute_heuristic_for_node(node)

    def _generate_and_route_requests(self, dt: float) -> None:
        rate = self.workload_gen.get_current_rate(self.elapsed_time, self.burst_active)
        self.request_accumulator += rate * dt

        while self.request_accumulator >= 1.0:
            self.request_accumulator -= 1.0
            self.current_request_id += 1

            req = self.workload_gen.create_request(self.current_request_id, self.elapsed_time)

            # Update live heuristic and pheromones before routing decision
            pheromones = getattr(self.router, "get_pheromones", lambda: {})()
            for n in self.nodes:
                n.heuristic = compute_heuristic_for_node(n)
                n.pheromone = pheromones.get(n.id, 0.5)

            # Routing decision
            res = self.router.route(self.nodes, req.id)
            req.assigned_node = res.selected_node
            req.status = "processing"
            req.start_time = self.elapsed_time

            assigned_node = next((n for n in self.nodes if n.id == res.selected_node), None)
            if assigned_node:
                assigned_node.active_requests += 1
                assigned_node.queue_length += 1

                # Latency calculation based on compute requirements and node conditions
                latency_ms = calculate_latency_for_request(
                    node=assigned_node,
                    compute_requirement=req.compute_requirement,
                    jitter=self.rng.uniform(0.0, 10.0),
                )
                duration_sec = latency_ms / 1000.0

                self.processing.append(
                    ProcessingItem(
                        request=req,
                        node_id=assigned_node.id,
                        start_time=self.elapsed_time,
                        duration=duration_sec,
                    )
                )

                decision = RoutingDecision(
                    requestId=req.id,
                    algorithm=self.config.algorithm,
                    selectedNode=res.selected_node,
                    probabilities={k: round(v, 4) for k, v in res.probabilities.items()},
                    reasoning=res.reasoning,
                    timestamp=round(self.elapsed_time, 2),
                )
                self.recent_decisions.append(decision)
                if len(self.recent_decisions) > 50:
                    self.recent_decisions = self.recent_decisions[-50:]

            self.requests.append(req)
            if len(self.requests) > 600:
                self.requests = self.requests[-600:]
            self.request_count_since_snapshot += 1

    def _process_completions(self, dt: float) -> None:
        still_processing: List[ProcessingItem] = []

        for item in self.processing:
            if (self.elapsed_time - item.start_time) >= item.duration:
                node = next((n for n in self.nodes if n.id == item.node_id), None)
                if node:
                    # Degradation slightly elevates failure risk
                    success = not node.degraded or (self.rng.random() > 0.15)
                    node.active_requests = max(0, node.active_requests - 1)
                    node.queue_length = max(0, node.queue_length - 1)

                    if success:
                        item.request.status = "completed"
                        item.request.completion_time = self.elapsed_time
                        item.request.latency = round(
                            (self.elapsed_time - item.request.arrival_time) * 1000.0, 1
                        )
                        node.total_processed += 1
                        # Exponential moving average of latency
                        node.average_latency = round(
                            node.average_latency * 0.8 + item.request.latency * 0.2, 1
                        )
                        # Algorithm completion callback (ACO reinforcement)
                        self.router.on_complete(item.node_id, item.request.latency, True)
                    else:
                        item.request.status = "failed"
                        item.request.completion_time = self.elapsed_time
                        item.request.latency = 300.0
                        node.total_failed += 1
                        self.router.on_complete(item.node_id, 300.0, False)
            else:
                still_processing.append(item)

        self.processing = still_processing

    def _update_node_utilization(self) -> None:
        for node in self.nodes:
            # Target utilization based on active requests and node compute capacity
            capacity_divisor = max(1.0, node.capacity / 20.0)
            target_util = min(100.0, (node.active_requests / capacity_divisor) * 100.0)
            node.utilization = round(node.utilization * 0.82 + target_util * 0.18, 1)

            # Throughput in req/s over the last 2 seconds
            recent_completed = [
                r
                for r in self.requests
                if r.assigned_node == node.id
                and r.status == "completed"
                and (self.elapsed_time - r.completion_time) < 2.0
            ]
            node.throughput = round(len(recent_completed) / 2.0, 1)

            # Health classification
            if node.degraded:
                node.health = "degraded"
            elif node.utilization > 90.0 and node.queue_length > 10:
                node.health = "overloaded"
            else:
                node.health = "healthy"

            node.heuristic = compute_heuristic_for_node(node)

    def _take_metrics_snapshot(self) -> None:
        interval_duration = self.elapsed_time - self.last_snapshot_time
        if interval_duration <= 0.0:
            return

        completed = [r for r in self.requests if r.status == "completed"]
        snapshot = calculate_metrics_snapshot(
            nodes=self.nodes,
            completed_requests=completed,
            elapsed_time=self.elapsed_time,
            requests_this_interval=self.request_count_since_snapshot,
            interval_duration=interval_duration,
        )
        self.metrics_history.append(snapshot)
        if len(self.metrics_history) > 120:
            self.metrics_history = self.metrics_history[-120:]

        if hasattr(self.router, "get_pheromones"):
            pheromones = self.router.get_pheromones()
            self.pheromone_history.append(pheromones)
            if len(self.pheromone_history) > 120:
                self.pheromone_history = self.pheromone_history[-120:]

        self.last_snapshot_time = self.elapsed_time
        self.request_count_since_snapshot = 0

    def tick(self, dt: float = 0.1) -> None:
        if self.status != "running":
            return

        dt = min(0.5, max(0.01, dt))
        self.elapsed_time += dt

        if self.burst_active:
            self.burst_timer -= dt
            if self.burst_timer <= 0:
                self.burst_active = False

        # Evaporation for ACO
        self.router.tick(dt)

        self._generate_and_route_requests(dt)
        self._process_completions(dt)
        self._update_node_utilization()

        if (self.elapsed_time - self.last_snapshot_time) >= 0.5:
            self._take_metrics_snapshot()

        if self.elapsed_time >= self.config.duration:
            self.status = "completed"
            self._take_metrics_snapshot()

    def get_state(self) -> SimulationState:
        pheromones = getattr(self.router, "get_pheromones", lambda: {})()
        for n in self.nodes:
            n.heuristic = compute_heuristic_for_node(n)
            n.pheromone = pheromones.get(n.id, 0.5)

        completed_count = sum(1 for r in self.requests if r.status == "completed")
        failed_count = sum(1 for r in self.requests if r.status == "failed")

        return SimulationState(
            status=self.status,  # type: ignore
            config=self.config,
            nodes=[n.model_copy() for n in self.nodes],
            requests=[r.model_copy() for r in self.requests],
            recentDecisions=[d.model_copy() for d in self.recent_decisions],
            pheromoneHistory=list(self.pheromone_history),
            metricsHistory=[m.model_copy() for m in self.metrics_history],
            elapsedTime=round(self.elapsed_time, 2),
            totalRequests=len(self.requests),
            completedRequests=completed_count,
            failedRequests=failed_count,
            currentRequestId=self.current_request_id,
        )

    @classmethod
    def run_full_simulation(
        cls,
        base_config: SimulationConfig,
        algorithm: AlgorithmType,
        degrade_node_id: Optional[str] = None,
        seed: Optional[int] = 42,
    ) -> AlgorithmResult:
        """
        Executes a complete, reproducible simulation synchronously.
        Essential for fair multi-algorithm benchmarking under identical workloads.
        """
        config = base_config.model_copy()
        config.algorithm = algorithm
        config.seed = seed

        engine = cls(config)
        engine.start()

        dt = 0.1
        steps = math.ceil(config.duration / dt)

        degrade_step = int(steps * 0.35) if degrade_node_id else -1

        for step in range(steps):
            if step == degrade_step and degrade_node_id:
                engine.degrade_node(degrade_node_id)
            engine.tick(dt)

        nodes = engine.nodes
        completed_requests = [r for r in engine.requests if r.status == "completed"]
        failed_requests = [r for r in engine.requests if r.status == "failed"]
        total_requests = len(engine.requests)

        latencies = [r.latency for r in completed_requests if r.latency > 0]
        if latencies:
            latencies_sorted = sorted(latencies)
            avg_latency = float(np.mean(latencies))
            p50_lat = float(np.percentile(latencies_sorted, 50))
            p95_lat = float(np.percentile(latencies_sorted, 95))
        else:
            avg_latency = 0.0
            p50_lat = 0.0
            p95_lat = 0.0

        throughput = len(completed_requests) / config.duration if config.duration > 0 else 0.0
        gpu_util = float(np.mean([n.utilization for n in nodes])) if nodes else 0.0
        load_var = float(np.var([n.utilization for n in nodes])) if nodes else 0.0
        load_balance_score = float(max(0.0, 100.0 - math.sqrt(load_var) * 1.5))
        total_queue = sum(n.queue_length for n in nodes)
        completion_rate = len(completed_requests) / total_requests if total_requests > 0 else 0.0

        # Distribution percentage across nodes
        total_assigned = len(completed_requests) + len(failed_requests)
        distribution: Dict[str, float] = {}
        for n in nodes:
            assigned = sum(1 for r in engine.requests if r.assigned_node == n.id)
            distribution[n.id] = (
                round((assigned / total_assigned) * 100.0, 1) if total_assigned > 0 else 0.0
            )

        latency_over_time = [
            LatencyTimeSeriesPoint(time=m.timestamp, latency=m.average_latency)
            for m in engine.metrics_history
        ]
        util_over_time = [
            UtilizationTimeSeriesPoint(time=m.timestamp, utilization=m.gpu_utilization)
            for m in engine.metrics_history
        ]
        queue_over_time = [
            QueueTimeSeriesPoint(time=m.timestamp, queueLength=m.total_queue_length)
            for m in engine.metrics_history
        ]

        return AlgorithmResult(
            algorithm=algorithm,
            averageLatency=round(avg_latency, 1),
            p50Latency=round(p50_lat, 1),
            p95Latency=round(p95_lat, 1),
            throughput=round(throughput, 1),
            gpuUtilization=round(gpu_util, 1),
            loadVariance=round(load_var, 2),
            loadBalanceScore=round(load_balance_score, 1),
            queueLength=total_queue,
            completionRate=round(completion_rate, 3),
            totalRequests=total_requests,
            completedRequests=len(completed_requests),
            failedRequests=len(failed_requests),
            latencyOverTime=latency_over_time,
            utilizationOverTime=util_over_time,
            queueOverTime=queue_over_time,
            distribution=distribution,
        )
