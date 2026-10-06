import type { NodeMetrics, InferenceRequest, MetricsSnapshot, KPIMetrics, RoutingDecision } from '@/types/simulation';

export function calculateLatency(
  node: NodeMetrics,
  computeRequirement: number
): number {
  const baseLatency = 30 + computeRequirement * 0.8;
  const queueDelay = node.queueLength * 8;
  const utilizationDelay = (node.utilization / 100) * 40;
  const capacityFactor = 100 / Math.max(10, node.capacity);
  const degradedMultiplier = node.degraded ? 1.8 : 1;

  const latency =
    (baseLatency + queueDelay + utilizationDelay) * capacityFactor * degradedMultiplier;

  return Math.round(latency);
}

export function calculateMetricsSnapshot(
  nodes: NodeMetrics[],
  completedRequests: InferenceRequest[],
  elapsedTime: number,
  requestsThisInterval: number,
  intervalDuration: number
): MetricsSnapshot {
  const latencies = completedRequests.map((r) => r.latency);
  const sorted = [...latencies].sort((a, b) => a - b);

  const averageLatency = latencies.length > 0
    ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length
    : 0;

  const p50Latency = sorted.length > 0
    ? sorted[Math.floor(sorted.length * 0.5)]
    : 0;

  const p95Latency = sorted.length > 0
    ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
    : 0;

  const throughput = intervalDuration > 0
    ? requestsThisInterval / intervalDuration
    : 0;

  const gpuUtilization =
    nodes.length > 0
      ? nodes.reduce((sum, n) => sum + n.utilization, 0) / nodes.length
      : 0;

  const totalQueue = nodes.reduce((sum, n) => sum + n.queueLength, 0);

  const avgActiveRequests =
    nodes.length > 0
      ? nodes.reduce((sum, n) => sum + n.activeRequests, 0) / nodes.length
      : 0;

  const loadVariance =
    nodes.length > 0
      ? nodes.reduce((sum, n) => Math.pow(n.utilization - gpuUtilization, 2), 0) /
        nodes.length
      : 0;

  const loadBalanceScore = Math.max(0, 100 - Math.sqrt(loadVariance) * 1.5);

  return {
    timestamp: elapsedTime,
    averageLatency: Math.round(averageLatency * 10) / 10,
    p50Latency: Math.round(p50Latency * 10) / 10,
    p95Latency: Math.round(p95Latency * 10) / 10,
    throughput: Math.round(throughput * 10) / 10,
    gpuUtilization: Math.round(gpuUtilization * 10) / 10,
    loadVariance: Math.round(loadVariance * 100) / 100,
    loadBalanceScore: Math.round(loadBalanceScore * 10) / 10,
    totalQueueLength: totalQueue,
    requestsPerSec: Math.round(throughput * 10) / 10,
    completedRequests: completedRequests.length,
  };
}

export function calculateKPIMetrics(
  nodes: NodeMetrics[],
  recentRequests: InferenceRequest[],
  recentDecisions: RoutingDecision[]
): KPIMetrics {
  const activeNodes = nodes.filter((n) => n.health !== 'offline').length;
  const recentLatencies = recentRequests.map((r) => r.latency);
  const avgLatency = recentLatencies.length > 0
    ? recentLatencies.reduce((sum, l) => sum + l, 0) / recentLatencies.length
    : 0;

  const gpuUtilization = nodes.length > 0
    ? nodes.reduce((sum, n) => sum + n.utilization, 0) / nodes.length
    : 0;

  const avgActiveRequests =
    nodes.length > 0
      ? nodes.reduce((sum, n) => sum + n.activeRequests, 0) / nodes.length
      : 0;

  const loadVariance =
    nodes.length > 0
      ? nodes.reduce((sum, n) => Math.pow(n.utilization - gpuUtilization, 2), 0) /
        nodes.length
      : 0;

  const loadBalanceScore = Math.max(0, 100 - Math.sqrt(loadVariance) * 1.5);

  return {
    activeNodes,
    requestsPerSec: Math.round((recentDecisions.length / 5) * 10) / 10,
    averageLatency: Math.round(avgLatency * 10) / 10,
    throughput: Math.round((recentRequests.filter((r) => r.status === 'completed').length / 5) * 10) / 10,
    gpuUtilization: Math.round(gpuUtilization * 10) / 10,
    loadBalanceScore: Math.round(loadBalanceScore * 10) / 10,
  };
}
