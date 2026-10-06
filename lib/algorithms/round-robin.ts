import type { NodeMetrics } from '@/types/simulation';
import { Router, RoutingResult, getHealthyNodes } from './base';

export class RoundRobinRouter implements Router {
  type = 'round-robin' as const;
  private index = 0;

  route(nodes: NodeMetrics[], _requestId: number): RoutingResult {
    const healthy = getHealthyNodes(nodes);
    if (healthy.length === 0) {
      return { selectedNode: nodes[0].id, probabilities: {}, reasoning: ['No healthy nodes available; defaulting to first node.'] };
    }
    const selected = healthy[this.index % healthy.length];
    this.index++;
    const probabilities: Record<string, number> = {};
    healthy.forEach((n) => {
      probabilities[n.id] = 1 / healthy.length;
    });
    return {
      selectedNode: selected.id,
      probabilities,
      reasoning: [`Cyclic assignment: next node in rotation is ${selected.gpuName}.`],
    };
  }

  reset() {
    this.index = 0;
  }
}
