'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { MetricsSnapshot } from '@/types/simulation';

interface LatencyChartProps {
  data: MetricsSnapshot[];
  height?: number;
  showP95?: boolean;
}

export function LatencyChart({ data, height = 220, showP95 = true }: LatencyChartProps) {
  const chartData = data.map((m) => ({
    time: m.timestamp.toFixed(1),
    avg: m.averageLatency,
    p50: m.p50Latency,
    p95: m.p95Latency,
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
          label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
          labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
        />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={false}
          name="Avg Latency"
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="p50"
          stroke="hsl(var(--chart-2))"
          strokeWidth={1.5}
          dot={false}
          name="P50"
          strokeDasharray="4 4"
          isAnimationActive={false}
        />
        {showP95 && (
          <Line
            type="monotone"
            dataKey="p95"
            stroke="hsl(var(--chart-5))"
            strokeWidth={1.5}
            dot={false}
            name="P95"
            strokeDasharray="2 2"
            isAnimationActive={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface UtilizationChartProps {
  data: MetricsSnapshot[];
  height?: number;
}

export function UtilizationChart({ data, height = 200 }: UtilizationChartProps) {
  const chartData = data.map((m) => ({
    time: m.timestamp.toFixed(1),
    utilization: m.gpuUtilization,
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
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
        />
        <ReferenceLine y={80} stroke="hsl(var(--warning))" strokeDasharray="4 4" opacity={0.5} />
        <Line
          type="monotone"
          dataKey="utilization"
          stroke="hsl(var(--chart-3))"
          strokeWidth={2}
          dot={false}
          name="GPU Utilization %"
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface QueueChartProps {
  data: MetricsSnapshot[];
  height?: number;
}

export function QueueChart({ data, height = 200 }: QueueChartProps) {
  const chartData = data.map((m) => ({
    time: m.timestamp.toFixed(1),
    queue: m.totalQueueLength,
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
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="queue"
          stroke="hsl(var(--chart-4))"
          strokeWidth={2}
          dot={false}
          name="Total Queue"
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface ThroughputChartProps {
  data: MetricsSnapshot[];
  height?: number;
}

export function ThroughputChart({ data, height = 200 }: ThroughputChartProps) {
  const chartData = data.map((m) => ({
    time: m.timestamp.toFixed(1),
    throughput: m.throughput,
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
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="throughput"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={false}
          name="Throughput (req/s)"
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
