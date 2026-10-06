import pytest
from backend.models.schemas import ExperimentConfig
from backend.experiments.runner import ExperimentRunner, PREDEFINED_EXPERIMENTS


def test_experiment_reproducibility():
    config = ExperimentConfig(
        id="test-exp",
        name="Test Reproducibility",
        description="Verify deterministic output with same seed",
        workloadPattern="mixed",
        requestRate=40.0,
        duration=10.0,
        nodeCount=3,
        heterogeneity="high",
        seed=42,
    )

    result_1 = ExperimentRunner.run_experiment(config)
    result_2 = ExperimentRunner.run_experiment(config)

    # Identical seed must produce identical results
    assert len(result_1.results) == 4
    for r1, r2 in zip(result_1.results, result_2.results):
        assert r1.algorithm == r2.algorithm
        assert r1.total_requests == r2.total_requests
        assert r1.completed_requests == r2.completed_requests
        assert abs(r1.average_latency - r2.average_latency) < 1e-2
        assert abs(r1.throughput - r2.throughput) < 1e-2


def test_all_algorithms_behave_differently():
    config = ExperimentConfig(
        id="test-diff",
        name="Test Distinct Behavior",
        description="Verify that algorithms produce different routing distributions",
        workloadPattern="mixed",
        requestRate=50.0,
        duration=15.0,
        nodeCount=3,
        heterogeneity="high",
        seed=100,
    )

    result = ExperimentRunner.run_experiment(config)
    assert len(result.results) == 4

    # Distributions must not be all identical across different algorithm classes
    distributions = [r.distribution for r in result.results]
    assert any(distributions[0] != d for d in distributions[1:])


def test_predefined_experiment_runs():
    exp_config = PREDEFINED_EXPERIMENTS["exp1-stable"]
    exp_config.duration = 5.0  # Fast test duration
    result = ExperimentRunner.run_experiment(exp_config)

    assert result.config.id == "exp1-stable"
    assert len(result.results) == 4
    assert result.best_latency in ["round-robin", "least-requests", "weighted", "aco"]
    assert len(result.rankings) == 4
    assert len(result.insight) > 20
