import type { NodeMetrics, ACOParams } from '@/types/simulation';
import { Router, RoutingResult, getHealthyNodes, normalizeUtilization } from './base';

export class ACORouter implements Router {
  type = 'aco' as const;
  private params: ACOParams;
  private pheromones: Record<string, number> = {};

  constructor(params?: Partial<ACOParams>) {
    this.params = {
      alpha: params?.alpha ?? 1,
      beta: params?.beta ?? 2,
      evaporationRate: params?.evaporationRate ?? 0.1,
      reinforcementBase: params?.reinforcementBase ?? 0.5,
    };
  }

  setParams(params: Partial<ACOParams>) {
    this.params = { ...this.params, ...params };
  }

  getParams() {
    return { ...this.params };
  }

  getPheromones() {
    return { ...this.pheromones };
  }

  setPheromones(p: Record<string, number>) {
    this.pheromones = { ...p };
  }

  computeHeuristic(node: NodeMetrics): number {
    const util = normalizeUtilization(node);
    const queuePenalty = Math.min(1, node.queueLength / 20);
    const latencyPenalty = Math.min(1, node.averageLatency / 300);
    const capacityBonus = node.capacity / 100;
    const degradedPenalty = node.degraded ? 0.3 : 0;

    const h =
      0.3 * (1 - util) +
      0.25 * (1 - queuePenalty) +
      0.2 * (1 - latencyPenalty) +
      0.25 * capacityBonus -
      degradedPenalty;

    return Math.max(0.01, h);
  }

  private ensurePheromones(nodes: NodeMetrics[]) {
    nodes.forEach((n) => {
      if (this.pheromones[n.id] === undefined) {
        this.pheromones[n.id] = 0.5;
      }
    });
  }

  route(nodes: NodeMetrics[], requestId: number): RoutingResult {
    this.ensurePheromones(nodes);
    const healthy = getHealthyNodes(nodes);
    if (healthy.length === 0) {
      return { selectedNode: nodes[0].id, probabilities: {}, reasoning: ['No healthy nodes available.'] };
    }

    const candidates = healthy.map((n) => {
      const tau = this.pheromones[n.id] ?? 0.5;
      const eta = this.computeHeuristic(n);
      const weight = Math.pow(tau, this.params.alpha) * Math.pow(eta, this.params.beta);
      return { node: n, tau, eta, weight };
    });

    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
    const probabilities: Record<string, number> = {};
    candidates.forEach((c) => {
      probabilities[c.node.id] = totalWeight > 0 ? c.weight / totalWeight : 1 / healthy.length;
    });

    // Stochastic selection proportional to probability
    let r = Math.random();
    let selected = candidates[0];
    for (const c of candidates) {
      r -= probabilities[c.node.id];
      if (r <= 0) {
        selected = c;
        break;
      }
    }

    const reasons: string[] = [];
    reasons.push(
      `Pheromone=${selected.tau.toFixed(2)}, Heuristic=${selected.eta.toFixed(2)}, P=${(probabilities[selected.node.id] * 100).toFixed(0)}%.`
    );
    if (selected.node.queueLength <= 3) reasons.push(`Low queue (${selected.node.queueLength}).`);
    if (selected.node.capacity >= 75) reasons.push(`High capacity (${selected.node.capacity}).`);
    if (selected.eta > 0.7) reasons.push('Strong current workload suitability.');
    else if (selected.tau > 0.7) reasons.push('Strong historical routing performance.');
    if (selected.node.degraded) reasons.push('Node is degraded — heuristic and pheromone adjusted.');

    return {
      selectedNode: selected.node.id,
      probabilities,
      reasoning: reasons,
    };
  }

  onComplete(nodeId: string, latency: number, success: boolean) {
    const tau = this.pheromones[nodeId] ?? 0.5;
    const reward = success
      ? this.params.reinforcementBase * Math.max(0.1, 1 - latency / 300)
      : 0;
    this.pheromones[nodeId] = tau + reward;
  }

  tick(_dt: number) {
    // Evaporation
    Object.keys(this.pheromones).forEach((id) => {
      this.pheromones[id] = Math.max(0.01, this.pheromones[id] * (1 - this.params.evaporationRate));
    });
  }

  reset() {
    this.pheromones = {};
  }
}
