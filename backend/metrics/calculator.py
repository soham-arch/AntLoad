from __future__ import annotations
import math
from typing import List, Dict, Tuple, Optional
import numpy as np
from backend.models.schemas import (
    NodeMetrics,
    InferenceRequest,
    MetricsSnapshot,
    KPIMetrics,
    RoutingDecision,
)


def calculate_latency_for_request(
    node: NodeMetrics,
    compute_requirement: float,
    jitter: float = 0.0,
) -> float:
    """
    Computes genuine simulated execution latency (ms) for a request on a specific node.
    
    Formula factors:
      - Base compute latency: proportional to compute_requirement
      - Queue delay: proportional to pending queue
      - Node concurrency delay: proportional to current utilization
      - Node capacity scaling: 100 / capacity
      - Node degradation multiplier: 1.8x if degraded
    """
    base_latency = 30.0 + compute_requirement * 0.8
    queue_delay = node.queue_length * 8.0
    util_delay = (node.utilization / 100.0) * 40.0
    capacity_factor = 100.0 / max(10.0, node.capacity)
    degraded_mult = 1.8 if node.degraded else 1.0

    latency = (base_latency + queue_delay + util_delay) * capacity_factor * degraded_mult + jitter
    return float(max(10.0, latency))


def calculate_metrics_snapshot(
    nodes: List[NodeMetrics],
    completed_requests: List[InferenceRequest],
    elapsed_time: float,
    requests_this_interval: int,
    interval_duration: float,
) -> MetricsSnapshot:
    """
    Computes a snapshot of live metrics over the latest observation window.
    All calculations are directly derived from actual completed requests and live nodes.
    """
    latencies = [r.latency for r in completed_requests if r.latency > 0]

    if latencies:
        avg_latency = float(np.mean(latencies))
        p50_latency = float(np.percentile(latencies, 50))
        p95_latency = float(np.percentile(latencies, 95))
    else:
        avg_latency = 0.0
        p50_latency = 0.0
        p95_latency = 0.0

    throughput = requests_this_interval / interval_duration if interval_duration > 0 else 0.0

    if nodes:
        gpu_util = float(np.mean([n.utilization for n in nodes]))
        load_var = float(np.var([n.utilization for n in nodes]))
        total_queue = sum(n.queue_length for n in nodes)
    else:
        gpu_util = 0.0
        load_var = 0.0
        total_queue = 0

    load_balance_score = float(max(0.0, 100.0 - math.sqrt(load_var) * 1.5))

    return MetricsSnapshot(
        timestamp=round(elapsed_time, 2),
        averageLatency=round(avg_latency, 1),
        p50Latency=round(p50_latency, 1),
        p95Latency=round(p95_latency, 1),
        throughput=round(throughput, 1),
        gpuUtilization=round(gpu_util, 1),
        loadVariance=round(load_var, 2),
        loadBalanceScore=round(load_balance_score, 1),
        totalQueueLength=total_queue,
        requestsPerSec=round(throughput, 1),
        completedRequests=len(completed_requests),
    )


def calculate_kpi_metrics(
    nodes: List[NodeMetrics],
    recent_requests: List[InferenceRequest],
    recent_decisions: List[RoutingDecision],
    window_seconds: float = 5.0,
) -> KPIMetrics:
    """Computes top-level KPI metrics for the live dashboard."""
    active_nodes = len([n for n in nodes if n.health != "offline"])
    recent_completed = [r for r in recent_requests if r.status == "completed" and r.latency > 0]

    latencies = [r.latency for r in recent_completed]
    avg_latency = float(np.mean(latencies)) if latencies else 0.0

    if nodes:
        gpu_util = float(np.mean([n.utilization for n in nodes]))
        load_var = float(np.var([n.utilization for n in nodes]))
    else:
        gpu_util = 0.0
        load_var = 0.0

    load_balance_score = float(max(0.0, 100.0 - math.sqrt(load_var) * 1.5))

    req_per_sec = len(recent_decisions) / window_seconds if window_seconds > 0 else 0.0
    throughput = len(recent_completed) / window_seconds if window_seconds > 0 else 0.0

    return KPIMetrics(
        activeNodes=active_nodes,
        requestsPerSec=round(req_per_sec, 1),
        averageLatency=round(avg_latency, 1),
        throughput=round(throughput, 1),
        gpuUtilization=round(gpu_util, 1),
        loadBalanceScore=round(load_balance_score, 1),
    )
