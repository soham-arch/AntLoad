import pytest
from backend.models.schemas import NodeMetrics, ACOParams, WeightedParams
from backend.algorithms.round_robin import RoundRobinRouter
from backend.algorithms.least_requests import LeastRequestsRouter
from backend.algorithms.weighted import WeightedWorkloadRouter
from backend.algorithms.aco import ACORouter


def create_sample_nodes():
    return [
        NodeMetrics(
            id="GPU-01",
            gpuName="RTX 4090",
            capacity=100.0,
            utilization=40.0,
            queueLength=1,
            activeRequests=2,
            averageLatency=65.0,
            health="healthy",
        ),
        NodeMetrics(
            id="GPU-02",
            gpuName="RTX 3090",
            capacity=75.0,
            utilization=70.0,
            queueLength=5,
            activeRequests=6,
            averageLatency=110.0,
            health="healthy",
        ),
        NodeMetrics(
            id="GPU-03",
            gpuName="RTX 3060",
            capacity=45.0,
            utilization=85.0,
            queueLength=8,
            activeRequests=8,
            averageLatency=180.0,
            health="healthy",
        ),
    ]


def test_round_robin_sequence():
    nodes = create_sample_nodes()
    router = RoundRobinRouter()

    # Should cycle deterministically: 0 -> 1 -> 2 -> 0 -> 1...
    assert router.route(nodes, 1).selected_node == "GPU-01"
    assert router.route(nodes, 2).selected_node == "GPU-02"
    assert router.route(nodes, 3).selected_node == "GPU-03"
    assert router.route(nodes, 4).selected_node == "GPU-01"
    assert router.route(nodes, 5).selected_node == "GPU-02"

    # Reset should restart from beginning
    router.reset()
    assert router.route(nodes, 6).selected_node == "GPU-01"


def test_least_requests_selection():
    nodes = create_sample_nodes()
    router = LeastRequestsRouter()

    # GPU-01 has 1 queue + 2 active = 3 outstanding (lowest)
    # GPU-02 has 5 + 6 = 11
    # GPU-03 has 8 + 8 = 16
    res = router.route(nodes, 1)
    assert res.selected_node == "GPU-01"
    assert "GPU-01" in res.probabilities
    assert res.probabilities["GPU-01"] > res.probabilities["GPU-03"]

    # When GPU-01 gets loaded and GPU-03 becomes empty:
    nodes[0].active_requests = 15
    nodes[0].queue_length = 5
    nodes[2].active_requests = 0
    nodes[2].queue_length = 0

    res2 = router.route(nodes, 2)
    assert res2.selected_node == "GPU-03"


def test_weighted_routing_calculation():
    nodes = create_sample_nodes()
    router = WeightedWorkloadRouter(
        params=WeightedParams(
            wUtilization=0.3,
            wQueue=0.25,
            wLatency=0.25,
            wCapacity=0.2,
        )
    )

    res = router.route(nodes, 1)
    # GPU-01 has highest capacity (100), lowest util (40%), lowest queue (1), lowest latency (65)
    # It must have the highest composite score
    assert res.selected_node == "GPU-01"
    assert res.probabilities["GPU-01"] > res.probabilities["GPU-02"]
    assert res.probabilities["GPU-02"] > res.probabilities["GPU-03"]
    assert any("GPU-01" in r for r in res.reasoning)


def test_aco_probability_and_dynamics():
    nodes = create_sample_nodes()
    router = ACORouter(
        params=ACOParams(
            alpha=1.0,
            beta=2.0,
            evaporationRate=0.1,
            reinforcementBase=0.5,
        ),
        seed=42,
    )

    # Initial routing
    res = router.route(nodes, 1)
    assert res.selected_node in ["GPU-01", "GPU-02", "GPU-03"]

    # Probabilities must sum to 1.0
    prob_sum = sum(res.probabilities.values())
    assert abs(prob_sum - 1.0) < 1e-4

    # Better node (GPU-01) should have higher probability
    assert res.probabilities["GPU-01"] > res.probabilities["GPU-03"]


def test_aco_evaporation_and_reinforcement():
    nodes = create_sample_nodes()
    router = ACORouter(
        params=ACOParams(
            alpha=1.0,
            beta=1.0,
            evaporationRate=0.2,
            reinforcementBase=0.8,
        ),
        seed=42,
    )
    router.ensure_pheromones(nodes)

    initial_tau = router.get_pheromones()["GPU-01"]
    assert initial_tau == 0.5

    # Reinforce GPU-01 with fast completion (50ms)
    router.on_complete("GPU-01", latency=50.0, success=True)
    reinforced_tau = router.get_pheromones()["GPU-01"]
    assert reinforced_tau > initial_tau

    # Apply evaporation (dt=1.0)
    router.tick(dt=1.0)
    evaporated_tau = router.get_pheromones()["GPU-01"]
    assert evaporated_tau < reinforced_tau
