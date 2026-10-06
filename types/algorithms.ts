import type { AlgorithmType, WorkloadPattern } from './simulation';

export const ALGORITHM_INFO: Record<
  AlgorithmType,
  { name: string; shortName: string; description: string; color: string; accent: string }
> = {
  'round-robin': {
    name: 'Round Robin',
    shortName: 'RR',
    description:
      'Distributes requests cyclically across nodes without considering workload. Simple and fair in count, but ignores node capacity and current load.',
    color: 'hsl(var(--chart-1))',
    accent: 'text-info',
  },
  'least-requests': {
    name: 'Least Outstanding Requests',
    shortName: 'LOR',
    description:
      'Routes each request to the node with the fewest active requests. Reacts to current load but ignores node heterogeneity and latency.',
    color: 'hsl(var(--chart-2))',
    accent: 'text-success',
  },
  weighted: {
    name: 'Weighted Workload',
    shortName: 'WT',
    description:
      'Scores each node using a weighted combination of utilization, queue length, latency, and capacity. Adapts to current conditions with configurable priorities.',
    color: 'hsl(var(--chart-3))',
    accent: 'text-warning',
  },
  aco: {
    name: 'Workload-Aware ACO',
    shortName: 'ACO',
    description:
      'Combines pheromone-based historical routing quality with current workload heuristics. Learns from completed inferences and adapts via evaporation and reinforcement.',
    color: 'hsl(var(--aco))',
    accent: 'text-aco',
  },
};

export const WORKLOAD_PATTERNS: Record<
  WorkloadPattern,
  { name: string; description: string }
> = {
  stable: {
    name: 'Stable',
    description: 'Constant request rate with mixed complexity. Baseline steady-state workload.',
  },
  bursty: {
    name: 'Bursty',
    description: 'Periodic traffic bursts with quiet intervals. Tests adaptive response.',
  },
  increasing: {
    name: 'Increasing',
    description: 'Request rate ramps up over time. Tests behavior under rising load.',
  },
  decreasing: {
    name: 'Decreasing',
    description: 'Request rate ramps down over time. Tests recovery and rebalancing.',
  },
  random: {
    name: 'Random',
    description: 'Unpredictable fluctuations. Tests robustness under noisy conditions.',
  },
  heavy: {
    name: 'Heavy AI Requests',
    description: 'Predominantly heavy-complexity requests. Tests capacity awareness.',
  },
  mixed: {
    name: 'Mixed Workload',
    description: 'Realistic blend of light, medium, and heavy requests. General-purpose evaluation.',
  },
};
