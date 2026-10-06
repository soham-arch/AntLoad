'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  Clock,
  Gauge,
  TrendingUp,
  Cpu,
  Scale,
  ArrowRight,
  Play,
  BarChart3,
  Bug,
  FlaskConical,
  BookOpen,
  CircuitBoard,
} from 'lucide-react';
import { useSimulation } from '@/lib/simulation/SimulationContext';
import { MetricCard } from '@/components/shared/MetricCard';
import { NodeCard } from '@/components/shared/NodeCard';
import { ArchitectureDiagram } from '@/components/shared/ArchitectureDiagram';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ALGORITHM_INFO } from '@/types/algorithms';

export default function OverviewPage() {
  const { kpis, nodes, config, isRunning, start } = useSimulation();
  const algoInfo = ALGORITHM_INFO[config.algorithm];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative pt-6 pb-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <Badge variant="outline" className="border-primary/20 text-primary gap-1.5">
              <CircuitBoard className="h-3 w-3" />
              Research Platform
            </Badge>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight max-w-3xl">
              Dynamic AI Inference Load Balancing
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm lg:text-base leading-relaxed">
              Evaluate how intelligent routing policies distribute inference workloads across
              heterogeneous computing nodes under changing system conditions. This platform
              experiments with workload-aware Ant Colony Optimization against conventional
              routing strategies.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={start} className="gap-2" disabled={isRunning}>
                <Play className="h-4 w-4" />
                Run Live Simulation
              </Button>
              <Link href="/comparison">
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Compare Algorithms
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* KPI cards */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            System Metrics
          </h2>
          <span className="text-xs text-muted-foreground">
            {isRunning ? 'Live data' : 'Idle — start simulation for live updates'}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            label="Active Nodes"
            value={kpis.activeNodes}
            icon={Cpu}
            accent="info"
            tooltip="Number of inference nodes currently online and accepting requests"
          />
          <MetricCard
            label="Requests/sec"
            value={kpis.requestsPerSec}
            unit="req/s"
            icon={Activity}
            accent="primary"
            tooltip="Current rate of incoming inference requests"
          />
          <MetricCard
            label="Avg Latency"
            value={kpis.averageLatency}
            unit="ms"
            icon={Clock}
            accent={kpis.averageLatency < 100 ? 'success' : kpis.averageLatency < 200 ? 'warning' : 'danger'}
            tooltip="Average end-to-end latency across all completed requests"
          />
          <MetricCard
            label="Throughput"
            value={kpis.throughput}
            unit="req/s"
            icon={TrendingUp}
            accent="success"
            tooltip="Number of requests successfully processed per second"
          />
          <MetricCard
            label="GPU Util"
            value={kpis.gpuUtilization}
            unit="%"
            icon={Gauge}
            accent={kpis.gpuUtilization < 70 ? 'success' : kpis.gpuUtilization < 85 ? 'warning' : 'danger'}
            tooltip="Average GPU utilization across all active nodes"
          />
          <MetricCard
            label="Load Balance"
            value={kpis.loadBalanceScore}
            unit="%"
            icon={Scale}
            accent={kpis.loadBalanceScore > 85 ? 'success' : kpis.loadBalanceScore > 70 ? 'warning' : 'danger'}
            tooltip="How evenly load is distributed. Higher is better, but perfect equality isn't optimal for heterogeneous nodes."
          />
        </div>
      </section>

      {/* Architecture + Nodes */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Architecture */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              System Architecture
            </h2>
            <Badge
              variant="outline"
              className="gap-1.5 text-xs"
              style={{ borderColor: algoInfo.color + '40', color: algoInfo.color }}
            >
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: algoInfo.color }} />
              {algoInfo.name}
            </Badge>
          </div>
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-4">
            <ArchitectureDiagram algorithm={config.algorithm} active={isRunning} />
          </Card>
        </section>

        {/* Node monitor */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Inference Nodes
            </h2>
            <span className="text-xs text-muted-foreground">{nodes.length} GPUs</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {nodes.slice(0, 4).map((node) => (
              <NodeCard key={node.id} node={node} algorithm={config.algorithm} compact />
            ))}
          </div>
        </section>
      </div>

      {/* Navigation cards */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Explore the Platform
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/simulation', icon: Activity, label: 'Live Simulation', desc: 'Run real-time routing experiments with full controls', accent: 'primary' },
            { href: '/experiments', icon: FlaskConical, label: 'Experiments', desc: 'Pre-configured scenarios for formal evaluation', accent: 'warning' },
            { href: '/comparison', icon: BarChart3, label: 'Algorithm Comparison', desc: 'Run all four algorithms on the same workload', accent: 'success' },
            { href: '/aco', icon: Bug, label: 'ACO Explorer', desc: 'Interactive visualization of pheromone-based routing', accent: 'aco' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="group h-full border-border/50 bg-card/40 backdrop-blur-sm p-4 transition-all hover:border-primary/30 hover:bg-primary/5 cursor-pointer">
                <div className="flex items-start justify-between">
                  <item.icon className={`h-5 w-5 text-${item.accent === 'aco' ? 'aco' : item.accent}`} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-3 text-sm font-semibold">{item.label}</div>
                <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Research question */}
      <section>
        <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Research Question</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            Under dynamically changing and heterogeneous AI inference workloads, can
            workload-aware Ant Colony Optimization reduce inference latency and improve
            throughput, load distribution, and resource utilization compared with
            conventional routing strategies?
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/research">
              <Button variant="outline" size="sm" className="gap-2">
                <BookOpen className="h-3.5 w-3.5" />
                Read the Research
              </Button>
            </Link>
            <Link href="/comparison">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="h-3.5 w-3.5" />
                See the Results
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
