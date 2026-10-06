'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Play, Pause, RotateCcw, Zap, Settings2, Info } from 'lucide-react';
import { useSimulation } from '@/lib/simulation/SimulationContext';
import { ALGORITHM_INFO, WORKLOAD_PATTERNS } from '@/types/algorithms';
import type { AlgorithmType, WorkloadPattern, HeterogeneityLevel } from '@/types/simulation';
import { cn } from '@/lib/utils';

export function SimulationControls() {
  const {
    config,
    setConfig,
    isRunning,
    isPaused,
    start,
    pause,
    reset,
    injectBurst,
    state,
  } = useSimulation();

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          Control Panel
        </h3>
        <Badge variant="outline" className={cn(
          'text-xs',
          state.status === 'running' && 'border-success/30 text-success',
          state.status === 'paused' && 'border-warning/30 text-warning',
          state.status === 'idle' && 'text-muted-foreground',
          state.status === 'completed' && 'border-primary/30 text-primary'
        )}>
          {state.status}
        </Badge>
      </div>

      <Separator />

      {/* Algorithm */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Algorithm</label>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(ALGORITHM_INFO) as AlgorithmType[]).map((alg) => {
            const info = ALGORITHM_INFO[alg];
            const isActive = config.algorithm === alg;
            return (
              <TooltipProvider key={alg}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setConfig({ algorithm: alg })}
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-all',
                        isActive
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-border/80'
                      )}
                    >
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: info.color }}
                      />
                      <span className="truncate">{info.shortName}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{info.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>

      {/* Workload Pattern */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Workload Pattern</label>
        <div className="grid grid-cols-2 gap-1.5 [&>*:last-child]:col-span-2">
          {(Object.keys(WORKLOAD_PATTERNS) as WorkloadPattern[]).map((pattern) => {
            const info = WORKLOAD_PATTERNS[pattern];
            const isActive = config.workloadPattern === pattern;
            return (
              <TooltipProvider key={pattern}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setConfig({ workloadPattern: pattern })}
                      className={cn(
                        'w-full rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all text-center',
                        isActive
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-border/80'
                      )}
                    >
                      {info.name}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{info.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>

      {/* Request Rate */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Request Rate</label>
          <span className="text-xs font-semibold tabular-nums">{config.requestRate} req/s</span>
        </div>
        <input
          type="range"
          min={1}
          max={200}
          value={config.requestRate}
          onChange={(e) => setConfig({ requestRate: Number(e.target.value) })}
          className="w-full h-2 rounded-full bg-secondary appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Node count */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Number of Nodes</label>
          <span className="text-xs font-semibold tabular-nums">{config.nodeCount}</span>
        </div>
        <div className="flex gap-1">
          {[3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              onClick={() => setConfig({ nodeCount: n })}
              className={cn(
                'flex-1 rounded-md border py-1.5 text-xs font-medium transition-all',
                config.nodeCount === n
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Heterogeneity */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Node Heterogeneity</label>
        <div className="flex gap-1">
          {(['low', 'medium', 'high'] as HeterogeneityLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setConfig({ heterogeneity: level })}
              className={cn(
                'flex-1 rounded-md border py-1.5 text-xs font-medium capitalize transition-all',
                config.heterogeneity === level
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Duration</label>
        <div className="flex gap-1">
          {[10, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setConfig({ duration: d })}
              className={cn(
                'flex-1 rounded-md border py-1.5 text-xs font-medium transition-all',
                config.duration === d
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
              )}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        {!isRunning ? (
          <Button
            onClick={start}
            size="sm"
            className="w-full h-9 gap-1.5 justify-center bg-success/90 hover:bg-success text-white font-medium"
          >
            <Play className="h-3.5 w-3.5" />
            Start
          </Button>
        ) : (
          <Button
            onClick={pause}
            size="sm"
            variant="outline"
            className="w-full h-9 gap-1.5 justify-center border-warning/30 text-warning hover:bg-warning/10 font-medium"
          >
            <Pause className="h-3.5 w-3.5" />
            Pause
          </Button>
        )}
        <Button
          onClick={reset}
          size="sm"
          variant="outline"
          className="w-full h-9 gap-1.5 justify-center border-border hover:bg-secondary/60 font-medium"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button
          onClick={injectBurst}
          size="sm"
          variant="outline"
          className="w-full h-9 gap-1.5 justify-center border-warning/30 text-warning hover:bg-warning/10 font-medium"
          title="Inject a sudden traffic burst"
        >
          <Zap className="h-3.5 w-3.5" />
          Burst
        </Button>
      </div>

      {/* Progress */}
      {state.status !== 'idle' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Elapsed: {state.elapsedTime.toFixed(1)}s / {config.duration}s</span>
            <span className="tabular-nums">{Math.min(100, (state.elapsedTime / config.duration) * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (state.elapsedTime / config.duration) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
