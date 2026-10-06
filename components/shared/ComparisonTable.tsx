'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ALGORITHM_INFO } from '@/types/algorithms';
import type { AlgorithmResult, AlgorithmType } from '@/types/simulation';
import { cn } from '@/lib/utils';
import { Trophy, Minus } from 'lucide-react';

interface ComparisonTableProps {
  results: AlgorithmResult[];
  bestLatency?: AlgorithmType;
  bestThroughput?: AlgorithmType;
  bestLoadBalance?: AlgorithmType;
  lowestP95?: AlgorithmType;
}

const ALGO_ORDER: AlgorithmType[] = ['round-robin', 'least-requests', 'weighted', 'aco'];

export function ComparisonTable({
  results,
  bestLatency,
  bestThroughput,
  bestLoadBalance,
  lowestP95,
}: ComparisonTableProps) {
  const metrics: {
    key: keyof AlgorithmResult;
    label: string;
    unit: string;
    lowerIsBetter: boolean;
    best?: AlgorithmType;
  }[] = [
    { key: 'averageLatency', label: 'Avg Latency', unit: 'ms', lowerIsBetter: true, best: bestLatency },
    { key: 'p50Latency', label: 'P50 Latency', unit: 'ms', lowerIsBetter: true },
    { key: 'p95Latency', label: 'P95 Latency', unit: 'ms', lowerIsBetter: true, best: lowestP95 },
    { key: 'throughput', label: 'Throughput', unit: 'req/s', lowerIsBetter: false, best: bestThroughput },
    { key: 'gpuUtilization', label: 'GPU Util', unit: '%', lowerIsBetter: false },
    { key: 'loadBalanceScore', label: 'Load Balance', unit: '%', lowerIsBetter: false, best: bestLoadBalance },
    { key: 'loadVariance', label: 'Load Variance', unit: '', lowerIsBetter: true },
    { key: 'queueLength', label: 'Queue Length', unit: '', lowerIsBetter: true },
    { key: 'completionRate', label: 'Completion', unit: '%', lowerIsBetter: false },
  ];

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Metric</th>
              {ALGO_ORDER.map((alg) => {
                const info = ALGORITHM_INFO[alg];
                return (
                  <th key={alg} className="text-right p-3 text-xs font-medium">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: info.color }} />
                      {info.shortName}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, i) => {
              const values = ALGO_ORDER.map((alg) => {
                const result = results.find((r) => r.algorithm === alg);
                return result ? (result[m.key] as number) : 0;
              });
              const bestValue = m.lowerIsBetter
                ? Math.min(...values)
                : Math.max(...values);

              return (
                <tr key={m.key} className={cn('border-b border-border/30', i % 2 === 1 && 'bg-secondary/10')}>
                  <td className="p-3 text-xs text-muted-foreground">{m.label}</td>
                  {ALGO_ORDER.map((alg, idx) => {
                    const value = values[idx];
                    const isBest = m.best
                      ? m.best === alg
                      : value === bestValue && bestValue !== 0;
                    return (
                      <td key={alg} className="p-3 text-right">
                        <span className={cn(
                          'tabular-nums font-medium',
                          isBest && 'text-success font-semibold'
                        )}>
                          {m.key === 'completionRate'
                            ? (value * 100).toFixed(1)
                            : value.toFixed(1)}
                          {m.unit && <span className="text-muted-foreground text-xs ml-0.5">{m.unit}</span>}
                          {isBest && <Trophy className="inline-block ml-1 h-3 w-3 text-success" />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

interface RankingIndicatorProps {
  rankings: { algorithm: AlgorithmType; score: number; rank: number }[];
}

export function RankingIndicator({ rankings }: RankingIndicatorProps) {
  const sorted = [...rankings].sort((a, b) => a.rank - b.rank);
  const medals = ['🥇', '🥈', '🥉', '4️⃣'];

  return (
    <div className="space-y-2">
      {sorted.map((r, i) => {
        const info = ALGORITHM_INFO[r.algorithm];
        return (
          <div
            key={r.algorithm}
            className={cn(
              'flex items-center gap-3 rounded-md border px-3 py-2',
              r.rank === 1
                ? 'border-success/30 bg-success/5'
                : 'border-border/40 bg-card/30'
            )}
          >
            <div className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
              r.rank === 1 ? 'bg-success/20 text-success' : 'bg-secondary text-muted-foreground'
            )}>
              {r.rank}
            </div>
            <div className="flex items-center gap-2 flex-1">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: info.color }} />
              <span className="text-sm font-medium">{info.name}</span>
            </div>
            <Badge variant="outline" className="text-xs tabular-nums">
              Score: {(r.score * 100).toFixed(1)}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
