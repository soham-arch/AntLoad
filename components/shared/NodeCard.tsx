'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Cpu,
  Zap,
  Clock,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Activity,
} from 'lucide-react';
import type { NodeMetrics, NodeHealth } from '@/types/simulation';
import { cn } from '@/lib/utils';

interface NodeCardProps {
  node: NodeMetrics;
  algorithm: string;
  onDegrade?: (id: string) => void;
  onRestore?: (id: string) => void;
  compact?: boolean;
}

const healthConfig: Record<
  NodeHealth,
  { label: string; color: string; icon: typeof CheckCircle2; badgeClass: string }
> = {
  healthy: { label: 'Healthy', color: 'text-success', icon: CheckCircle2, badgeClass: 'border-success/30 text-success bg-success/5' },
  degraded: { label: 'Degraded', color: 'text-warning', icon: AlertTriangle, badgeClass: 'border-warning/30 text-warning bg-warning/5' },
  overloaded: { label: 'Overloaded', color: 'text-danger', icon: XCircle, badgeClass: 'border-danger/30 text-danger bg-danger/5' },
  offline: { label: 'Offline', color: 'text-muted-foreground', icon: XCircle, badgeClass: 'border-muted text-muted-foreground' },
};

function utilColor(util: number): string {
  if (util < 50) return 'var(--success)';
  if (util < 80) return 'var(--warning)';
  return 'var(--danger)';
}

export function NodeCard({ node, algorithm, onDegrade, onRestore, compact }: NodeCardProps) {
  const health = healthConfig[node.health];
  const HealthIcon = health.icon;
  const showPheromone = algorithm === 'aco';

  return (
    <Card className={cn(
      'relative overflow-hidden border-border/50 bg-card/40 backdrop-blur-sm p-4 transition-all flex flex-col justify-between h-full',
      node.degraded && 'border-warning/20'
    )}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
              node.degraded ? 'border-warning/30 bg-warning/10' : 'border-primary/20 bg-primary/10'
            )}>
              <Cpu className={cn('h-4 w-4', node.degraded ? 'text-warning' : 'text-primary')} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight truncate">{node.id}</div>
              <div className="text-xs text-muted-foreground truncate">{node.gpuName}</div>
            </div>
          </div>
          <Badge variant="outline" className={cn('shrink-0 gap-1 text-xs', health.badgeClass)}>
            <HealthIcon className="h-3 w-3" />
            {health.label}
          </Badge>
        </div>

        {/* Utilization */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Gauge className="h-3 w-3" /> Utilization
            </span>
            <span className="font-medium tabular-nums" style={{ color: utilColor(node.utilization) }}>
              {node.utilization.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="absolute h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, node.utilization)}%`,
                backgroundColor: utilColor(node.utilization),
              }}
            />
          </div>
        </div>

        {/* Metrics grid */}
        {!compact && (
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <Metric icon={Activity} label="Queue" value={node.queueLength.toString()} />
            <Metric icon={Zap} label="Active" value={node.activeRequests.toString()} />
            <Metric icon={Clock} label="Latency" value={`${node.averageLatency.toFixed(0)}ms`} />
            <Metric icon={TrendingDown} label="Throughput" value={`${node.throughput.toFixed(1)}/s`} />
            <Metric icon={Cpu} label="Capacity" value={node.capacity.toString()} />
            <Metric icon={CheckCircle2} label="Processed" value={node.totalProcessed.toString()} />
          </div>
        )}

        {/* Pheromone (ACO only) */}
        {showPheromone && !compact && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pheromone</span>
              <span className="font-medium tabular-nums text-aco">{node.pheromone.toFixed(3)}</span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="absolute h-full rounded-full bg-aco transition-all duration-500"
                style={{ width: `${Math.min(100, node.pheromone * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Heuristic</span>
              <span className="font-medium tabular-nums text-info">{node.heuristic.toFixed(3)}</span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="absolute h-full rounded-full bg-info transition-all duration-500"
                style={{ width: `${Math.min(100, node.heuristic * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {(onDegrade || onRestore) && !compact && (
        <div className="mt-4 pt-2 flex w-full">
          {node.degraded ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs gap-1.5 justify-center border-success/30 hover:border-success/50 hover:bg-success/5"
              onClick={() => onRestore?.(node.id)}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Restore Node
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs gap-1.5 justify-center border-warning/20 hover:border-warning/40 hover:bg-warning/5"
                    onClick={() => onDegrade?.(node.id)}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    Degrade Node
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Simulate performance degradation on this node</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </Card>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium tabular-nums">{value}</div>
      </div>
    </div>
  );
}
