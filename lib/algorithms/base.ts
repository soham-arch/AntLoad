import type { NodeMetrics, RoutingDecision, AlgorithmType } from '@/types/simulation';

export interface RoutingResult {
  selectedNode: string;
  probabilities: Record<string, number>;
  reasoning: string[];
}

export interface Router {
  type: AlgorithmType;
  route(nodes: NodeMetrics[], requestId: number): RoutingResult;
  onComplete?(nodeId: string, latency: number, success: boolean): void;
  tick?(dt: number): void;
  reset(): void;
}

export function normalizeUtilization(node: NodeMetrics): number {
  return Math.min(1, node.utilization / 100);
}

export function getHealthyNodes(nodes: NodeMetrics[]): NodeMetrics[] {
  return nodes.filter((n) => n.health !== 'offline');
}
