import type {
  SimulationConfig,
  AlgorithmResult,
  ExperimentConfig,
  ExperimentResult,
  AlgorithmType,
  SimulationState,
} from '@/types/simulation';
import { SimulationEngine } from '@/lib/simulation/engine';
import { apiClient, type ApiClient } from '@/lib/services/apiService';

/**
 * Service abstraction for simulation operations.
 * Connects the UI to the Python FastAPI backend with local fallback.
 */

export interface SimulationService {
  start(): void;
  pause(): void;
  reset(): void;
  tick(dt: number): void;
  setConfig(config: Partial<SimulationConfig>): void;
  getState(): SimulationState;
  injectBurst(): void;
  degradeNode(nodeId: string): void;
  restoreNode(nodeId: string): void;
  runExperiment(config: ExperimentConfig): Promise<ExperimentResult> | ExperimentResult;
  runComparison(
    baseConfig: SimulationConfig,
    algorithms?: AlgorithmType[]
  ): Promise<AlgorithmResult[]> | AlgorithmResult[];
}

export class LocalSimulationService implements SimulationService {
  private engine: SimulationEngine;

  constructor(config: SimulationConfig) {
    this.engine = new SimulationEngine(config);
  }

  start() {
    this.engine.start();
  }

  pause() {
    this.engine.pause();
  }

  reset() {
    this.engine.reset();
  }

  tick(dt: number) {
    this.engine.tick(dt);
  }

  setConfig(config: Partial<SimulationConfig>) {
    this.engine.setConfig(config);
  }

  getState(): SimulationState {
    return this.engine.getState();
  }

  injectBurst() {
    this.engine.injectBurst();
  }

  degradeNode(nodeId: string) {
    this.engine.degradeNode(nodeId);
  }

  restoreNode(nodeId: string) {
    this.engine.restoreNode(nodeId);
  }

  runExperiment(config: ExperimentConfig): ExperimentResult {
    return SimulationEngine.runExperiment(config);
  }

  runComparison(
    baseConfig: SimulationConfig,
    algorithms: AlgorithmType[] = ['round-robin', 'least-requests', 'weighted', 'aco']
  ): AlgorithmResult[] {
    return algorithms.map((alg) =>
      SimulationEngine.runFullSimulation({ ...baseConfig, algorithm: alg }, alg)
    );
  }
}

/**
 * FastAPI inference service that connects to the real Python backend.
 * Provides live synchronization with the FastAPI server.
 */
export class FastAPIInferenceService implements SimulationService {
  private client: ApiClient;
  private localFallback: LocalSimulationService;
  private currentState: SimulationState;
  private backendAvailable: boolean = true;
  private ticking: boolean = false;

  constructor(config: SimulationConfig, client: ApiClient = apiClient) {
    this.client = client;
    this.localFallback = new LocalSimulationService(config);
    this.currentState = this.localFallback.getState();

    // Initial state sync attempt from backend
    if (typeof window !== 'undefined') {
      this.client
        .getState()
        .then((state) => {
          if (state && state.nodes && state.nodes.length > 0) {
            this.currentState = state;
            this.backendAvailable = true;
          }
        })
        .catch(() => {
          this.backendAvailable = false;
        });
    }
  }

  start(): void {
    this.localFallback.start();
    this.currentState = { ...this.currentState, status: 'running' };
    this.client.startSimulation().catch(() => {
      this.backendAvailable = false;
    });
  }

  pause(): void {
    this.localFallback.pause();
    this.currentState = { ...this.currentState, status: 'paused' };
    this.client.pauseSimulation().catch(() => {
      this.backendAvailable = false;
    });
  }

  reset(): void {
    this.localFallback.reset();
    this.currentState = this.localFallback.getState();
    this.client
      .resetSimulation()
      .then(() => this.client.getState())
      .then((state) => {
        if (state) this.currentState = state;
      })
      .catch(() => {
        this.backendAvailable = false;
      });
  }

  tick(dt: number): void {
    if (this.backendAvailable && !this.ticking) {
      this.ticking = true;
      this.client
        .tick(dt)
        .then((state) => {
          if (state && state.nodes) {
            this.currentState = state;
            this.backendAvailable = true;
          }
        })
        .catch(() => {
          this.backendAvailable = false;
          this.localFallback.tick(dt);
          this.currentState = this.localFallback.getState();
        })
        .finally(() => {
          this.ticking = false;
        });
      return;
    }

    this.localFallback.tick(dt);
    this.currentState = this.localFallback.getState();
  }

  setConfig(config: Partial<SimulationConfig>): void {
    this.localFallback.setConfig(config);
    this.currentState = this.localFallback.getState();
    this.client.updateConfig(config).catch(() => {
      this.backendAvailable = false;
    });
  }

  getState(): SimulationState {
    return this.currentState;
  }

  injectBurst(): void {
    this.localFallback.injectBurst();
    this.client.injectBurst().catch(() => {
      this.backendAvailable = false;
    });
  }

  degradeNode(nodeId: string): void {
    this.localFallback.degradeNode(nodeId);
    this.client
      .degradeNode(nodeId)
      .then(() => this.client.getState())
      .then((state) => {
        if (state) this.currentState = state;
      })
      .catch(() => {
        this.backendAvailable = false;
      });
  }

  restoreNode(nodeId: string): void {
    this.localFallback.restoreNode(nodeId);
    this.client
      .restoreNode(nodeId)
      .then(() => this.client.getState())
      .then((state) => {
        if (state) this.currentState = state;
      })
      .catch(() => {
        this.backendAvailable = false;
      });
  }

  async runExperiment(config: ExperimentConfig): Promise<ExperimentResult> {
    try {
      const res = await this.client.runExperiment(config);
      this.backendAvailable = true;
      return res;
    } catch (err) {
      console.warn('Backend call failed, using local simulation engine fallback:', err);
      return this.localFallback.runExperiment(config);
    }
  }

  async runComparison(
    baseConfig: SimulationConfig,
    algorithms: AlgorithmType[] = ['round-robin', 'least-requests', 'weighted', 'aco']
  ): Promise<AlgorithmResult[]> {
    try {
      const res = await this.client.runComparison(baseConfig, algorithms);
      this.backendAvailable = true;
      return res;
    } catch (err) {
      console.warn('Backend call failed, using local simulation engine fallback:', err);
      return this.localFallback.runComparison(baseConfig, algorithms);
    }
  }
}

export function createSimulationService(config: SimulationConfig): SimulationService {
  return new FastAPIInferenceService(config, apiClient);
}
