import type {
  SimulationConfig,
  SimulationState,
  NodeMetrics,
  InferenceRequest,
  RoutingDecision,
  RequestComplexity,
  MetricsSnapshot,
  AlgorithmType,
  AlgorithmResult,
  ExperimentConfig,
  ExperimentResult,
} from '@/types/simulation';
import { createRouter, type Router, computeHeuristicForNode } from '@/lib/algorithms';
import { createNodes } from '@/lib/data/mockData';
import { COMPLEXITY_PROFILES } from '@/lib/data/mockData';
import { calculateLatency, calculateMetricsSnapshot } from '@/lib/metrics/calculator';

interface ProcessingRequest {
  request: InferenceRequest;
  nodeId: string;
  startTime: number;
  estimatedDuration: number;
}

export class SimulationEngine {
  private config: SimulationConfig;
  private nodes: NodeMetrics[];
  private router: Router;
  private requests: InferenceRequest[] = [];
  private processing: ProcessingRequest[] = [];
  private recentDecisions: RoutingDecision[] = [];
  private pheromoneHistory: Record<string, number>[] = [];
  private metricsHistory: MetricsSnapshot[] = [];
  private elapsedTime = 0;
  private currentRequestId = 0;
  private requestAccumulator = 0;
  private burstTimer = 0;
  private burstActive = false;
  private degradedNodeIds: Set<string> = new Set();
  private status: 'idle' | 'running' | 'paused' | 'completed' = 'idle';
  private requestCountSinceSnapshot = 0;
  private lastSnapshotTime = 0;
  private workloadPhase = 0;
  private rrCounter = 0;

  constructor(config: SimulationConfig) {
    this.config = { ...config };
    this.nodes = createNodes(config.nodeCount, config.heterogeneity);
    this.router = createRouter(config.algorithm, {
      weightedParams: config.weightedParams,
      acoParams: config.acoParams,
    });
    this.initPheromones();
  }

  private initPheromones() {
    if (this.router.type === 'aco') {
      this.nodes.forEach((n) => {
        (this.router as any).pheromones = (this.router as any).pheromones || {};
        (this.router as any).pheromones[n.id] = 0.5;
      });
    }
  }

  getConfig() {
    return { ...this.config };
  }

  setConfig(updates: Partial<SimulationConfig>) {
    const oldAlgorithm = this.config.algorithm;
    this.config = { ...this.config, ...updates };
    if (updates.algorithm && updates.algorithm !== oldAlgorithm) {
      this.router = createRouter(this.config.algorithm, {
        weightedParams: this.config.weightedParams,
        acoParams: this.config.acoParams,
      });
      this.initPheromones();
    }
    if (updates.algorithm === 'aco' && this.router.type === 'aco') {
      (this.router as any).setParams(this.config.acoParams);
    }
    if (updates.algorithm === 'weighted' && this.router.type === 'weighted') {
      (this.router as any).setParams(this.config.weightedParams);
    }
    if (updates.nodeCount || updates.heterogeneity) {
      this.nodes = createNodes(this.config.nodeCount, this.config.heterogeneity);
      this.initPheromones();
      this.processing = [];
      this.requests = [];
    }
  }

  getNodes(): NodeMetrics[] {
    return this.nodes.map((n) => ({
      ...n,
      heuristic: computeHeuristicForNode(n),
      pheromone: this.router.type === 'aco' ? (this.router as any).getPheromones()[n.id] ?? 0.5 : 0.5,
    }));
  }

  getRequests(): InferenceRequest[] {
    return [...this.requests];
  }

  getRecentDecisions(): RoutingDecision[] {
    return [...this.recentDecisions].slice(-20);
  }

  getPheromoneHistory(): Record<string, number>[] {
    return [...this.pheromoneHistory];
  }

  getMetricsHistory(): MetricsSnapshot[] {
    return [...this.metricsHistory];
  }

  getStatus() {
    return this.status;
  }

  getElapsedTime() {
    return this.elapsedTime;
  }

  getTotalRequests() {
    return this.requests.length;
  }

  getCompletedRequests() {
    return this.requests.filter((r) => r.status === 'completed').length;
  }

  getFailedRequests() {
    return this.requests.filter((r) => r.status === 'failed').length;
  }

  start() {
    if (this.status === 'completed') {
      this.reset();
    }
    this.status = 'running';
  }

  pause() {
    this.status = 'paused';
  }

