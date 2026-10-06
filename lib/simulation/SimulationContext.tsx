'use client';

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import type {
  SimulationConfig,
  SimulationState,
  NodeMetrics,
  RoutingDecision,
  InferenceRequest,
  MetricsSnapshot,
  AlgorithmResult,
  ExperimentConfig,
  ExperimentResult,
  AlgorithmType,
  KPIMetrics,
} from '@/types/simulation';
import { DEFAULT_CONFIG } from '@/lib/data/mockData';
import {
  createSimulationService,
  type SimulationService,
} from '@/lib/services/simulationService';
import { calculateKPIMetrics } from '@/lib/metrics/calculator';

interface SimulationContextValue {
  config: SimulationConfig;
  state: SimulationState;
  kpis: KPIMetrics;
  nodes: NodeMetrics[];
  recentDecisions: RoutingDecision[];
  metricsHistory: MetricsSnapshot[];
  pheromoneHistory: Record<string, number>[];
  isRunning: boolean;
  isPaused: boolean;
  presentationMode: boolean;
  setConfig: (updates: Partial<SimulationConfig>) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  injectBurst: () => void;
  degradeNode: (nodeId: string) => void;
  restoreNode: (nodeId: string) => void;
  runComparison: (
    baseConfig: SimulationConfig,
    algorithms?: AlgorithmType[]
  ) => Promise<AlgorithmResult[]> | AlgorithmResult[];
  runExperiment: (config: ExperimentConfig) => Promise<ExperimentResult> | ExperimentResult;
  togglePresentationMode: () => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const serviceRef = useRef<SimulationService>(createSimulationService(DEFAULT_CONFIG));
  const [config, setConfigState] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<SimulationState>(() => serviceRef.current.getState());
  const [presentationMode, setPresentationMode] = useState(false);
  const lastTickRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const syncState = useCallback(() => {
    setState(serviceRef.current.getState());
  }, []);

  const tick = useCallback(() => {
    const now = performance.now();
    const dt = Math.min(0.5, (now - lastTickRef.current) / 1000);
    lastTickRef.current = now;
    serviceRef.current.tick(dt);
    syncState();
  }, [syncState]);

  useEffect(() => {
    if (state.status === 'running') {
      lastTickRef.current = performance.now();
      const interval = setInterval(tick, 100);
      return () => clearInterval(interval);
    }
  }, [state.status, tick]);

  const setConfig = useCallback((updates: Partial<SimulationConfig>) => {
    serviceRef.current.setConfig(updates);
    setConfigState((prev) => ({ ...prev, ...updates }));
    syncState();
  }, [syncState]);

  const start = useCallback(() => {
    serviceRef.current.start();
    syncState();
  }, [syncState]);

  const pause = useCallback(() => {
    serviceRef.current.pause();
    syncState();
  }, [syncState]);

  const reset = useCallback(() => {
    serviceRef.current.reset();
    syncState();
  }, [syncState]);

  const injectBurst = useCallback(() => {
    serviceRef.current.injectBurst();
    syncState();
  }, [syncState]);

  const degradeNode = useCallback((nodeId: string) => {
    serviceRef.current.degradeNode(nodeId);
    syncState();
  }, [syncState]);

  const restoreNode = useCallback((nodeId: string) => {
    serviceRef.current.restoreNode(nodeId);
    syncState();
  }, [syncState]);

  const runComparison = useCallback(
    (baseConfig: SimulationConfig, algorithms?: AlgorithmType[]) => {
      return serviceRef.current.runComparison(baseConfig, algorithms);
    },
    []
  );

  const runExperiment = useCallback((expConfig: ExperimentConfig) => {
    return serviceRef.current.runExperiment(expConfig);
  }, []);

  const togglePresentationMode = useCallback(() => {
    setPresentationMode((prev) => !prev);
  }, []);

  const kpis = calculateKPIMetrics(
    state.nodes,
    state.requests.slice(-100),
    state.recentDecisions
  );

  const value: SimulationContextValue = {
    config,
    state,
    kpis,
    nodes: state.nodes,
    recentDecisions: state.recentDecisions,
    metricsHistory: state.metricsHistory,
    pheromoneHistory: state.pheromoneHistory,
    isRunning: state.status === 'running',
    isPaused: state.status === 'paused',
    presentationMode,
    setConfig,
    start,
    pause,
    reset,
    injectBurst,
    degradeNode,
    restoreNode,
    runComparison,
    runExperiment,
    togglePresentationMode,
  };

  return (
    <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider');
  return ctx;
}
