import type { ExperimentConfig } from '@/types/simulation';

export const EXPERIMENT_SCENARIOS: ExperimentConfig[] = [
  {
    id: 'exp1-stable',
    name: 'Stable Workload',
    description:
      'Constant request rate with mixed complexity. Establishes baseline performance under steady-state conditions.',
    workloadPattern: 'stable',
    requestRate: 50,
    duration: 30,
    nodeCount: 3,
    heterogeneity: 'high',
  },
  {
    id: 'exp2-burst',
    name: 'Sudden Traffic Burst',
    description:
      'Simulates a sudden increase in inference traffic to evaluate how quickly each routing strategy adapts to load spikes.',
    workloadPattern: 'bursty',
    requestRate: 60,
    duration: 30,
    nodeCount: 3,
    heterogeneity: 'high',
  },
  {
    id: 'exp3-heterogeneous',
    name: 'Heterogeneous GPU Cluster',
    description:
      'Highly diverse GPU cluster with varying capacities. Tests whether algorithms account for node heterogeneity in routing decisions.',
    workloadPattern: 'mixed',
    requestRate: 50,
    duration: 30,
    nodeCount: 5,
    heterogeneity: 'high',
  },
  {
    id: 'exp4-degradation',
    name: 'Node Performance Degradation',
    description:
      'One node degrades mid-experiment. Evaluates how quickly each algorithm detects the degradation and reroutes traffic away from the affected node.',
    workloadPattern: 'mixed',
    requestRate: 50,
    duration: 30,
    nodeCount: 3,
    heterogeneity: 'high',
    degradeNode: 'GPU-01',
  },
  {
    id: 'exp5-increasing',
    name: 'Increasing Workload',
    description:
      'Request rate ramps up over time. Tests behavior under sustained rising load and whether algorithms can prevent cascading overload.',
    workloadPattern: 'increasing',
    requestRate: 80,
    duration: 30,
    nodeCount: 3,
    heterogeneity: 'high',
  },
  {
    id: 'exp6-mixed-complexity',
    name: 'Mixed Request Complexity',
    description:
      'Realistic blend of light, medium, and heavy inference requests. General-purpose evaluation mimicking production AI inference traffic.',
    workloadPattern: 'mixed',
    requestRate: 55,
    duration: 30,
    nodeCount: 4,
    heterogeneity: 'medium',
  },
];
