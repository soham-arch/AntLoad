import type { AlgorithmType, WeightedParams, ACOParams, NodeMetrics } from '@/types/simulation';
import type { Router } from './base';
import { RoundRobinRouter } from './round-robin';
import { LeastRequestsRouter } from './least-requests';
import { WeightedWorkloadRouter } from './weighted';
import { ACORouter } from './aco';

export type { Router, RoutingResult } from './base';
export { RoundRobinRouter, LeastRequestsRouter, WeightedWorkloadRouter, ACORouter };

export function createRouter(
  type: AlgorithmType,
  options?: { weightedParams?: Partial<WeightedParams>; acoParams?: Partial<ACOParams> }
): Router {
  switch (type) {
    case 'round-robin':
      return new RoundRobinRouter();
    case 'least-requests':
      return new LeastRequestsRouter();
    case 'weighted':
      return new WeightedWorkloadRouter(options?.weightedParams);
    case 'aco':
      return new ACORouter(options?.acoParams);
  }
}

export function computeHeuristicForNode(node: NodeMetrics): number {
  const util = Math.min(1, node.utilization / 100);
  const queuePenalty = Math.min(1, node.queueLength / 20);
  const latencyPenalty = Math.min(1, node.averageLatency / 300);
  const capacityBonus = node.capacity / 100;
  const degradedPenalty = node.degraded ? 0.3 : 0;
  return Math.max(
    0.01,
    0.3 * (1 - util) +
      0.25 * (1 - queuePenalty) +
      0.2 * (1 - latencyPenalty) +
      0.25 * capacityBonus -
      degradedPenalty
  );
}