  reset() {
    this.status = 'idle';
    this.nodes = createNodes(this.config.nodeCount, this.config.heterogeneity);
    this.router = createRouter(this.config.algorithm, {
      weightedParams: this.config.weightedParams,
      acoParams: this.config.acoParams,
    });
    this.initPheromones();
    this.requests = [];
    this.processing = [];
    this.recentDecisions = [];
    this.pheromoneHistory = [];
    this.metricsHistory = [];
    this.elapsedTime = 0;
    this.currentRequestId = 0;
    this.requestAccumulator = 0;
    this.burstTimer = 0;
    this.burstActive = false;
    this.requestCountSinceSnapshot = 0;
    this.lastSnapshotTime = 0;
    this.workloadPhase = 0;
    this.rrCounter = 0;
    this.degradedNodeIds.clear();
  }

  injectBurst() {
    this.burstActive = true;
    this.burstTimer = 5;
  }

  degradeNode(nodeId: string) {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.degraded = true;
      node.health = 'degraded';
      node.capacity = Math.round(node.capacity * 0.5);
      this.degradedNodeIds.add(nodeId);
    }
  }

  restoreNode(nodeId: string) {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (node) {
      const profiles = createNodes(this.config.nodeCount, this.config.heterogeneity);
      const original = profiles.find((p) => p.id === nodeId);
      node.degraded = false;
      node.health = 'healthy';
      if (original) node.capacity = original.capacity;
      this.degradedNodeIds.delete(nodeId);
    }
  }

  private getCurrentRequestRate(): number {
    const baseRate = this.config.requestRate;
    if (this.burstActive) {
      return Math.min(200, baseRate * 4);
    }
    const t = this.elapsedTime;
    const totalDuration = this.config.duration;

    switch (this.config.workloadPattern) {
      case 'stable':
        return baseRate;
      case 'bursty':
        return baseRate * (0.5 + 0.5 * Math.abs(Math.sin(t * 0.5)));
      case 'increasing':
        return baseRate * (0.3 + 0.7 * Math.min(1, t / totalDuration));
      case 'decreasing':
        return baseRate * (1 - 0.7 * Math.min(1, t / totalDuration));
      case 'random':
        return baseRate * (0.5 + Math.random());
      case 'heavy':
        return baseRate * 0.8;
      case 'mixed':
        return baseRate * (0.7 + 0.3 * Math.sin(t * 0.3));
      default:
        return baseRate;
    }
  }

  private pickComplexity(): RequestComplexity {
    switch (this.config.workloadPattern) {
      case 'heavy':
        return Math.random() < 0.7 ? 'heavy' : 'medium';
      case 'mixed':
        const r = Math.random();
        return r < 0.35 ? 'light' : r < 0.8 ? 'medium' : 'heavy';
      default:
        const r2 = Math.random();
        return r2 < 0.4 ? 'light' : r2 < 0.8 ? 'medium' : 'heavy';
    }
  }

  private generateRequests(dt: number) {
    const rate = this.getCurrentRequestRate();
    this.requestAccumulator += rate * dt;

    while (this.requestAccumulator >= 1) {
      this.requestAccumulator -= 1;
      this.currentRequestId++;
      const complexity = this.pickComplexity();
      const profile = COMPLEXITY_PROFILES[complexity];
      const computeReq = profile.computeMultiplier * (50 + Math.random() * 50);

      const request: InferenceRequest = {
        id: this.currentRequestId,
        arrivalTime: this.elapsedTime,
        complexity,
        computeRequirement: computeReq,
        assignedNode: null,
        startTime: 0,
        completionTime: 0,
        latency: 0,
        status: 'routing',
      };

      // Route the request
      const liveNodes = this.getNodes();
      const result = this.router.route(liveNodes, request.id);
      request.assignedNode = result.selectedNode;
      request.status = 'processing';
      request.startTime = this.elapsedTime;

      const node = this.nodes.find((n) => n.id === result.selectedNode);
      if (node) {
        node.activeRequests++;
        node.queueLength++;

        const latency = calculateLatency(node, computeReq);
        const duration = latency / 1000; // convert ms to seconds

        this.processing.push({
          request,
          nodeId: node.id,
          startTime: this.elapsedTime,
          estimatedDuration: duration,
        });

        const decision: RoutingDecision = {
          requestId: request.id,
          algorithm: this.config.algorithm,
          selectedNode: result.selectedNode,
          probabilities: result.probabilities,
          reasoning: result.reasoning,
          timestamp: this.elapsedTime,
        };
        this.recentDecisions.push(decision);
        if (this.recentDecisions.length > 50) {
          this.recentDecisions = this.recentDecisions.slice(-50);
        }
      }

      this.requests.push(request);
      if (this.requests.length > 500) {
        this.requests = this.requests.slice(-500);
      }
      this.requestCountSinceSnapshot++;
    }
  }

  private updateProcessing(dt: number) {
    const completed: ProcessingRequest[] = [];

    for (const p of this.processing) {
      const elapsed = this.elapsedTime - p.startTime;
      if (elapsed >= p.estimatedDuration) {
        const node = this.nodes.find((n) => n.id === p.nodeId);
        if (node) {
          const success = !node.degraded || Math.random() > 0.15;
          if (success) {
            p.request.status = 'completed';
            p.request.completionTime = this.elapsedTime;
            p.request.latency = Math.round((this.elapsedTime - p.request.arrivalTime) * 1000);

            node.totalProcessed++;
            node.activeRequests = Math.max(0, node.activeRequests - 1);
            node.queueLength = Math.max(0, node.queueLength - 1);

            // Update node's running average latency
            node.averageLatency =
              node.averageLatency * 0.8 + p.request.latency * 0.2;

            // ACO reinforcement
            if (this.router.type === 'aco') {
              this.router.onComplete!(p.nodeId, p.request.latency, true);
            }
          } else {
            p.request.status = 'failed';
            node.totalFailed++;
            node.activeRequests = Math.max(0, node.activeRequests - 1);
            node.queueLength = Math.max(0, node.queueLength - 1);
            if (this.router.type === 'aco') {
              this.router.onComplete!(p.nodeId, 300, false);
            }
          }
        }
        completed.push(p);
      }
    }

    this.processing = this.processing.filter((p) => !completed.includes(p));
  }

  private updateNodeUtilization(dt: number) {
    for (const node of this.nodes) {
      // Target utilization based on active requests and capacity
      const targetUtil = Math.min(100, (node.activeRequests / Math.max(1, node.capacity / 20)) * 100);
      node.utilization = node.utilization * 0.85 + targetUtil * 0.15;

      // Throughput: requests completed per second (approximation)
      const recentCompleted = this.requests.filter(
        (r) => r.assignedNode === node.id && r.status === 'completed' && this.elapsedTime - r.completionTime < 2
      ).length;
      node.throughput = recentCompleted / 2;

      // Health assessment
      if (node.utilization > 90 && node.queueLength > 10) {
        node.health = 'overloaded';
      } else if (node.degraded) {
        node.health = 'degraded';
      } else if (node.utilization < 85 && node.queueLength < 8) {
        node.health = 'healthy';
      }
    }
  }

  private takeSnapshot() {
    const intervalDuration = this.elapsedTime - this.lastSnapshotTime;
    if (intervalDuration <= 0) return;

    const completed = this.requests.filter((r) => r.status === 'completed');
    const snapshot = calculateMetricsSnapshot(
      this.nodes,
      completed,
      this.elapsedTime,
      this.requestCountSinceSnapshot,
      intervalDuration
    );

    this.metricsHistory.push(snapshot);
    if (this.metricsHistory.length > 120) {
      this.metricsHistory = this.metricsHistory.slice(-120);
    }

    // Pheromone snapshot
    if (this.router.type === 'aco') {
      const pheromones = (this.router as any).getPheromones();
      this.pheromoneHistory.push({ ...pheromones });
      if (this.pheromoneHistory.length > 120) {
        this.pheromoneHistory = this.pheromoneHistory.slice(-120);
      }
    }

    this.lastSnapshotTime = this.elapsedTime;
    this.requestCountSinceSnapshot = 0;
  }

  tick(dt: number) {
    if (this.status !== 'running') return;

    // Clamp dt to prevent huge jumps
    dt = Math.min(dt, 0.5);

    this.elapsedTime += dt;

    // Burst timer
    if (this.burstActive) {
      this.burstTimer -= dt;
      if (this.burstTimer <= 0) this.burstActive = false;
    }

    // ACO evaporation
    if (this.router.type === 'aco') {
      this.router.tick!(dt);
    }

    this.generateRequests(dt);
    this.updateProcessing(dt);
    this.updateNodeUtilization(dt);

    // Take snapshot every 0.5 seconds
    if (this.elapsedTime - this.lastSnapshotTime >= 0.5) {
      this.takeSnapshot();
    }

    // Check completion
    if (this.elapsedTime >= this.config.duration) {
      this.status = 'completed';
      this.takeSnapshot();
    }
  }

  getState(): SimulationState {
    return {
      status: this.status,
      config: { ...this.config },
      nodes: this.getNodes(),
      requests: this.getRequest(),
      recentDecisions: this.getRecentDecisions(),
      pheromoneHistory: this.pheromoneHistory,
      metricsHistory: this.metricsHistory,
      elapsedTime: this.elapsedTime,
      totalRequests: this.getTotalRequests(),
      completedRequests: this.getCompletedRequests(),
      failedRequests: this.getFailedRequests(),
      currentRequestId: this.currentRequestId,
    };
  }

  private getRequest(): InferenceRequest[] {
    return [...this.requests];
  }

  // Run a full simulation synchronously (for experiments/comparison)
  static runFullSimulation(
    config: SimulationConfig,
    algorithm: AlgorithmType,
    degradeNodeId?: string
  ): AlgorithmResult {
    const fullConfig: SimulationConfig = {
      ...config,
      algorithm,
    };

    const engine = new SimulationEngine(fullConfig);
    engine.start();

    const dt = 0.1;
    const steps = Math.ceil(config.duration / dt);

    for (let i = 0; i < steps; i++) {
      if (degradeNodeId && engine.getElapsedTime() >= config.duration * 0.3) {
        const node = engine.getNodes().find((n) => n.id === degradeNodeId);
        if (node && !node.degraded) {
          engine.degradeNode(degradeNodeId);
        }
      }
      engine.tick(dt);
    }

    const nodes = engine.getNodes();
    const completedRequests = engine.getRequests().filter((r) => r.status === 'completed');
    const failedRequests = engine.getRequests().filter((r) => r.status === 'failed');
    const totalRequests = engine.getTotalRequests();
    const metricsHistory = engine.getMetricsHistory();

    const latencies = completedRequests.map((r) => r.latency);
    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    const avgLatency = latencies.length > 0 ? latencies.reduce((s, l) => s + l, 0) / latencies.length : 0;
    const p50 = sortedLatencies.length > 0 ? sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] : 0;
    const p95 = sortedLatencies.length > 0 ? sortedLatencies[Math.min(sortedLatencies.length - 1, Math.floor(sortedLatencies.length * 0.95))] : 0;
    const throughput = completedRequests.length / config.duration;
    const gpuUtil = nodes.reduce((s, n) => s + n.utilization, 0) / Math.max(1, nodes.length);
    const loadVariance = nodes.reduce((s, n) => Math.pow(n.utilization - gpuUtil, 2), 0) / Math.max(1, nodes.length);
    const loadBalance = Math.max(0, 100 - Math.sqrt(loadVariance) * 1.5);
    const totalQueue = nodes.reduce((s, n) => s + n.queueLength, 0);
    const completionRate = totalRequests > 0 ? completedRequests.length / totalRequests : 0;

    const distribution: Record<string, number> = {};
    const totalAssigned = completedRequests.length + failedRequests.length;
    nodes.forEach((n) => {
      const assigned = engine.getRequests().filter((r) => r.assignedNode === n.id).length;
      distribution[n.id] = totalAssigned > 0 ? (assigned / totalAssigned) * 100 : 0;
    });

    const latencyOverTime = metricsHistory.map((m) => ({ time: m.timestamp, latency: m.averageLatency }));
    const utilizationOverTime = metricsHistory.map((m) => ({ time: m.timestamp, utilization: m.gpuUtilization }));
    const queueOverTime = metricsHistory.map((m) => ({ time: m.timestamp, queueLength: m.totalQueueLength }));

    return {
      algorithm,
      averageLatency: Math.round(avgLatency * 10) / 10,
      p50Latency: Math.round(p50 * 10) / 10,
      p95Latency: Math.round(p95 * 10) / 10,
      throughput: Math.round(throughput * 10) / 10,
      gpuUtilization: Math.round(gpuUtil * 10) / 10,
      loadVariance: Math.round(loadVariance * 100) / 100,
      loadBalanceScore: Math.round(loadBalance * 10) / 10,
      queueLength: totalQueue,
      completionRate: Math.round(completionRate * 1000) / 1000,
      totalRequests,
      completedRequests: completedRequests.length,
      failedRequests: failedRequests.length,
      latencyOverTime,
      utilizationOverTime,
      queueOverTime,
      distribution,
    };
  }

  static runExperiment(expConfig: ExperimentConfig): ExperimentResult {
    const algorithms: AlgorithmType[] = ['round-robin', 'least-requests', 'weighted', 'aco'];
    const baseConfig: SimulationConfig = {
      algorithm: 'aco',
      workloadPattern: expConfig.workloadPattern,
      requestRate: expConfig.requestRate,
      nodeCount: expConfig.nodeCount,
      heterogeneity: expConfig.heterogeneity,
      duration: expConfig.duration,
      acoParams: { alpha: 1, beta: 2, evaporationRate: 0.1, reinforcementBase: 0.5 },
      weightedParams: { wUtilization: 0.3, wQueue: 0.25, wLatency: 0.25, wCapacity: 0.2 },
    };

    const results = algorithms.map((alg) =>
      SimulationEngine.runFullSimulation(baseConfig, alg, expConfig.degradeNode)
    );

    const bestLatency = results.reduce((best, r) =>
      r.averageLatency < best.averageLatency ? r : best
    ).algorithm;
    const bestThroughput = results.reduce((best, r) =>
      r.throughput > best.throughput ? r : best
    ).algorithm;
    const bestLoadBalance = results.reduce((best, r) =>
      r.loadBalanceScore > best.loadBalanceScore ? r : best
    ).algorithm;
    const lowestP95 = results.reduce((best, r) =>
      r.p95Latency < best.p95Latency ? r : best
    ).algorithm;
    const bestUtilization = results.reduce((best, r) =>
      r.gpuUtilization > best.gpuUtilization ? r : best
    ).algorithm;

    // Score: lower latency, higher throughput, better balance, lower p95
    const scored = results.map((r) => {
      const score =
        (1 / (r.averageLatency + 1)) * 0.3 +
        (r.throughput / 100) * 0.25 +
        (r.loadBalanceScore / 100) * 0.25 +
        (1 / (r.p95Latency + 1)) * 0.2;
      return { algorithm: r.algorithm, score, rank: 0 };
    });
    scored.sort((a, b) => b.score - a.score);
    scored.forEach((s, i) => (s.rank = i + 1));

    const insight = generateInsight(
      expConfig,
      bestLatency,
      bestThroughput,
      bestLoadBalance,
      lowestP95,
      results
    );

    return {
      config: expConfig,
      results,
      bestLatency,
      bestThroughput,
      bestLoadBalance,
      lowestP95,
      bestUtilization,
      insight,
      rankings: scored,
    };
  }
}

