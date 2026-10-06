import type { NodeMetrics, WeightedParams } from '@/types/simulation';
import { Router, RoutingResult, getHealthyNodes, normalizeUtilization } from './base';

export class WeightedWorkloadRouter implements Router {
  type = 'weighted' as const;
  private params: WeightedParams;

  constructor(params?: Partial<WeightedParams>) {
    this.params = {
      wUtilization: params?.wUtilization ?? 0.3,
      wQueue: params?.wQueue ?? 0.25,
      wLatency: params?.wLatency ?? 0.25,
      wCapacity: params?.wCapacity ?? 0.2,
    };
  }

  setParams(params: Partial<WeightedParams>) {
    this.params = { ...this.params, ...params };
  }

  getParams() {
    return { ...this.params };
  }

  computeScore(node: NodeMetrics): number {
    const util = normalizeUtilization(node);
    const queuePenalty = Math.min(1, node.queueLength / 20);
    const latencyPenalty = Math.min(1, node.averageLatency / 300);
    const capacityBonus = node.capacity / 100;
    const degradedPenalty = node.degraded ? 0.3 : 0;

    const score =
      this.params.wUtilization * (1 - util) +
      this.params.wQueue * (1 - queuePenalty) +
      this.params.wLatency * (1 - latencyPenalty) +
      this.params.wCapacity * capacityBonus -
      degradedPenalty;

    return Math.max(0, score);
  }

  route(nodes: NodeMetrics[], _requestId: number): RoutingResult {
    const healthy = getHealthyNodes(nodes);
    if (healthy.length === 0) {
      return { selectedNode: nodes[0].id, probabilities: {}, reasoning: ['No healthy nodes available.'] };
    }

    const scored = healthy.map((n) => ({ node: n, score: this.computeScore(n) }));
    scored.sort((a, b) => b.score - a.score);
    const selected = scored[0].node;

    const totalScore = scored.reduce((sum, s) => sum + s.score, 0);
    const probabilities: Record<string, number> = {};
    scored.forEach((s) => {
      probabilities[s.node.id] = totalScore > 0 ? s.score / totalScore : 1 / healthy.length;
    });

    const topReasons: string[] = [];
    if (selected.utilization < 60) topReasons.push(`Low utilization (${selected.utilization.toFixed(0)}%)`);
    if (selected.queueLength <= 3) topReasons.push(`Short queue (${selected.queueLength})`);
    if (selected.capacity >= 75) topReasons.push(`High capacity (${selected.capacity})`);
    if (selected.degraded) topReasons.push('Node is degraded — score penalized.');
    if (topReasons.length === 0) topReasons.push(`Best composite workload score (${scored[0].score.toFixed(3)}).`);

    return {
      selectedNode: selected.id,
      probabilities,
      reasoning: topReasons,
    };
  }

  reset() {}
}
