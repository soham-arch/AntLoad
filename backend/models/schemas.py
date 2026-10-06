from __future__ import annotations
from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


AlgorithmType = Literal["round-robin", "least-requests", "weighted", "aco"]
WorkloadPattern = Literal[
    "stable", "bursty", "increasing", "decreasing", "random", "heavy", "mixed"
]
RequestComplexity = Literal["light", "medium", "heavy"]
NodeHealth = Literal["healthy", "degraded", "overloaded", "offline"]
RequestStatus = Literal["queued", "routing", "processing", "completed", "failed"]
SimulationStatus = Literal["idle", "running", "paused", "completed"]
HeterogeneityLevel = Literal["low", "medium", "high"]


class CamelModel(BaseModel):
    """Base model that supports both snake_case in Python and camelCase in JSON."""
    model_config = ConfigDict(
        populate_by_name=True,
        serialize_by_alias=True,
    )


class NodeMetrics(CamelModel):
    id: str
    gpu_name: str = Field(..., alias="gpuName")
    capacity: float
    utilization: float = 0.0
    queue_length: int = Field(0, alias="queueLength")
    active_requests: int = Field(0, alias="activeRequests")
    average_latency: float = Field(0.0, alias="averageLatency")
    throughput: float = 0.0
    pheromone: float = 0.5
    heuristic: float = 0.5
    health: NodeHealth = "healthy"
    degraded: bool = False
    total_processed: int = Field(0, alias="totalProcessed")
    total_failed: int = Field(0, alias="totalFailed")


class InferenceRequest(CamelModel):
    id: int
    arrival_time: float = Field(..., alias="arrivalTime")
    complexity: RequestComplexity
    compute_requirement: float = Field(..., alias="computeRequirement")
    assigned_node: Optional[str] = Field(None, alias="assignedNode")
    start_time: float = Field(0.0, alias="startTime")
    completion_time: float = Field(0.0, alias="completionTime")
    latency: float = 0.0
    status: RequestStatus = "queued"


class RoutingDecision(CamelModel):
    request_id: int = Field(..., alias="requestId")
    algorithm: AlgorithmType
    selected_node: str = Field(..., alias="selectedNode")
    probabilities: Dict[str, float] = Field(default_factory=dict)
    reasoning: List[str] = Field(default_factory=list)
    timestamp: float = 0.0


class ACOParams(CamelModel):
    alpha: float = 1.0
    beta: float = 2.0
    evaporation_rate: float = Field(0.1, alias="evaporationRate")
    reinforcement_base: float = Field(0.5, alias="reinforcementBase")


class WeightedParams(CamelModel):
    w_utilization: float = Field(0.3, alias="wUtilization")
    w_queue: float = Field(0.25, alias="wQueue")
    w_latency: float = Field(0.25, alias="wLatency")
    w_capacity: float = Field(0.2, alias="wCapacity")


class SimulationConfig(CamelModel):
    algorithm: AlgorithmType = "aco"
    workload_pattern: WorkloadPattern = Field("mixed", alias="workloadPattern")
    request_rate: float = Field(50.0, alias="requestRate")
    node_count: int = Field(3, alias="nodeCount")
    heterogeneity: HeterogeneityLevel = "high"
    duration: float = 30.0
    aco_params: ACOParams = Field(default_factory=ACOParams, alias="acoParams")
    weighted_params: WeightedParams = Field(default_factory=WeightedParams, alias="weightedParams")
    seed: Optional[int] = None


class MetricsSnapshot(CamelModel):
    timestamp: float
    average_latency: float = Field(..., alias="averageLatency")
    p50_latency: float = Field(..., alias="p50Latency")
    p95_latency: float = Field(..., alias="p95Latency")
    throughput: float
    gpu_utilization: float = Field(..., alias="gpuUtilization")
    load_variance: float = Field(..., alias="loadVariance")
    load_balance_score: float = Field(..., alias="loadBalanceScore")
    total_queue_length: int = Field(..., alias="totalQueueLength")
    requests_per_sec: float = Field(..., alias="requestsPerSec")
    completed_requests: int = Field(..., alias="completedRequests")


class TimeSeriesPoint(CamelModel):
    time: float
    value: float


class LatencyTimeSeriesPoint(CamelModel):
    time: float
    latency: float


class UtilizationTimeSeriesPoint(CamelModel):
    time: float
    utilization: float


