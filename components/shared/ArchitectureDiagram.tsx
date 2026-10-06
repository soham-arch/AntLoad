'use client';

import { motion } from 'framer-motion';
import {
  Users,
  Server,
  Cpu,
  Brain,
  ArrowDown,
  BarChart3,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { ALGORITHM_INFO } from '@/types/algorithms';
import type { AlgorithmType } from '@/types/simulation';
import { cn } from '@/lib/utils';

interface ArchitectureDiagramProps {
  algorithm: AlgorithmType;
  active?: boolean;
  compact?: boolean;
}

export function ArchitectureDiagram({ algorithm, active = false, compact }: ArchitectureDiagramProps) {
  const algoInfo = ALGORITHM_INFO[algorithm];
  const steps = [
    { icon: Users, label: 'User Requests', sub: 'AI inference queries', color: 'text-info' },
    { icon: Server, label: 'API Gateway', sub: 'Request ingestion', color: 'text-info' },
    { icon: Brain, label: 'Intelligent Routing Layer', sub: algoInfo.name, color: 'text-aco', highlight: true },
    { icon: Cpu, label: 'Inference Nodes', sub: 'Heterogeneous GPUs', color: 'text-primary' },
    { icon: Brain, label: 'AI Model Execution', sub: 'Inference computation', color: 'text-success' },
    { icon: BarChart3, label: 'Metrics Collection', sub: 'Latency, throughput, load', color: 'text-warning' },
    { icon: RefreshCw, label: 'Routing Feedback', sub: 'Pheromone & score updates', color: 'text-aco' },
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-2 rounded-md border border-border/50 bg-card/40 px-3 py-1.5',
              step.highlight && 'border-aco/30 bg-aco/5'
            )}>
              <step.icon className={cn('h-3.5 w-3.5', step.color)} />
              <span className="text-xs font-medium">{step.label}</span>
            </div>
            {i < steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {steps.map((step, i) => (
        <div key={i}>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className={cn(
              'flex items-center gap-3 rounded-lg border bg-card/40 backdrop-blur-sm px-4 py-3 transition-all',
              step.highlight
                ? 'border-aco/30 bg-aco/5'
                : 'border-border/50'
            )}
          >
            <div className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border',
              step.highlight ? 'border-aco/30 bg-aco/10' : 'border-border bg-secondary/50'
            )}>
              <step.icon className={cn('h-4 w-4', step.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{step.label}</span>
                {step.highlight && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: algoInfo.color + '20', color: algoInfo.color }}
                  >
                    Active
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">{step.sub}</div>
            </div>
            {active && step.highlight && (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: algoInfo.color }}
              />
            )}
          </motion.div>
          {i < steps.length - 1 && (
            <div className="flex justify-center py-0.5">
              <ArrowDown className={cn('h-3 w-3', active ? 'text-primary animate-pulse' : 'text-muted-foreground/50')} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
