import pytest
from starlette.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "uptime_seconds" in data


def test_nodes_endpoint():
    response = client.get("/api/nodes")
    assert response.status_code == 200
    nodes = response.json()
    assert isinstance(nodes, list)
    assert len(nodes) >= 3
    assert "gpuName" in nodes[0]
    assert "capacity" in nodes[0]


def test_simulation_lifecycle():
    # Start simulation
    res_start = client.post("/api/simulation/start")
    assert res_start.status_code == 200

    # Advance tick
    res_tick = client.post("/api/simulation/tick", json={"dt": 0.2})
    assert res_tick.status_code == 200
    state = res_tick.json()
    assert state["status"] == "running"

    # Burst
    res_burst = client.post("/api/simulation/burst")
    assert res_burst.status_code == 200

    # Pause
    res_pause = client.post("/api/simulation/pause")
    assert res_pause.status_code == 200

    # Reset
    res_reset = client.post("/api/simulation/reset")
    assert res_reset.status_code == 200


def test_node_degradation_api():
    # Degrade GPU-01
    res_deg = client.post("/api/nodes/GPU-01/degrade")
    assert res_deg.status_code == 200

    # Restore GPU-01
    res_rest = client.post("/api/nodes/GPU-01/restore")
    assert res_rest.status_code == 200


def test_algorithm_decision_api():
    nodes_payload = [
        {
            "id": "GPU-01",
            "gpuName": "RTX 4090",
            "capacity": 100,
            "utilization": 30,
            "queueLength": 1,
            "activeRequests": 1,
            "averageLatency": 60,
            "throughput": 0,
            "pheromone": 0.5,
            "heuristic": 0.5,
            "health": "healthy",
            "degraded": False,
            "totalProcessed": 0,
            "totalFailed": 0,
        },
        {
            "id": "GPU-02",
            "gpuName": "RTX 3060",
            "capacity": 45,
            "utilization": 80,
            "queueLength": 7,
            "activeRequests": 6,
            "averageLatency": 150,
            "pheromone": 0.5,
            "heuristic": 0.5,
            "health": "healthy",
            "degraded": False,
            "totalProcessed": 0,
            "totalFailed": 0,
        },
    ]

    res = client.post(
        "/api/algorithms/decision",
        json={"algorithm": "weighted", "nodes": nodes_payload, "requestId": 42},
    )
    assert res.status_code == 200
    decision = res.json()
    assert decision["selectedNode"] == "GPU-01"
    assert "probabilities" in decision


def test_comparison_api():
    req = {
        "baseConfig": {
            "algorithm": "aco",
            "workloadPattern": "stable",
            "requestRate": 30,
            "nodeCount": 3,
            "heterogeneity": "high",
            "duration": 5,
        },
        "algorithms": ["round-robin", "weighted", "aco"],
    }
    res = client.post("/api/comparison/run", json=req)
    assert res.status_code == 200
    results = res.json()
    assert len(results) == 3