function generateInsight(
  config: ExperimentConfig,
  bestLatency: AlgorithmType,
  bestThroughput: AlgorithmType,
  bestLoadBalance: AlgorithmType,
  lowestP95: AlgorithmType,
  results: AlgorithmResult[]
): string {
  const acoResult = results.find((r) => r.algorithm === 'aco')!;
  const rrResult = results.find((r) => r.algorithm === 'round-robin')!;
  const weightedResult = results.find((r) => r.algorithm === 'weighted')!;

  const parts: string[] = [];

  if (bestLatency === 'aco') {
    parts.push(
      `ACO achieved the lowest average latency (${acoResult.averageLatency}ms) under ${config.name.toLowerCase()} conditions, as its routing decisions incorporated both current queue states and historical node performance.`
    );
  } else {
    parts.push(
      `${bestLatency === 'weighted' ? 'Weighted workload' : bestLatency === 'least-requests' ? 'Least outstanding requests' : 'Round robin'} routing achieved the lowest average latency (${results.find(r => r.algorithm === bestLatency)!.averageLatency}ms).`
    );
    if (acoResult.averageLatency > rrResult.averageLatency) {
      parts.push(
        `ACO introduced additional decision overhead and did not outperform simpler heuristics under this workload pattern.`
      );
    } else {
      parts.push(
        `ACO (${acoResult.averageLatency}ms) was competitive but did not lead, suggesting this workload pattern may not fully exploit pheromone-based learning.`
      );
    }
  }

  if (bestLoadBalance === 'aco') {
    parts.push(
      `ACO produced the most balanced load distribution (score: ${acoResult.loadBalanceScore}), adapting to node heterogeneity through pheromone reinforcement.`
    );
  } else {
    parts.push(
      `${bestLoadBalance === 'weighted' ? 'Weighted' : bestLoadBalance === 'least-requests' ? 'Least requests' : 'Round robin'} achieved better load balance (score: ${results.find(r => r.algorithm === bestLoadBalance)!.loadBalanceScore}), indicating that current-workload-aware heuristics suffice for this scenario.`
    );
  }

  if (config.degradeNode) {
    if (bestLatency === 'aco' || bestLoadBalance === 'aco') {
      parts.push(
        `When a node was degraded, ACO adapted its pheromone values over time, gradually reducing traffic to the degraded node without permanently excluding it.`
      );
    } else {
      parts.push(
        `Node degradation was handled more effectively by ${bestLatency}, which responded faster to the sudden capacity reduction.`
      );
    }
  }

  return parts.join(' ');
}
