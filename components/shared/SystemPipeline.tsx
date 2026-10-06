'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LogIn,
  BarChart3,
  Gauge,
  SplitSquareHorizontal,
  Cpu,
  Brain,
  TrendingUp,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

const PIPELINE_STEPS = [
  { icon: LogIn, label: 'Request Arrival', color: 'text-info' },
  { icon: BarChart3, label: 'Metric Collection', color: 'text-info' },
  { icon: Gauge, label: 'Workload Analysis', color: 'text-warning' },
  { icon: SplitSquareHorizontal, label: 'Routing Decision', color: 'text-aco' },
  { icon: Cpu, label: 'Node Selection', color: 'text-primary' },
  { icon: Brain, label: 'AI Inference', color: 'text-success' },
  { icon: TrendingUp, label: 'Performance Measurement', color: 'text-warning' },
  { icon: RefreshCw, label: 'Pheromone Update', color: 'text-aco' },
];

interface SystemPipelineProps {
  active?: boolean;
  activeStep?: number;
}

export function SystemPipeline({ active = false, activeStep = -1 }: SystemPipelineProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PIPELINE_STEPS.map((step, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <motion.div
            animate={
              active
                ? {
                    borderColor: i === activeStep
                      ? ['hsl(var(--primary))', 'hsl(var(--primary)/0.3)', 'hsl(var(--primary))']
                      : 'hsl(var(--border))',
                  }
                : {}
            }
            transition={{ duration: 1, repeat: Infinity }}
            className={cn(
              'flex items-center gap-2 rounded-md border bg-card/40 px-2.5 py-1.5',
              i === activeStep && active ? 'border-primary/50 bg-primary/5' : 'border-border/50'
            )}
          >
            <step.icon className={cn('h-3.5 w-3.5', step.color)} />
            <span className="text-xs font-medium whitespace-nowrap">{step.label}</span>
            {active && i === activeStep && (
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full bg-primary"
              />
            )}
          </motion.div>
          {i < PIPELINE_STEPS.length - 1 && (
            <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
