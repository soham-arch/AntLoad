export type AlgorithmType = 'round-robin' | 'least-requests' | 'weighted' | 'aco';

export type WorkloadPattern =
  | 'stable'
  | 'bursty'
  | 'increasing'
  | 'decreasing'
  | 'random'
  | 'heavy'
  | 'mixed';

export type RequestComplexity = 'light' | 'medium' | 'heavy';

export type NodeHealth = 'healthy' | 'degraded' | 'overloaded' | 'offline';

export type RequestStatus = 'queued' | 'routing' | 'processing' | 'completed' | 'failed';

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed';

export type HeterogeneityLevel = 'low' | 'medium' | 'high';

export interface NodeMetrics {
  id: string;
  gpuName: string;
  capacity: number;
  utilization: number;
  queueLength: number;
  activeRequests: number;
  averageLatency: number;
  throughput: number;
  pheromone: number;
  heuristic: number;
  health: NodeHealth;
  degraded: boolean;
  totalProcessed: number;
  totalFailed: number;
}

export interface InferenceRequest {
  id: number;
  arrivalTime: number;
  complexity: RequestComplexity;
  computeRequirement: number;
  assignedNode: string | null;
  startTime: number;
  completionTime: number;
  latency: number;
  status: RequestStatus;
}

export interface RoutingDecision {
  requestId: number;
  algorithm: AlgorithmType;
  selectedNode: string;
  probabilities: Record<string, number>;
  reasoning: string[];
  timestamp: number;
}

export interface PheromoneState {
  [nodeId: string]: number;
}

export interface ACOParams {
  alpha: number;
  beta: number;
  evaporationRate: number;
  reinforcementBase: number;
}

export interface WeightedParams {
  wUtilization: number;
  wQueue: number;
  wLatency: number;
  wCapacity: number;
}

export interface SimulationConfig {
  algorithm: AlgorithmType;
  workloadPattern: WorkloadPattern;
  requestRate: number;
  nodeCount: number;
  heterogeneity: HeterogeneityLevel;
  duration: number;
  acoParams: ACOParams;
  weightedParams: WeightedParams;
}

export interface SimulationState {
  status: SimulationStatus;
  config: SimulationConfig;
  nodes: NodeMetrics[];
  requests: InferenceRequest[];
  recentDecisions: RoutingDecision[];
  pheromoneHistory: PheromoneState[];
  metricsHistory: MetricsSnapshot[];
  elapsedTime: number;
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  currentRequestId: number;
}

export interface MetricsSnapshot {
  timestamp: number;
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  throughput: number;
  gpuUtilization: number;
  loadVariance: number;
  loadBalanceScore: number;
  totalQueueLength: number;
  requestsPerSec: number;
  completedRequests: number;
}

export interface AlgorithmResult {
  algorithm: AlgorithmType;
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  throughput: number;
  gpuUtilization: number;
  loadVariance: number;
  loadBalanceScore: number;
  queueLength: number;
  completionRate: number;
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  latencyOverTime: { time: number; latency: number }[];
  utilizationOverTime: { time: number; utilization: number }[];
  queueOverTime: { time: number; queueLength: number }[];
  distribution: Record<string, number>;
}

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  workloadPattern: WorkloadPattern;
  requestRate: number;
  duration: number;
  nodeCount: number;
  heterogeneity: HeterogeneityLevel;
  degradeNode?: string;
  burstAt?: number;
}

export interface ExperimentResult {
  config: ExperimentConfig;
  results: AlgorithmResult[];
  bestLatency: AlgorithmType;
  bestThroughput: AlgorithmType;
  bestLoadBalance: AlgorithmType;
  lowestP95: AlgorithmType;
  bestUtilization: AlgorithmType;
  insight: string;
  rankings: { algorithm: AlgorithmType; score: number; rank: number }[];
}

export interface KPIMetrics {
  activeNodes: number;
  requestsPerSec: number;
  averageLatency: number;
  throughput: number;
  gpuUtilization: number;
  loadBalanceScore: number;
}
