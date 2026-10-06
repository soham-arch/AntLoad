import pytest
from backend.models.schemas import NodeMetrics, InferenceRequest
from backend.metrics.calculator import (
    calculate_latency_for_request,
    calculate_metrics_snapshot,
    calculate_kpi_metrics,
)


def test_latency_calculation():
    healthy_node = NodeMetrics(
        id="GPU-01",
        gpuName="RTX 4090",
        capacity=100.0,
        utilization=30.0,
        queueLength=2,
    )
    lat_healthy = calculate_latency_for_request(healthy_node, compute_requirement=50.0)
    assert lat_healthy > 0

    # Low capacity / high queue node must yield higher latency
    slow_node = NodeMetrics(
        id="GPU-03",
        gpuName="T4",
        capacity=35.0,
        utilization=85.0,
        queueLength=10,
    )
    lat_slow = calculate_latency_for_request(slow_node, compute_requirement=50.0)
    assert lat_slow > lat_healthy


def test_metrics_snapshot_and_load_balance():
    nodes = [
        NodeMetrics(id="GPU-01", gpuName="RTX 4090", capacity=100.0, utilization=50.0),
        NodeMetrics(id="GPU-02", gpuName="RTX 3090", capacity=75.0, utilization=52.0),
        NodeMetrics(id="GPU-03", gpuName="RTX 3080", capacity=65.0, utilization=48.0),
    ]
    completed = [
        InferenceRequest(
            id=1,
            arrivalTime=0.1,
            complexity="light",
            computeRequirement=30.0,
            assignedNode="GPU-01",
            completionTime=0.2,
            latency=100.0,
            status="completed",
        ),
        InferenceRequest(
            id=2,
            arrivalTime=0.2,
            complexity="medium",
            computeRequirement=70.0,
            assignedNode="GPU-02",
            completionTime=0.35,
            latency=150.0,
            status="completed",
        ),
    ]

    snapshot = calculate_metrics_snapshot(
        nodes=nodes,
        completed_requests=completed,
        elapsed_time=1.0,
        requests_this_interval=2,
        interval_duration=1.0,
    )

    # Average of 100 and 150 = 125
    assert snapshot.average_latency == 125.0
    assert snapshot.throughput == 2.0
    assert snapshot.gpu_utilization == 50.0
    # Nearly equal utilization -> high load balance score (>90%)
    assert snapshot.load_balance_score > 90.0
