import pytest
from backend.models.schemas import SimulationConfig
from backend.simulation.engine import SimulationEngine


def test_simulation_tick_and_request_completion():
    config = SimulationConfig(
        algorithm="aco",
        workloadPattern="mixed",
        requestRate=40.0,
        nodeCount=3,
        heterogeneity="high",
        duration=5.0,
        seed=42,
    )
    engine = SimulationEngine(config)
    engine.start()

    # Advance simulation by 2.0 seconds
    for _ in range(20):
        engine.tick(dt=0.1)

    state = engine.get_state()
    assert state.elapsed_time >= 1.9
    assert state.total_requests > 0
    assert state.completed_requests > 0
    assert len(state.recent_decisions) > 0


def test_node_degradation_and_restoration():
    config = SimulationConfig(
        algorithm="weighted",
        workloadPattern="stable",
        requestRate=30.0,
        nodeCount=3,
        heterogeneity="high",
        duration=10.0,
        seed=42,
    )
    engine = SimulationEngine(config)
    node1 = engine.nodes[0]
    orig_cap = node1.capacity

    # Degrade node 1
    engine.degrade_node(node1.id)
    assert node1.degraded is True
    assert node1.health == "degraded"
    assert node1.capacity == orig_cap * 0.5

    # Restore node 1
    engine.restore_node(node1.id)
    assert node1.degraded is False
    assert node1.health == "healthy"
    assert node1.capacity == orig_cap


def test_traffic_burst():
    config = SimulationConfig(
        algorithm="round-robin",
        workloadPattern="stable",
        requestRate=20.0,
        nodeCount=3,
        duration=10.0,
        seed=42,
    )
    engine = SimulationEngine(config)
    engine.start()

    # Normal tick
    engine.tick(0.5)
    normal_reqs = len(engine.requests)

    # Inject burst and tick
    engine.inject_burst()
    assert engine.burst_active is True
    engine.tick(0.5)
    burst_reqs = len(engine.requests) - normal_reqs

    # Burst should produce significantly more requests than normal
    assert burst_reqs > normal_reqs
