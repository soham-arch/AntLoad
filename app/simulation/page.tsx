'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Clock,
  Gauge,
  TrendingUp,
  Cpu,
  Scale,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useSimulation } from '@/lib/simulation/SimulationContext';
import { SimulationControls } from '@/components/shared/SimulationControls';
import { NodeCard } from '@/components/shared/NodeCard';
import { RequestFlow } from '@/components/shared/RequestFlow';
import { SystemPipeline } from '@/components/shared/SystemPipeline';
import { PheromoneVisualization, ProbabilityBars } from '@/components/shared/PheromoneVisualization';
import { MetricCard } from '@/components/shared/MetricCard';
import { LatencyChart, UtilizationChart, QueueChart, ThroughputChart } from '@/components/shared/MetricCharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ALGORITHM_INFO } from '@/types/algorithms';
import type { RoutingDecision, NodeMetrics } from '@/types/simulation';
import { cn } from '@/lib/utils';

export default function SimulationPage() {
  const {
    config,
    nodes,
    kpis,
    recentDecisions,
    metricsHistory,
    pheromoneHistory,
    isRunning,
    degradeNode,
    restoreNode,
    state,
    setConfig,
  } = useSimulation();

  const [activeTab, setActiveTab] = useState('flow');
  const [pipelineStep, setPipelineStep] = useState(0);

  // Animate pipeline steps
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setPipelineStep((prev) => (prev + 1) % 8);
    }, 400);
    return () => clearInterval(interval);
  }, [isRunning]);

  const latestDecision = recentDecisions[recentDecisions.length - 1];
  const algoInfo = ALGORITHM_INFO[config.algorithm];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live Simulation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time routing of AI inference requests across heterogeneous GPU nodes
          </p>
        </div>
        <Badge
          variant="outline"
          className="gap-2 text-sm"
          style={{ borderColor: algoInfo.color + '40', color: algoInfo.color }}
        >
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: algoInfo.color }} />
          {algoInfo.name}
        </Badge>
      </div>

      {/* Pipeline */}
      <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-4 overflow-x-auto scrollbar-thin">
        <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          System Pipeline
        </div>
        <SystemPipeline active={isRunning} activeStep={pipelineStep} />
      </Card>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          <SimulationControls />

          {/* ACO params if ACO */}
          {config.algorithm === 'aco' && (
            <Card className="border-aco/20 bg-card/40 backdrop-blur-sm p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-aco" />
                ACO Parameters
              </div>
              <ACOParamSlider
                label="Alpha (α)"
                description="Pheromone influence"
                value={config.acoParams.alpha}
                min={0}
                max={5}
                step={0.1}
                onChange={(v) =>
                  setConfig({ acoParams: { ...config.acoParams, alpha: v } })
                }
              />
              <ACOParamSlider
                label="Beta (β)"
                description="Heuristic influence"
                value={config.acoParams.beta}
                min={0}
                max={5}
                step={0.1}
                onChange={(v) =>
                  setConfig({ acoParams: { ...config.acoParams, beta: v } })
                }
              />
              <ACOParamSlider
                label="Evaporation (ρ)"
                description="Pheromone decay rate"
                value={config.acoParams.evaporationRate}
                min={0.01}
                max={0.5}
                step={0.01}
                onChange={(v) =>
                  setConfig({ acoParams: { ...config.acoParams, evaporationRate: v } })
                }
              />
            </Card>
          )}
        </div>

        {/* Right: Visualizations */}
        <div className="space-y-4 min-w-0">
          {/* KPIs */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard label="Nodes" value={kpis.activeNodes} icon={Cpu} accent="info" compact />
            <MetricCard label="Req/s" value={kpis.requestsPerSec} icon={Activity} accent="primary" />
            <MetricCard label="Latency" value={kpis.averageLatency} unit="ms" icon={Clock} accent="warning" />
            <MetricCard label="Throughput" value={kpis.throughput} unit="/s" icon={TrendingUp} accent="success" />
            <MetricCard label="GPU %" value={kpis.gpuUtilization} icon={Gauge} accent="info" />
            <MetricCard label="Balance" value={kpis.loadBalanceScore} unit="%" icon={Scale} accent="success" />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="flow" className="gap-1.5">
                <Activity className="h-3.5 w-3.5" /> Request Flow
              </TabsTrigger>
              <TabsTrigger value="nodes" className="gap-1.5">
                <Cpu className="h-3.5 w-3.5" /> Nodes
              </TabsTrigger>
              <TabsTrigger value="charts" className="gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Metrics
              </TabsTrigger>
              {config.algorithm === 'aco' && (
                <TabsTrigger value="aco" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> ACO Decision
                </TabsTrigger>
              )}
            </TabsList>

            {/* Request Flow tab */}
            <TabsContent value="flow" className="space-y-4">
              <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-4">
                <div className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Live Request Routing
                </div>
                <RequestFlow decisions={recentDecisions} nodes={nodes} maxVisible={10} />
              </Card>

              {/* Latest decision detail */}
              {latestDecision && (
                <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Latest Decision — Request #{latestDecision.requestId}
                    </div>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: algoInfo.color + '40', color: algoInfo.color }}>
                      {algoInfo.shortName}
                    </Badge>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Selection Probabilities</div>
                      <ProbabilityBars
                        probabilities={latestDecision.probabilities}
                        nodes={nodes}
                        selectedNode={latestDecision.selectedNode}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Reasoning</div>
                      <ul className="space-y-1.5">
                        {latestDecision.reasoning.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex items-center gap-2 rounded-md border border-success/20 bg-success/5 px-3 py-2">
                        <Cpu className="h-4 w-4 text-success" />
                        <span className="text-sm font-semibold text-success">
                          Routed to {latestDecision.selectedNode}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Nodes tab */}
            <TabsContent value="nodes" className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {nodes.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    algorithm={config.algorithm}
                    onDegrade={degradeNode}
                    onRestore={restoreNode}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Charts tab */}
            <TabsContent value="charts" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title="Latency Over Time" subtitle="Average, P50, and P95 latency">
                  <LatencyChart data={metricsHistory} />
                </ChartCard>
                <ChartCard title="GPU Utilization" subtitle="Average utilization across all nodes">
                  <UtilizationChart data={metricsHistory} />
                </ChartCard>
                <ChartCard title="Queue Length" subtitle="Total queued requests across all nodes">
                  <QueueChart data={metricsHistory} />
                </ChartCard>
                <ChartCard title="Throughput" subtitle="Requests completed per second">
                  <ThroughputChart data={metricsHistory} />
                </ChartCard>
              </div>
            </TabsContent>

            {/* ACO tab */}
            {config.algorithm === 'aco' && (
              <TabsContent value="aco" className="space-y-4">
                <div className="grid lg:grid-cols-2 gap-4">
                  <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-aco" />
                      <span className="text-sm font-semibold">Pheromone Values</span>
                    </div>
                    <PheromoneVisualization nodes={nodes} />
                  </Card>

                  {latestDecision && (
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-4">
                      <div className="mb-3 text-sm font-semibold">ACO Decision Breakdown</div>
                      <div className="space-y-3">
                        {nodes.map((node) => {
                          const prob = latestDecision.probabilities[node.id] ?? 0;
                          const isSelected = node.id === latestDecision.selectedNode;
                          return (
                            <div key={node.id} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className={cn('font-mono', isSelected && 'text-aco font-semibold')}>
                                  {node.id}
                                </span>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                  <span>τ={node.pheromone.toFixed(2)}</span>
                                  <span>η={node.heuristic.toFixed(2)}</span>
                                  <span className={cn('font-medium tabular-nums', isSelected ? 'text-aco' : 'text-muted-foreground')}>
                                    P={(prob * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              <div className="relative h-2 w-full overflow-hidden rounded-sm bg-secondary/50">
                                <div
                                  className={cn('absolute h-full rounded-sm transition-all', isSelected ? 'bg-aco' : 'bg-info/40')}
                                  style={{ width: `${prob * 100}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 rounded-md border border-aco/20 bg-aco/5 px-3 py-2 text-xs text-muted-foreground">
                        <span className="text-aco font-semibold">Selected: {latestDecision.selectedNode}</span>
                        {' — '}
                        {latestDecision.reasoning[latestDecision.reasoning.length - 1]}
                      </div>
                    </Card>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-4">
      <div className="mb-2">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
      {children}
    </Card>
  );
}

function ACOParamSlider({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-medium">{label}</span>
          <span className="text-xs text-muted-foreground ml-1.5">{description}</span>
        </div>
        <span className="text-xs font-semibold tabular-nums text-aco">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full bg-secondary appearance-none cursor-pointer accent-aco"
      />
    </div>
  );
}
