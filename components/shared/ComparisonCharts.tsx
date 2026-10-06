'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import type { AlgorithmResult } from '@/types/simulation';
import { ALGORITHM_INFO } from '@/types/algorithms';
import type { AlgorithmType } from '@/types/simulation';

const ALGO_ORDER: AlgorithmType[] = ['round-robin', 'least-requests', 'weighted', 'aco'];

interface ComparisonBarChartProps {
  results: AlgorithmResult[];
  metric: keyof Pick<
    AlgorithmResult,
    'averageLatency' | 'p50Latency' | 'p95Latency' | 'throughput' | 'gpuUtilization' | 'loadVariance' | 'loadBalanceScore' | 'queueLength' | 'completionRate'
  >;
  label: string;
  unit?: string;
  lowerIsBetter?: boolean;
  height?: number;
}

export function ComparisonBarChart({
  results,
  metric,
  label,
  unit = '',
  lowerIsBetter = false,
  height = 240,
}: ComparisonBarChartProps) {
  const data = ALGO_ORDER.map((alg) => {
    const result = results.find((r) => r.algorithm === alg);
    return {
      name: ALGORITHM_INFO[alg].shortName,
      algorithm: alg,
      value: result ? result[metric] : 0,
      color: ALGORITHM_INFO[alg].color,
    };
  });

  const bestValue = lowerIsBetter
    ? Math.min(...data.map((d) => d.value))
    : Math.max(...data.map((d) => d.value));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value.toFixed(1)}${unit}`, label]}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} name={label}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              opacity={entry.value === bestValue ? 1 : 0.5}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ComparisonLineChartProps {
  results: AlgorithmResult[];
  metric: 'latencyOverTime' | 'utilizationOverTime' | 'queueOverTime';
  label: string;
  unit?: string;
  height?: number;
}

export function ComparisonLineChart({
  results,
  metric,
  label,
  unit = '',
  height = 280,
}: ComparisonLineChartProps) {
  const dataKey = metric === 'latencyOverTime' ? 'latency' : metric === 'utilizationOverTime' ? 'utilization' : 'queueLength';

  // Merge all time series into one array keyed by time
  const timeMap: Record<number, Record<string, number>> = {};
  ALGO_ORDER.forEach((alg) => {
    const result = results.find((r) => r.algorithm === alg);
    if (result) {
      result[metric].forEach((point) => {
        const t = point.time;
        if (!timeMap[t]) timeMap[t] = { time: t };
        timeMap[t][ALGORITHM_INFO[alg].shortName] = (point as Record<string, number>)[dataKey];
      });
    }
  });

  const chartData = Object.values(timeMap).sort((a, b) => a.time - b.time).map((d) => ({
    ...d,
    time: d.time.toFixed(1),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="time"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Time (s)', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          label={{ value: `${label}${unit ? ` (${unit})` : ''}`, angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {ALGO_ORDER.map((alg) => {
          const info = ALGORITHM_INFO[alg];
          return (
            <Line
              key={alg}
              type="monotone"
              dataKey={info.shortName}
              stroke={info.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface RadarComparisonProps {
  results: AlgorithmResult[];
  height?: number;
}

export function RadarComparison({ results, height = 300 }: RadarComparisonProps) {
  // Normalize metrics to 0-100 scale (higher = better)
  const data = [
    {
      metric: 'Latency',
      ...normalizeMetric(results, 'averageLatency', true),
    },
    {
      metric: 'Throughput',
      ...normalizeMetric(results, 'throughput', false),
    },
    {
      metric: 'P95',
      ...normalizeMetric(results, 'p95Latency', true),
    },
    {
      metric: 'Balance',
      ...normalizeMetric(results, 'loadBalanceScore', false),
    },
    {
      metric: 'Completion',
      ...normalizeMetric(results, 'completionRate', false),
    },
    {
      metric: 'Utilization',
      ...normalizeMetric(results, 'gpuUtilization', false),
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 8, right: 30, left: 30, bottom: 8 }}>
        <PolarGrid stroke="hsl(var(--border))" opacity={0.3} />
        <PolarAngleAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" fontSize={10} />
        <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" fontSize={9} domain={[0, 100]} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {ALGO_ORDER.map((alg) => (
          <Radar
            key={alg}
            name={ALGORITHM_INFO[alg].shortName}
            dataKey={ALGORITHM_INFO[alg].shortName}
            stroke={ALGORITHM_INFO[alg].color}
            fill={ALGORITHM_INFO[alg].color}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}

function normalizeMetric(
  results: AlgorithmResult[],
  metric: keyof AlgorithmResult,
  lowerIsBetter: boolean
): Record<string, number> {
  const values = results.map((r) => r[metric] as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const result: Record<string, number> = {};
  results.forEach((r) => {
    const shortName = ALGORITHM_INFO[r.algorithm].shortName;
    const normalized = ((r[metric] as number) - min) / range;
    result[shortName] = lowerIsBetter ? (1 - normalized) * 100 : normalized * 100;
  });
  return result;
}
