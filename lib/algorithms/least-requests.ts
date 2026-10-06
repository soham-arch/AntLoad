import type { NodeMetrics } from '@/types/simulation';
import { Router, RoutingResult, getHealthyNodes } from './base';

export class LeastRequestsRouter implements Router {
  type = 'least-requests' as const;

  route(nodes: NodeMetrics[], _requestId: number): RoutingResult {
    const healthy = getHealthyNodes(nodes);
    if (healthy.length === 0) {
      return { selectedNode: nodes[0].id, probabilities: {}, reasoning: ['No healthy nodes available.'] };
    }
    const sorted = [...healthy].sort(
      (a, b) => a.activeRequests + a.queueLength - (b.activeRequests + b.queueLength)
    );
    const selected = sorted[0];
    const totalOutstanding = healthy.reduce(
      (sum, n) => sum + n.activeRequests + n.queueLength,
      0
    );
    const probabilities: Record<string, number> = {};
    healthy.forEach((n) => {
      const outstanding = n.activeRequests + n.queueLength;
      probabilities[n.id] = totalOutstanding > 0 ? 1 - outstanding / totalOutstanding : 1 / healthy.length;
    });
    return {
      selectedNode: selected.id,
      probabilities,
      reasoning: [
        `${selected.gpuName} has ${selected.activeRequests + selected.queueLength} outstanding requests (lowest of all nodes).`,
      ],
    };
  }

  reset() {}
}
