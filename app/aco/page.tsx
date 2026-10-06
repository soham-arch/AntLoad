'use client';

import { motion } from 'framer-motion';
import {
  Bug,
  Sparkles,
  ArrowRight,
  Info,
  Beaker,
  GitBranch,
  Recycle,
  Award,
  Gauge,
  Play,
} from 'lucide-react';
import { useSimulation } from '@/lib/simulation/SimulationContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PheromoneVisualization, ProbabilityBars } from '@/components/shared/PheromoneVisualization';
import { ALGORITHM_INFO } from '@/types/algorithms';
import { cn } from '@/lib/utils';

const CONCEPT_MAP = [
  { concept: 'Ant', mapping: 'Candidate routing decision', icon: Bug },
  { concept: 'Path', mapping: 'Inference node (GPU)', icon: GitBranch },
  { concept: 'Pheromone', mapping: 'Historical routing quality', icon: Sparkles },
  { concept: 'Heuristic', mapping: 'Current node suitability', icon: Gauge },
  { concept: 'Evaporation', mapping: 'Forgetting outdated performance', icon: Recycle },
  { concept: 'Reward', mapping: 'Successful inference performance', icon: Award },
];

export default function ACOPage() {
  const { config, nodes, recentDecisions, isRunning, start, setConfig } = useSimulation();
  const latestDecision = recentDecisions[recentDecisions.length - 1];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bug className="h-6 w-6 text-aco" />
          ACO Explorer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          An interactive guide to workload-aware Ant Colony Optimization for inference routing.
        </p>
      </div>

      {/* What is ACO? */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm p-6">
        <h2 className="text-lg font-semibold mb-3">What is Ant Colony Optimization?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          Ant Colony Optimization is a metaheuristic optimization technique inspired by how ants
          discover efficient paths between their colony and food sources. Ants deposit pheromone
          trails as they move, and other ants are attracted to stronger trails. Over time, shorter
          paths accumulate more pheromone (because ants traverse them faster and more frequently),
          while longer paths see pheromone evaporate. This natural feedback mechanism leads the
          colony to converge on efficient routes.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl mt-3">
          In our system, each &quot;ant&quot; is a routing decision. Instead of finding shortest paths
          to food, we&apos;re finding the best GPU node to send each inference request to. The
          pheromone trail represents how well a node has performed historically, and the heuristic
          captures how suitable the node is right now.
        </p>
      </Card>

      {/* Concept mapping */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          ACO Concepts → Inference Routing
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CONCEPT_MAP.map((item, i) => (
            <motion.div
              key={item.concept}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="border-border/50 bg-card/40 backdrop-blur-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-aco/20 bg-aco/10">
                    <item.icon className="h-4 w-4 text-aco" />
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-semibold whitespace-nowrap">{item.concept}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{item.mapping}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Live pheromone visualization */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Live Pheromone Visualization
          </h2>
          <Badge variant="outline" className={cn(
            'text-xs',
            isRunning ? 'border-success/30 text-success' : 'text-muted-foreground'
          )}>
            {isRunning ? 'Live' : 'Idle'}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-4">
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-aco" />
              <span className="text-sm font-semibold">Pheromone Values (τ) & Heuristics (η)</span>
            </div>
            <PheromoneVisualization nodes={nodes} />
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              The purple bars show pheromone levels — historical routing quality accumulated from
              completed inferences. The blue bars show heuristic values — current node suitability
              based on utilization, queue, latency, and capacity.
            </p>
          </Card>

          {/* ACO Parameters explanation */}
          <div className="space-y-3">
            <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-4 space-y-3">
              <div className="text-sm font-semibold">ACO Parameters</div>
              <ParamDisplay
                label="Alpha (α)"
                value={config.acoParams.alpha}
                description="Controls how much the pheromone trail influences the routing decision. Higher α = more weight on historical performance."
              />
              <ParamDisplay
                label="Beta (β)"
                value={config.acoParams.beta}
                description="Controls how much the current heuristic (workload suitability) influences routing. Higher β = more reactive to current conditions."
              />
              <ParamDisplay
                label="Evaporation (ρ)"
                value={config.acoParams.evaporationRate}
                description="Rate at which pheromone decays over time. Prevents the system from being locked into outdated good experiences. Enables adaptation."
              />
            </Card>

            <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Selection Probability Formula
              </div>
              <div className="rounded-md border border-border bg-secondary/30 p-3 font-mono text-xs text-muted-foreground">
                P<sub>i</sub> = (τ<sub>i</sub><sup>α</sup> × η<sub>i</sub><sup>β</sup>) / Σ(τ<sub>j</sub><sup>α</sup> × η<sub>j</sub><sup>β</sup>)
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Each node&apos;s selection probability is proportional to its pheromone raised to α
                multiplied by its heuristic raised to β, normalized across all nodes.
              </p>
            </Card>

            {!isRunning && (
              <Button
                onClick={() => {
                  setConfig({ algorithm: 'aco' });
                  start();
                }}
                className="w-full gap-2 border border-aco/30 bg-aco/15 text-aco hover:bg-aco/25 hover:text-aco font-medium justify-center h-10"
              >
                <Play className="h-4 w-4" />
                Start ACO Simulation
              </Button>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Decision panel */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            ACO Decision Panel
          </h2>
          <Badge variant="outline" className="text-xs">
            {config.algorithm === 'aco' ? 'ACO Active' : 'Switch to ACO to see decisions'}
          </Badge>
        </div>

        {latestDecision && config.algorithm === 'aco' ? (
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-aco/20 bg-aco/10">
                <Beaker className="h-4 w-4 text-aco" />
              </div>
              <div>
                <div className="text-sm font-semibold">Request #{latestDecision.requestId}</div>
                <div className="text-xs text-muted-foreground">Latest ACO routing decision</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Probabilities */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-3">
                  Selection Probabilities
                </div>
                <div className="space-y-4">
                  {nodes.map((node) => {
                    const prob = latestDecision.probabilities[node.id] ?? 0;
                    const isSelected = node.id === latestDecision.selectedNode;
                    return (
                      <div key={node.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={cn('font-mono font-medium', isSelected && 'text-aco')}>
                              {node.id}
                            </span>
                            <span className="text-xs text-muted-foreground">{node.gpuName}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-aco tabular-nums">τ={node.pheromone.toFixed(2)}</span>
                            <span className="text-info tabular-nums">η={node.heuristic.toFixed(2)}</span>
                            <span className={cn('font-semibold tabular-nums', isSelected ? 'text-aco' : 'text-muted-foreground')}>
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="relative h-2.5 w-full overflow-hidden rounded-sm bg-secondary/50">
                          <motion.div
                            className={cn('absolute h-full rounded-sm', isSelected ? 'bg-aco' : 'bg-info/40')}
                            animate={{ width: `${prob * 100}%` }}
                            transition={{ duration: 0.4 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Decision details */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-3">
                  Decision Reasoning
                </div>
                <ul className="space-y-2">
                  {latestDecision.reasoning.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      {reason}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 rounded-lg border border-aco/20 bg-aco/5 p-4">
                  <div className="text-xs text-muted-foreground mb-1">Selected Node</div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-aco" />
                    <span className="text-lg font-bold text-aco">{latestDecision.selectedNode}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {latestDecision.reasoning[latestDecision.reasoning.length - 1]}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-8 text-center">
            <Bug className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {config.algorithm === 'aco'
                ? 'Start the simulation to see live ACO routing decisions with probability breakdowns.'
                : 'Switch to the ACO algorithm in the Live Simulation page to see decision breakdowns here.'}
            </p>
          </Card>
        )}
      </section>

      {/* Honest research note */}
      <Card className="border-border/50 bg-card/30 backdrop-blur-sm p-5">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold mb-1">Research Note</div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
              This is a simplified ACO simulation for research demonstration. The pheromone update
              rule, heuristic function, and parameter values are experimental — not claimed to be
              production-optimal. The purpose is to evaluate whether combining historical routing
              quality with current workload metrics can improve load balancing decisions compared
              to conventional strategies. See the Research page for the full methodology.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ParamDisplay({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-aco">{value.toFixed(2)}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
