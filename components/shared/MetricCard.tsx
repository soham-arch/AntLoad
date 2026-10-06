'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accent?: 'primary' | 'aco' | 'success' | 'warning' | 'danger' | 'info';
  tooltip?: string;
}

const accentMap = {
  primary: 'text-primary',
  aco: 'text-aco',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
};

const accentBg = {
  primary: 'bg-primary/10 border-primary/20',
  aco: 'bg-aco/10 border-aco/20',
  success: 'bg-success/10 border-success/20',
  warning: 'bg-warning/10 border-warning/20',
  danger: 'bg-danger/10 border-danger/20',
  info: 'bg-info/10 border-info/20',
};

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  accent = 'info',
  tooltip,
  compact,
}: MetricCardProps & { compact?: boolean }) {
  const content = (
    <Card className={cn('relative overflow-hidden p-4 border-border/50 bg-card/40 backdrop-blur-sm transition-all hover:border-border', 'group')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
            {label}
          </p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums tracking-tight" suppressHydrationWarning>
              {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
            </span>
            {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
          </div>
          {trend && trendValue && (
            <div className="mt-1 flex items-center gap-1 text-xs">
              <span
                className={cn(
                  trend === 'up' && 'text-success',
                  trend === 'down' && 'text-danger',
                  trend === 'neutral' && 'text-muted-foreground'
                )}
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', accentBg[accent])}>
            <Icon className={cn('h-4 w-4', accentMap[accent])} />
          </div>
        )}
      </div>
    </Card>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
