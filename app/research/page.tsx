'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  Target,
  Lightbulb,
  ListChecks,
  GitCompare,
  Ruler,
  CircuitBoard,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ALGORITHM_INFO } from '@/types/algorithms';
import type { AlgorithmType } from '@/types/simulation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const OBJECTIVES = [
  'Reduce inference latency across heterogeneous computing nodes',
  'Improve throughput under dynamic workload conditions',
  'Improve load distribution proportional to node capacity',
  'Improve resource utilization across the GPU cluster',
  'Adapt to dynamic workload changes and node degradation',
];

const EVALUATION_METRICS = [
  { name: 'Average Latency', description: 'Mean end-to-end time from request arrival to completion' },
  { name: 'P95 Latency', description: '95th percentile latency — tail performance indicator' },
  { name: 'Throughput', description: 'Requests successfully completed per second' },
  { name: 'GPU Utilization', description: 'Average compute utilization across all nodes' },
  { name: 'Load Variance', description: 'Statistical variance of utilization across nodes' },
  { name: 'Queue Length', description: 'Total pending requests across all node queues' },
  { name: 'Load Balance Score', description: 'Composite score reflecting distribution quality' },
  { name: 'Completion Rate', description: 'Ratio of completed to total requests' },
];

export default function ResearchPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Research
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Academic overview of the project, proposed approach, and evaluation methodology.
        </p>
      </div>

      {/* Title card */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm p-6">
        <h2 className="text-lg font-semibold leading-snug max-w-3xl">
          A Workload-Aware Ant Colony Optimization Approach for Dynamic Load Balancing in AI
          Inference Systems
        </h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-3xl">
          This research platform evaluates whether workload-aware Ant Colony Optimization can
          provide measurable benefits over conventional routing strategies for distributing AI
          inference requests across heterogeneous computing nodes under dynamically changing
          workloads.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">AI Inference</Badge>
          <Badge variant="outline" className="text-xs">Load Balancing</Badge>
          <Badge variant="outline" className="text-xs">Ant Colony Optimization</Badge>
          <Badge variant="outline" className="text-xs">Heterogeneous Computing</Badge>
          <Badge variant="outline" className="text-xs">Dynamic Workload</Badge>
        </div>
      </Card>

      {/* Problem Statement */}
      <Section icon={Target} title="Problem Statement" accent="text-danger">
        <p className="text-sm text-muted-foreground leading-relaxed">
          AI inference systems serve requests using pools of heterogeneous GPU nodes with varying
          compute capacities. Incoming request rates fluctuate dynamically, and individual requests
          have different computational complexity (light, medium, heavy). Traditional routing
          methods — such as round-robin or least-connections — may not fully account for these
          factors:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/50" />
            Round-robin ignores node capacity and current load entirely, distributing equally even to weaker nodes.
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/50" />
            Least-connections reacts to current load but does not consider node heterogeneity or historical performance.
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/50" />
            Weighted heuristics consider current conditions but lack learning — they cannot benefit from past routing outcomes.
          </li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The challenge is to design a routing policy that adapts to both current workload
          conditions and historical node performance, while accounting for node heterogeneity and
          dynamic traffic patterns.
        </p>
      </Section>

      {/* Proposed Approach */}
      <Section icon={Lightbulb} title="Proposed Approach" accent="text-aco">
        <p className="text-sm text-muted-foreground leading-relaxed">
          A workload-aware ACO routing policy that combines two information sources:
        </p>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-aco/20 bg-aco/5 p-4">
            <div className="text-sm font-semibold text-aco mb-1">Historical Quality (Pheromone)</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Each node maintains a pheromone value representing its historical routing quality.
              When an inference completes efficiently, the node receives pheromone reinforcement.
              Pheromone evaporates over time, allowing the system to forget outdated performance
              and adapt to changing conditions.
            </p>
          </div>
          <div className="rounded-lg border border-info/20 bg-info/5 p-4">
            <div className="text-sm font-semibold text-info mb-1">Current Suitability (Heuristic)</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A real-time heuristic function evaluates each node&apos;s current suitability based on
              utilization, queue length, latency, and computational capacity. This ensures the
              routing decision is responsive to immediate workload conditions.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          The selection probability for each node is computed as:
        </p>
        <div className="mt-2 rounded-md border border-border bg-secondary/30 p-4 font-mono text-sm text-center">
          P<sub>i</sub> = (τ<sub>i</sub><sup>α</sup> × η<sub>i</sub><sup>β</sup>) / Σ<sub>j</sub>(τ<sub>j</sub><sup>α</sup> × η<sub>j</sub><sup>β</sup>)
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          where τ is pheromone, η is heuristic, α controls pheromone influence, and β controls
          heuristic influence.
        </p>
      </Section>

      {/* Objectives */}
      <Section icon={ListChecks} title="Objectives" accent="text-success">
        <ul className="space-y-2">
          {OBJECTIVES.map((obj, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-success" />
              {obj}
            </motion.li>
          ))}
        </ul>
      </Section>

      {/* Baselines */}
      <Section icon={GitCompare} title="Baseline Algorithms" accent="text-info">
        <div className="space-y-3">
          {(['round-robin', 'least-requests', 'weighted'] as AlgorithmType[]).map((alg) => {
            const info = ALGORITHM_INFO[alg];
            return (
              <div
                key={alg}
                className="flex items-start gap-3 rounded-lg border border-border/40 bg-secondary/20 p-3"
              >
                <div
                  className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <div>
                  <div className="text-sm font-semibold">{info.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {info.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Evaluation Metrics */}
      <Section icon={Ruler} title="Evaluation Metrics" accent="text-warning">
        <div className="grid sm:grid-cols-2 gap-3">
          {EVALUATION_METRICS.map((m) => (
            <div
              key={m.name}
              className="rounded-lg border border-border/40 bg-secondary/20 p-3"
            >
              <div className="text-sm font-semibold">{m.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {m.description}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* System Architecture */}
      <Section icon={CircuitBoard} title="System Architecture" accent="text-primary">
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          The current implementation uses an in-browser TypeScript simulation engine. The
          architecture is designed for future connection to a Python/FastAPI backend:
        </p>
        <div className="space-y-2">
          {[
            { label: 'Frontend (Next.js)', desc: 'Visualization, controls, and UI — this application', color: 'text-info' },
            { label: 'Service Layer', desc: 'SimulationService / ApiService abstraction — swappable backend', color: 'text-primary' },
            { label: 'FastAPI Backend (future)', desc: 'Real ACO routing engine, request processing, metrics aggregation', color: 'text-warning' },
            { label: 'Inference Nodes (future)', desc: 'Real GPU workers executing AI model inference', color: 'text-success' },
          ].map((layer, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/40 p-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-secondary/50 text-xs font-bold ${layer.color}`}>
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold">{layer.label}</div>
                  <div className="text-xs text-muted-foreground">{layer.desc}</div>
                </div>
              </div>
              {i < 3 && (
                <div className="flex justify-center py-1">
                  <ArrowRight className="h-3 w-3 text-muted-foreground/50 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          The frontend communicates only through the service abstraction layer. Replacing
          <code className="mx-1 text-xs px-1.5 py-0.5 rounded bg-secondary/50">LocalSimulationService</code>
          with
          <code className="mx-1 text-xs px-1.5 py-0.5 rounded bg-secondary/50">FastAPIInferenceService</code>
          requires no UI changes.
        </p>
      </Section>

      {/* CTA */}
      <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-base font-semibold">See the Results</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Run controlled experiments and compare all four algorithms on identical workloads.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/comparison">
              <Button className="gap-2">
                Compare Algorithms
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/experiments">
              <Button variant="outline" className="gap-2">
                Run Experiments
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: typeof Target;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-5 w-5 ${accent}`} />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm p-5">
        {children}
      </Card>
    </section>
  );
}
