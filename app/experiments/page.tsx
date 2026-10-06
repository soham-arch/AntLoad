'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Trophy,
  Lightbulb,
} from 'lucide-react';
import { useSimulation } from '@/lib/simulation/SimulationContext';
import { EXPERIMENT_SCENARIOS } from '@/lib/data/experiments';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ComparisonTable } from '@/components/shared/ComparisonTable';
import { RankingIndicator } from '@/components/shared/ComparisonTable';
import { ComparisonBarChart, ComparisonLineChart, RadarComparison } from '@/components/shared/ComparisonCharts';
import { ALGORITHM_INFO, WORKLOAD_PATTERNS } from '@/types/algorithms';
import type { ExperimentResult } from '@/types/simulation';
import { cn } from '@/lib/utils';

export default function ExperimentsPage() {
  const { runExperiment } = useSimulation();
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ExperimentResult>>({});

  const handleRun = async (expId: string) => {
    const config = EXPERIMENT_SCENARIOS.find((e) => e.id === expId);
    if (!config) return;
    setRunning(expId);
    // Allow UI to update before heavy computation
    await new Promise((r) => setTimeout(r, 50));
    const result = await runExperiment(config);
    setResults((prev) => ({ ...prev, [expId]: result }));
    setRunning(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Experiments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Run pre-configured experiment scenarios that evaluate all four routing algorithms
          under controlled conditions. Results are calculated from simulation data, not hardcoded.
        </p>
      </div>

      {/* Experiment cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPERIMENT_SCENARIOS.map((exp, i) => {
          const result = results[exp.id];
          const isRunning = running === exp.id;
          const workloadInfo = WORKLOAD_PATTERNS[exp.workloadPattern];

          return (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex"
            >
              <Card className={cn(
                'w-full border-border/50 bg-card/40 backdrop-blur-sm p-4 flex flex-col justify-between',
                result && 'border-primary/20'
              )}>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary/50">
                        <FlaskConical className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Experiment {i + 1}
                      </span>
                    </div>
                    {result && (
                      <Badge variant="outline" className="border-success/30 text-success gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" />
                        Done
                      </Badge>
                    )}
                  </div>

                  <h3 className="mt-3 text-sm font-semibold">{exp.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {exp.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">{workloadInfo.name}</Badge>
                    <Badge variant="outline" className="text-xs">{exp.requestRate} req/s</Badge>
                    <Badge variant="outline" className="text-xs">{exp.duration}s</Badge>
                    <Badge variant="outline" className="text-xs">{exp.nodeCount} nodes</Badge>
                    {exp.degradeNode && (
                      <Badge variant="outline" className="text-xs border-warning/30 text-warning">
                        Degrades {exp.degradeNode}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => handleRun(exp.id)}
                  disabled={isRunning}
                  size="sm"
                  className="mt-4 w-full gap-2 justify-center"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Running...
                    </>
                  ) : result ? (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      Re-run Experiment
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      Run Experiment
                    </>
                  )}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Results section */}
      <AnimatePresence>
        {Object.keys(results).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Separator />
            <h2 className="text-lg font-semibold">Experiment Results</h2>

            {Object.entries(results).map(([expId, result]) => {
              const exp = EXPERIMENT_SCENARIOS.find((e) => e.id === expId);
              if (!exp) return null;
              return (
                <ExperimentResultSection
                  key={expId}
                  experimentName={exp.name}
                  result={result}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {Object.keys(results).length === 0 && (
        <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-12 text-center">
          <FlaskConical className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Run an experiment to see detailed results comparing all four algorithms.
          </p>
        </Card>
      )}
    </div>
  );
}

function ExperimentResultSection({
  experimentName,
  result,
}: {
  experimentName: string;
  result: ExperimentResult;
}) {
  const [showCharts, setShowCharts] = useState(true);

  const winners = [
    { label: 'Best Avg Latency', algo: result.bestLatency },
    { label: 'Best Throughput', algo: result.bestThroughput },
    { label: 'Best Load Balance', algo: result.bestLoadBalance },
    { label: 'Lowest P95', algo: result.lowestP95 },
  ];

  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-semibold">{experimentName}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCharts(!showCharts)}
          className="text-xs"
        >
          {showCharts ? 'Hide Charts' : 'Show Charts'}
        </Button>
      </div>

      {/* Winners */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {winners.map((w) => {
          const info = ALGORITHM_INFO[w.algo];
          return (
            <div
              key={w.label}
              className="rounded-lg border border-border/40 bg-secondary/20 p-3"
            >
              <div className="text-xs text-muted-foreground">{w.label}</div>
              <div className="mt-1.5 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-success" />
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                <span className="text-sm font-semibold">{info.shortName}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Research insight */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              Research Insight
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.insight}</p>
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Overall Rankings
        </div>
        <RankingIndicator rankings={result.rankings} />
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <ChartContainer title="Average Latency" subtitle="Lower is better (ms)">
              <ComparisonBarChart results={result.results} metric="averageLatency" label="Avg Latency" unit="ms" lowerIsBetter height={220} />
            </ChartContainer>
            <ChartContainer title="Throughput" subtitle="Higher is better (req/s)">
              <ComparisonBarChart results={result.results} metric="throughput" label="Throughput" unit=" req/s" height={220} />
            </ChartContainer>
            <ChartContainer title="P95 Latency" subtitle="Tail latency — lower is better (ms)">
              <ComparisonBarChart results={result.results} metric="p95Latency" label="P95 Latency" unit="ms" lowerIsBetter height={220} />
            </ChartContainer>
            <ChartContainer title="Load Balance Score" subtitle="Higher is better (%)">
              <ComparisonBarChart results={result.results} metric="loadBalanceScore" label="Load Balance" unit="%" height={220} />
            </ChartContainer>
          </div>

          {/* Line charts */}
          <ChartContainer title="Latency Over Time" subtitle="All algorithms on the same workload">
            <ComparisonLineChart results={result.results} metric="latencyOverTime" label="Latency" unit="ms" height={280} />
          </ChartContainer>

          <div className="grid lg:grid-cols-2 gap-4">
            <ChartContainer title="GPU Utilization Over Time" subtitle="Average utilization per algorithm">
              <ComparisonLineChart results={result.results} metric="utilizationOverTime" label="Utilization" unit="%" height={240} />
            </ChartContainer>
            <ChartContainer title="Queue Length Over Time" subtitle="Total queued requests per algorithm">
              <ComparisonLineChart results={result.results} metric="queueOverTime" label="Queue" height={240} />
            </ChartContainer>
          </div>

          {/* Radar */}
          <ChartContainer title="Multi-Metric Comparison" subtitle="All metrics normalized (higher = better)">
            <RadarComparison results={result.results} height={320} />
          </ChartContainer>

          {/* Table */}
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Detailed Metrics Table
            </div>
            <ComparisonTable
              results={result.results}
              bestLatency={result.bestLatency}
              bestThroughput={result.bestThroughput}
              bestLoadBalance={result.bestLoadBalance}
              lowestP95={result.lowestP95}
            />
          </div>

          {/* Load distribution */}
          <LoadDistributionResults results={result.results} />
        </div>
      )}
    </Card>
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

function LoadDistributionResults({ results }: { results: ExperimentResult['results'] }) {
  return (
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
                      <div
                        className="h-full rounded-sm transition-all"
                        style={{ width: `${percent}%`, backgroundColor: info.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Note: Optimal distribution is not equal across nodes — heterogeneous GPUs have different capacities.
        A good routing algorithm sends more requests to higher-capacity nodes.
      </p>
    </div>
  );
}
