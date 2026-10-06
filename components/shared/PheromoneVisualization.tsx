'use client';

import { motion } from 'framer-motion';
import type { NodeMetrics } from '@/types/simulation';
import { cn } from '@/lib/utils';

interface PheromoneVisualizationProps {
  nodes: NodeMetrics[];
  showHeuristic?: boolean;
}

export function PheromoneVisualization({ nodes, showHeuristic = true }: PheromoneVisualizationProps) {
  const maxPheromone = Math.max(...nodes.map((n) => n.pheromone), 1);

  return (
    <div className="space-y-4">
      {nodes.map((node) => (
        <div key={node.id} className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium">{node.id}</span>
              <span className="text-muted-foreground">{node.gpuName}</span>
            </div>
            <div className="flex items-center gap-3">
              {showHeuristic && (
                <span className="text-info tabular-nums">
                  η={node.heuristic.toFixed(2)}
                </span>
              )}
              <span className="text-aco font-semibold tabular-nums">
                τ={node.pheromone.toFixed(3)}
              </span>
            </div>
          </div>

          {/* Pheromone bar */}
          <div className="relative h-3 w-full overflow-hidden rounded-sm bg-secondary/50 border border-border/30">
            <motion.div
              className="absolute h-full rounded-sm"
              style={{
                background: 'linear-gradient(90deg, hsl(var(--aco)/0.6), hsl(var(--aco)))',
              }}
              animate={{
                width: `${(node.pheromone / maxPheromone) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {showHeuristic && (
            <div className="relative h-1.5 w-full overflow-hidden rounded-sm bg-secondary/30">
              <motion.div
                className="absolute h-full rounded-sm bg-info/60"
                animate={{
                  width: `${node.heuristic * 100}%`,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface ProbabilityBarProps {
  probabilities: Record<string, number>;
  nodes: NodeMetrics[];
  selectedNode: string;
}

export function ProbabilityBars({ probabilities, nodes, selectedNode }: ProbabilityBarProps) {
  const entries = Object.entries(probabilities).sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-2.5">
      {entries.map(([nodeId, prob]) => {
        const node = nodes.find((n) => n.id === nodeId);
        const isSelected = nodeId === selectedNode;
        return (
          <div key={nodeId} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className={cn('font-mono', isSelected && 'text-aco font-semibold')}>
                {nodeId} {node && <span className="text-muted-foreground">{node.gpuName}</span>}
                {isSelected && <span className="ml-1 text-aco">← selected</span>}
              </span>
              <span className={cn('tabular-nums font-medium', isSelected ? 'text-aco' : 'text-muted-foreground')}>
                {(prob * 100).toFixed(1)}%
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-sm bg-secondary/50">
              <motion.div
                className={cn('absolute h-full rounded-sm', isSelected ? 'bg-aco' : 'bg-info/50')}
                animate={{ width: `${prob * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
