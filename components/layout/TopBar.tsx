'use client';

import { Menu, Monitor, Activity, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSimulation } from '@/lib/simulation/SimulationContext';
import { ALGORITHM_INFO } from '@/types/algorithms';
import { cn } from '@/lib/utils';

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { config, isRunning, isPaused, start, pause, reset, presentationMode, togglePresentationMode } = useSimulation();
  const algoInfo = ALGORITHM_INFO[config.algorithm];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/60 px-4 backdrop-blur-xl lg:px-6">
      {/* Mobile menu */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Algorithm indicator */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: algoInfo.color }} />
          <span className="text-xs font-medium text-muted-foreground">Router:</span>
          <span className="text-xs font-semibold">{algoInfo.name}</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Status badge */}
        <Badge
          variant="outline"
          className={cn(
            'hidden sm:flex items-center gap-1.5 border-border',
            isRunning && 'border-success/30 text-success',
            isPaused && 'border-warning/30 text-warning',
            !isRunning && !isPaused && 'border-muted text-muted-foreground'
          )}
        >
          <div className={cn(
            'h-1.5 w-1.5 rounded-full',
            isRunning && 'bg-success animate-pulse',
            isPaused && 'bg-warning',
            !isRunning && !isPaused && 'bg-muted-foreground'
          )} />
          {isRunning ? 'Running' : isPaused ? 'Paused' : 'Idle'}
        </Badge>

        {/* Quick controls */}
        <div className="flex items-center gap-1">
          {!isRunning ? (
            <Button size="sm" variant="ghost" onClick={start} className="h-8 w-8 p-0" title="Start">
              <Play className="h-4 w-4 text-success" />
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={pause} className="h-8 w-8 p-0" title="Pause">
              <Pause className="h-4 w-4 text-warning" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={reset} className="h-8 w-8 p-0" title="Reset">
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Presentation mode */}
        <Button
          size="sm"
          variant={presentationMode ? 'default' : 'outline'}
          onClick={togglePresentationMode}
          className="h-8 gap-2"
          title="Toggle presentation mode"
        >
          <Monitor className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Presentation</span>
        </Button>
      </div>
    </header>
  );
}