class QueueTimeSeriesPoint(CamelModel):
    time: float
    queue_length: int = Field(..., alias="queueLength")


class AlgorithmResult(CamelModel):
    algorithm: AlgorithmType
    average_latency: float = Field(..., alias="averageLatency")
    p50_latency: float = Field(..., alias="p50Latency")
    p95_latency: float = Field(..., alias="p95Latency")
    throughput: float
    gpu_utilization: float = Field(..., alias="gpuUtilization")
    load_variance: float = Field(..., alias="loadVariance")
    load_balance_score: float = Field(..., alias="loadBalanceScore")
    queue_length: int = Field(..., alias="queueLength")
    completion_rate: float = Field(..., alias="completionRate")
    total_requests: int = Field(..., alias="totalRequests")
    completed_requests: int = Field(..., alias="completedRequests")
    failed_requests: int = Field(..., alias="failedRequests")
    latency_over_time: List[LatencyTimeSeriesPoint] = Field(default_factory=list, alias="latencyOverTime")
    utilization_over_time: List[UtilizationTimeSeriesPoint] = Field(default_factory=list, alias="utilizationOverTime")
    queue_over_time: List[QueueTimeSeriesPoint] = Field(default_factory=list, alias="queueOverTime")
    distribution: Dict[str, float] = Field(default_factory=dict)


class ExperimentConfig(CamelModel):
    id: str
    name: str
    description: str
    workload_pattern: WorkloadPattern = Field(..., alias="workloadPattern")
    request_rate: float = Field(..., alias="requestRate")
    duration: float = 30.0
    node_count: int = Field(3, alias="nodeCount")
    heterogeneity: HeterogeneityLevel = "high"
    degrade_node: Optional[str] = Field(None, alias="degradeNode")
    burst_at: Optional[float] = Field(None, alias="burstAt")
    seed: Optional[int] = 42


class RankingItem(CamelModel):
    algorithm: AlgorithmType
    score: float
    rank: int


class ExperimentResult(CamelModel):
    config: ExperimentConfig
    results: List[AlgorithmResult]
    best_latency: AlgorithmType = Field(..., alias="bestLatency")
    best_throughput: AlgorithmType = Field(..., alias="bestThroughput")
    best_load_balance: AlgorithmType = Field(..., alias="bestLoadBalance")
    lowest_p95: AlgorithmType = Field(..., alias="lowestP95")
    best_utilization: AlgorithmType = Field(..., alias="bestUtilization")
    insight: str
    rankings: List[RankingItem]


class KPIMetrics(CamelModel):
    active_nodes: int = Field(..., alias="activeNodes")
    requests_per_sec: float = Field(..., alias="requestsPerSec")
    average_latency: float = Field(..., alias="averageLatency")
    throughput: float
    gpu_utilization: float = Field(..., alias="gpuUtilization")
    load_balance_score: float = Field(..., alias="loadBalanceScore")


class SimulationState(CamelModel):
    status: SimulationStatus
    config: SimulationConfig
    nodes: List[NodeMetrics]
    requests: List[InferenceRequest]
    recent_decisions: List[RoutingDecision] = Field(default_factory=list, alias="recentDecisions")
    pheromone_history: List[Dict[str, float]] = Field(default_factory=list, alias="pheromoneHistory")
    metrics_history: List[MetricsSnapshot] = Field(default_factory=list, alias="metricsHistory")
    elapsed_time: float = Field(0.0, alias="elapsedTime")
    total_requests: int = Field(0, alias="totalRequests")
    completed_requests: int = Field(0, alias="completedRequests")
    failed_requests: int = Field(0, alias="failedRequests")
    current_request_id: int = Field(0, alias="currentRequestId")


class ComparisonRequest(CamelModel):
    base_config: SimulationConfig = Field(..., alias="baseConfig")
    algorithms: Optional[List[AlgorithmType]] = None
    seed: Optional[int] = 42


class DecisionRequest(CamelModel):
    algorithm: AlgorithmType
    nodes: List[NodeMetrics]
    request_id: int = Field(1, alias="requestId")
    compute_requirement: Optional[float] = Field(None, alias="computeRequirement")
    aco_params: Optional[ACOParams] = Field(None, alias="acoParams")
    weighted_params: Optional[WeightedParams] = Field(None, alias="weightedParams")


class TickRequest(CamelModel):
    dt: float = 0.1
