'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Cpu, Network } from 'lucide-react';
import type { RoutingDecision, NodeMetrics } from '@/types/simulation';
import { ALGORITHM_INFO } from '@/types/algorithms';
import { cn } from '@/lib/utils';

interface RequestFlowProps {
  decisions: RoutingDecision[];
  nodes: NodeMetrics[];
  maxVisible?: number;
}

export function RequestFlow({ decisions, nodes, maxVisible = 8 }: RequestFlowProps) {
  const visible = decisions.slice(-maxVisible).reverse();

  return (
    <div className="space-y-3">
      {/* Flow visualization */}
      <div className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-border/50 bg-card/30 p-4">
        {/* Incoming */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Requests</div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-secondary/50">
            <Network className="h-5 w-5 text-info" />
          </div>
        </div>

        {/* Flow line */}
        <div className="relative flex-1 h-px bg-border">
          <div className="absolute inset-0 overflow-hidden">
            <div className="flow-line absolute h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent" />
          </div>
        </div>

        {/* Router */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Router</div>
          <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <span className="text-xs font-bold text-primary">ACO</span>
          </div>
        </div>

        {/* Flow line to nodes */}
        <div className="relative flex-1 h-px bg-border">
          <div className="absolute inset-0 overflow-hidden">
            <div className="flow-line absolute h-px w-16 bg-gradient-to-r from-transparent via-aco to-transparent" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>

        {/* Nodes */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Nodes</div>
          <div className="flex gap-1.5">
            {nodes.slice(0, 5).map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex h-12 w-8 items-center justify-center rounded-md border text-[10px] font-medium',
                  n.degraded
                    ? 'border-warning/30 bg-warning/5 text-warning'
                    : 'border-border bg-secondary/50 text-muted-foreground'
                )}
                title={n.gpuName}
              >
                {n.id.replace('GPU-', '')}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decision log */}
      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {visible.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              No routing decisions yet. Start the simulation to see live request routing.
            </div>
          ) : (
            visible.map((decision) => {
              const node = nodes.find((n) => n.id === decision.selectedNode);
              const algo = ALGORITHM_INFO[decision.algorithm];
              return (
                <motion.div
                  key={decision.requestId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 rounded-md border border-border/40 bg-card/30 px-3 py-2"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-secondary/50">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{decision.requestId}
                    </span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold"
                    style={{
                      borderColor: algo.color + '40',
                      backgroundColor: algo.color + '15',
                      color: algo.color,
                    }}
                  >
                    {algo.shortName}
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <div className={cn(
                    'flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-medium shrink-0',
                    node?.degraded
                      ? 'border-warning/30 bg-warning/5 text-warning'
                      : 'border-success/20 bg-success/5 text-success'
                  )}>
                    <Cpu className="h-3 w-3" />
                    {decision.selectedNode}
                  </div>
                  <div className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {decision.reasoning[0]}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
