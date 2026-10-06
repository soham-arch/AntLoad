'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Play,
  Loader2,
  Trophy,
  Lightbulb,
  Settings2,
  Zap,
} from 'lucide-react';
import { useSimulation } from '@/lib/simulation/SimulationContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ComparisonTable, RankingIndicator } from '@/components/shared/ComparisonTable';
import { ComparisonBarChart, ComparisonLineChart, RadarComparison } from '@/components/shared/ComparisonCharts';
import { ALGORITHM_INFO, WORKLOAD_PATTERNS } from '@/types/algorithms';
import type { AlgorithmResult, AlgorithmType, WorkloadPattern, HeterogeneityLevel } from '@/types/simulation';
import { cn } from '@/lib/utils';

export default function ComparisonPage() {
  const { config, runComparison } = useSimulation();

  const [comparisonConfig, setComparisonConfig] = useState({
    workloadPattern: 'mixed' as WorkloadPattern,
    requestRate: 50,
    duration: 30,
    nodeCount: 3,
    heterogeneity: 'high' as HeterogeneityLevel,
  });

  const [results, setResults] = useState<AlgorithmResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [winners, setWinners] = useState<{
    bestLatency: AlgorithmType;
    bestThroughput: AlgorithmType;
    bestLoadBalance: AlgorithmType;
    lowestP95: AlgorithmType;
    rankings: { algorithm: AlgorithmType; score: number; rank: number }[];
    insight: string;
  } | null>(null);

  const handleRun = async () => {
    setRunning(true);
    await new Promise((r) => setTimeout(r, 50));
    const baseConfig = {
      ...config,
      algorithm: 'aco' as AlgorithmType,
      workloadPattern: comparisonConfig.workloadPattern,
      requestRate: comparisonConfig.requestRate,
      duration: comparisonConfig.duration,
      nodeCount: comparisonConfig.nodeCount,
      heterogeneity: comparisonConfig.heterogeneity,
    };
    const res = await runComparison(baseConfig);

    const bestLatency = res.reduce((b, r) => (r.averageLatency < b.averageLatency ? r : b)).algorithm;
    const bestThroughput = res.reduce((b, r) => (r.throughput > b.throughput ? r : b)).algorithm;
    const bestLoadBalance = res.reduce((b, r) => (r.loadBalanceScore > b.loadBalanceScore ? r : b)).algorithm;
    const lowestP95 = res.reduce((b, r) => (r.p95Latency < b.p95Latency ? r : b)).algorithm;

    const scored = res.map((r) => {
      const score =
        (1 / (r.averageLatency + 1)) * 0.3 +
        (r.throughput / 100) * 0.25 +
        (r.loadBalanceScore / 100) * 0.25 +
        (1 / (r.p95Latency + 1)) * 0.2;
      return { algorithm: r.algorithm, score, rank: 0 };
    });
    scored.sort((a, b) => b.score - a.score);
    scored.forEach((s, i) => (s.rank = i + 1));

    const aco = res.find((r) => r.algorithm === 'aco')!;
    const best = res.find((r) => r.algorithm === bestLatency)!;
    let insight: string;
    if (bestLatency === 'aco') {
      insight = `ACO achieved the lowest average latency (${aco.averageLatency}ms), as its routing decisions incorporated both current queue states and historical node performance.`;
    } else {
      insight = `${ALGORITHM_INFO[bestLatency].name} achieved the lowest average latency (${best.averageLatency}ms). ${aco.averageLatency > best.averageLatency ? 'ACO introduced additional decision overhead and did not outperform simpler heuristics under this workload.' : 'ACO was competitive but did not lead under this workload pattern.'}`;
    }

    setResults(res);
    setWinners({ bestLatency, bestThroughput, bestLoadBalance, lowestP95, rankings: scored, insight });
    setRunning(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Algorithm Comparison</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Run the same workload against all four routing algorithms and compare measured results.
          Winners are calculated from simulation data — not hardcoded.
        </p>
      </div>

      {/* Config panel */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Comparison Configuration</h3>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Workload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between h-5">
              <label className="text-xs font-medium text-muted-foreground">Workload Pattern</label>
            </div>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(WORKLOAD_PATTERNS) as WorkloadPattern[]).slice(0, 5).map((p) => (
                <button
                  key={p}
                  onClick={() => setComparisonConfig((c) => ({ ...c, workloadPattern: p }))}
                  className={cn(
                    'rounded-md border px-2 py-1 text-xs font-medium transition-all',
                    comparisonConfig.workloadPattern === p
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {WORKLOAD_PATTERNS[p].name}
                </button>
              ))}
            </div>
          </div>

          {/* Request rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between h-5">
              <label className="text-xs font-medium text-muted-foreground">Request Rate</label>
              <span className="text-xs font-semibold tabular-nums">{comparisonConfig.requestRate}/s</span>
            </div>
            <input
              type="range"
              min={10}
              max={150}
              value={comparisonConfig.requestRate}
              onChange={(e) => setComparisonConfig((c) => ({ ...c, requestRate: Number(e.target.value) }))}
              className="w-full h-2 rounded-full bg-secondary appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between h-5">
              <label className="text-xs font-medium text-muted-foreground">Duration</label>
            </div>
            <div className="flex gap-1">
              {[10, 30, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setComparisonConfig((c) => ({ ...c, duration: d }))}
                  className={cn(
                    'flex-1 rounded-md border py-1.5 text-xs font-medium transition-all',
                    comparisonConfig.duration === d
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Nodes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between h-5">
              <label className="text-xs font-medium text-muted-foreground">Nodes</label>
              <span className="text-xs font-semibold tabular-nums">{comparisonConfig.nodeCount}</span>
            </div>
            <div className="flex gap-1">
              {[3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => setComparisonConfig((c) => ({ ...c, nodeCount: n }))}
                  className={cn(
                    'flex-1 rounded-md border py-1.5 text-xs font-medium transition-all',
                    comparisonConfig.nodeCount === n
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-border/40 flex justify-end">
          <Button onClick={handleRun} disabled={running} className="gap-2 px-5 font-medium">
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running 4 Simulations...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Comparison
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {results && winners && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Winners */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Best Avg Latency', algo: winners.bestLatency },
                { label: 'Best Throughput', algo: winners.bestThroughput },
                { label: 'Best Load Balance', algo: winners.bestLoadBalance },
                { label: 'Lowest P95', algo: winners.lowestP95 },
              ].map((w) => {
                const info = ALGORITHM_INFO[w.algo];
                return (
                  <Card key={w.label} className="border-success/20 bg-success/5 backdrop-blur-sm p-4">
                    <div className="text-xs text-muted-foreground">{w.label}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-success" />
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: info.color }} />
                      <span className="text-sm font-bold">{info.name}</span>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Insight */}
            <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                    Research Insight
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{winners.insight}</p>
                </div>
              </div>
            </Card>

            {/* Rankings + Bar charts */}
            <div className="grid lg:grid-cols-[280px_1fr] gap-4">
              <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Overall Rankings
                </div>
                <RankingIndicator rankings={winners.rankings} />
              </Card>

              <div className="grid sm:grid-cols-2 gap-4">
                <ChartContainer title="Average Latency" subtitle="Lower is better (ms)">
                  <ComparisonBarChart results={results} metric="averageLatency" label="Avg Latency" unit="ms" lowerIsBetter />
                </ChartContainer>
                <ChartContainer title="P95 Latency" subtitle="Tail latency (ms)">
                  <ComparisonBarChart results={results} metric="p95Latency" label="P95" unit="ms" lowerIsBetter />
                </ChartContainer>
              </div>
            </div>

            {/* Line charts */}
            <div className="grid lg:grid-cols-2 gap-4">
              <ChartContainer title="Latency Over Time" subtitle="All algorithms, same workload">
                <ComparisonLineChart results={results} metric="latencyOverTime" label="Latency" unit="ms" height={260} />
              </ChartContainer>
              <ChartContainer title="GPU Utilization Over Time" subtitle="Average per algorithm">
                <ComparisonLineChart results={results} metric="utilizationOverTime" label="Util" unit="%" height={260} />
              </ChartContainer>
              <ChartContainer title="Queue Length Over Time" subtitle="Total queued requests">
                <ComparisonLineChart results={results} metric="queueOverTime" label="Queue" height={260} />
              </ChartContainer>
              <ChartContainer title="Throughput" subtitle="Requests completed per second">
                <ComparisonBarChart results={results} metric="throughput" label="Throughput" unit=" req/s" height={260} />
              </ChartContainer>
            </div>

            {/* Radar */}
            <ChartContainer title="Multi-Metric Radar" subtitle="All metrics normalized — higher is better">
              <RadarComparison results={results} height={340} />
            </ChartContainer>

            {/* Table */}
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Complete Metrics Table
              </div>
              <ComparisonTable
                results={results}
                bestLatency={winners.bestLatency}
                bestThroughput={winners.bestThroughput}
                bestLoadBalance={winners.bestLoadBalance}
                lowestP95={winners.lowestP95}
              />
            </div>

            {/* Load distribution */}
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Load Distribution Per Algorithm
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {results.map((r) => {
                  const info = ALGORITHM_INFO[r.algorithm];
                  const entries = Object.entries(r.distribution);
                  return (
                    <Card key={r.algorithm} className="border-border/50 bg-card/30 backdrop-blur-sm p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                        <span className="text-xs font-semibold">{info.shortName}</span>
                      </div>
                      <div className="space-y-1.5">
                        {entries.map(([nodeId, percent]) => (
                          <div key={nodeId} className="space-y-0.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-muted-foreground">{nodeId}</span>
                              <span className="tabular-nums font-medium">{percent.toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-sm bg-secondary/50">
                              <div className="h-full rounded-sm" style={{ width: `${percent}%`, backgroundColor: info.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Optimal distribution is not equal — heterogeneous GPUs have different capacities. A good
                algorithm routes more to higher-capacity nodes.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!results && !running && (
        <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-12 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Configure the comparison parameters above and click &quot;Run Comparison&quot; to evaluate
            all four algorithms on the same workload.
          </p>
        </Card>
      )}

      {running && (
        <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-12 text-center">
          <Loader2 className="h-8 w-8 text-primary mx-auto mb-3 animate-spin" />
          <p className="text-sm text-muted-foreground">
            Running 4 simulations in parallel...
          </p>
        </Card>
      )}
    </div>
  );
}

function ChartContainer({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
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
