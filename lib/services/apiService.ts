import type {
  SimulationConfig,
  ExperimentConfig,
  ExperimentResult,
  AlgorithmResult,
  AlgorithmType,
  SimulationState,
  NodeMetrics,
  RoutingDecision,
} from '@/types/simulation';

/**
 * API service client connecting the frontend directly to the FastAPI Python backend.
 *
 * Backend endpoints:
 *   GET  /api/health
 *   GET  /api/nodes
 *   GET  /api/simulation/state
 *   POST /api/simulation/start
 *   POST /api/simulation/pause
 *   POST /api/simulation/reset
 *   POST /api/simulation/tick
 *   POST /api/simulation/config
 *   POST /api/simulation/burst
 *   POST /api/simulation/request
 *   POST /api/nodes/{id}/degrade
 *   POST /api/nodes/{id}/restore
 *   POST /api/algorithms/decision
 *   POST /api/comparison/run
 *   POST /api/experiments/run
 *   GET  /api/experiments/{id}
 */

export interface ApiClient {
  startSimulation(config?: SimulationConfig): Promise<void>;
  pauseSimulation(): Promise<void>;
  resetSimulation(): Promise<void>;
  tick(dt?: number): Promise<SimulationState>;
  getState(): Promise<SimulationState>;
  getNodes(): Promise<NodeMetrics[]>;
  updateConfig(config: Partial<SimulationConfig>): Promise<void>;
  injectBurst(): Promise<void>;
  degradeNode(nodeId: string): Promise<void>;
  restoreNode(nodeId: string): Promise<void>;
  runExperiment(config: ExperimentConfig): Promise<ExperimentResult>;
  runComparison(
    baseConfig: SimulationConfig,
    algorithms?: AlgorithmType[]
  ): Promise<AlgorithmResult[]>;
  routeSingleRequest(): Promise<RoutingDecision>;
}

export class FastApiClient implements ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    // Empty baseUrl means relative path (proxied via Next.js rewrite or direct)
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`API Error [${res.status}] ${res.statusText}: ${errText}`);
    }
    return res.json();
  }

  async startSimulation(config?: SimulationConfig): Promise<void> {
    await this.request('/api/simulation/start', {
      method: 'POST',
      body: config ? JSON.stringify(config) : undefined,
    });
  }

  async pauseSimulation(): Promise<void> {
    await this.request('/api/simulation/pause', { method: 'POST' });
  }

  async resetSimulation(): Promise<void> {
    await this.request('/api/simulation/reset', { method: 'POST' });
  }

  async tick(dt: number = 0.1): Promise<SimulationState> {
    return this.request<SimulationState>('/api/simulation/tick', {
      method: 'POST',
      body: JSON.stringify({ dt }),
    });
  }

  async getState(): Promise<SimulationState> {
    return this.request<SimulationState>('/api/simulation/state');
  }

  async getNodes(): Promise<NodeMetrics[]> {
    return this.request<NodeMetrics[]>('/api/nodes');
  }

  async updateConfig(config: Partial<SimulationConfig>): Promise<void> {
    await this.request('/api/simulation/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async injectBurst(): Promise<void> {
    await this.request('/api/simulation/burst', { method: 'POST' });
  }

  async degradeNode(nodeId: string): Promise<void> {
    await this.request(`/api/nodes/${encodeURIComponent(nodeId)}/degrade`, {
      method: 'POST',
    });
  }

  async restoreNode(nodeId: string): Promise<void> {
    await this.request(`/api/nodes/${encodeURIComponent(nodeId)}/restore`, {
      method: 'POST',
    });
  }

  async runExperiment(config: ExperimentConfig): Promise<ExperimentResult> {
    return this.request<ExperimentResult>('/api/experiments/run', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async runComparison(
    baseConfig: SimulationConfig,
    algorithms?: AlgorithmType[]
  ): Promise<AlgorithmResult[]> {
    return this.request<AlgorithmResult[]>('/api/comparison/run', {
      method: 'POST',
      body: JSON.stringify({ baseConfig, algorithms }),
    });
  }

  async routeSingleRequest(): Promise<RoutingDecision> {
    return this.request<RoutingDecision>('/api/simulation/request', {
      method: 'POST',
    });
  }
}

// Export singleton connected to FastAPI backend
export const apiClient: ApiClient = new FastApiClient('');
