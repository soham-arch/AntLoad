import type { NodeMetrics, HeterogeneityLevel, SimulationConfig } from '@/types/simulation';

interface GPUProfile {
  name: string;
  capacity: number;
}

const GPU_PROFILES: Record<HeterogeneityLevel, GPUProfile[]> = {
  low: [
    { name: 'RTX 4090', capacity: 100 },
    { name: 'RTX 4090', capacity: 95 },
    { name: 'RTX 4090', capacity: 100 },
    { name: 'RTX 4090', capacity: 95 },
    { name: 'RTX 4090', capacity: 100 },
    { name: 'RTX 4090', capacity: 95 },
    { name: 'RTX 4090', capacity: 100 },
    { name: 'RTX 4090', capacity: 95 },
  ],
  medium: [
    { name: 'RTX 4090', capacity: 100 },
    { name: 'RTX 3090', capacity: 75 },
    { name: 'RTX 4090', capacity: 95 },
    { name: 'RTX 3080', capacity: 65 },
    { name: 'RTX 3090', capacity: 75 },
    { name: 'RTX 4090', capacity: 100 },
    { name: 'RTX 3080', capacity: 65 },
    { name: 'RTX 3090', capacity: 75 },
  ],
  high: [
    { name: 'RTX 4090', capacity: 100 },
    { name: 'RTX 3090', capacity: 75 },
    { name: 'RTX 3060', capacity: 45 },
    { name: 'A100 80GB', capacity: 120 },
    { name: 'RTX 3080', capacity: 60 },
    { name: 'T4', capacity: 35 },
    { name: 'RTX 4080', capacity: 85 },
    { name: 'RTX 3050', capacity: 30 },
  ],
};

export function createNodes(count: number, heterogeneity: HeterogeneityLevel): NodeMetrics[] {
  const profiles = GPU_PROFILES[heterogeneity];
  return Array.from({ length: count }, (_, i) => {
    const profile = profiles[i % profiles.length];
    // Deterministic initial baseline: identical across SSR and client hydration
    const initUtil = 22.0 + ((i * 3.5) % 10.0);
    const initLatency = 55.0 + ((i * 7.5) % 25.0);
    return {
      id: `GPU-${String(i + 1).padStart(2, '0')}`,
      gpuName: profile.name,
      capacity: profile.capacity,
      utilization: Math.round(initUtil * 10) / 10,
      queueLength: 0,
      activeRequests: 0,
      averageLatency: Math.round(initLatency * 10) / 10,
      throughput: 0,
      pheromone: 0.5,
      heuristic: 0.5,
      health: 'healthy',
      degraded: false,
      totalProcessed: 0,
      totalFailed: 0,
    };
  });
}

export const DEFAULT_CONFIG: SimulationConfig = {
  algorithm: 'aco',
  workloadPattern: 'mixed',
  requestRate: 50,
  nodeCount: 3,
  heterogeneity: 'high',
  duration: 30,
  acoParams: {
    alpha: 1,
    beta: 2,
    evaporationRate: 0.1,
    reinforcementBase: 0.5,
  },
  weightedParams: {
    wUtilization: 0.3,
    wQueue: 0.25,
    wLatency: 0.25,
    wCapacity: 0.2,
  },
};

export const COMPLEXITY_PROFILES = {
  light: { computeMultiplier: 0.3, latencyBase: 40, weight: 0.35 },
  medium: { computeMultiplier: 0.7, latencyBase: 90, weight: 0.45 },
  heavy: { computeMultiplier: 1.5, latencyBase: 200, weight: 0.2 },
} as const;
