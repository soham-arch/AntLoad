'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  FlaskConical,
  BarChart3,
  Bug,
  BookOpen,
  CircuitBoard,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/simulation', label: 'Live Simulation', icon: Activity },
  { href: '/experiments', label: 'Experiments', icon: FlaskConical },
  { href: '/comparison', label: 'Algorithm Comparison', icon: BarChart3 },
  { href: '/aco', label: 'ACO Explorer', icon: Bug },
  { href: '/research', label: 'Research', icon: BookOpen },
];

export function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-border bg-card/50 backdrop-blur-xl',
        collapsed && 'lg:items-center'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 border-b border-border p-4', collapsed && 'lg:justify-center lg:px-2')}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-aco/20 border border-border">
          <CircuitBoard className="h-5 w-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight">
              AI Inference Lab
            </div>
            <div className="truncate text-xs text-muted-foreground">
              Load Balancing Research
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent',
                collapsed && 'lg:justify-center lg:px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer status */}
      <div className="border-t border-border p-3">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CircleDot className="h-3 w-3 text-success" />
              <span>Simulation Engine: Online</span>
            </div>
            <div className="text-xs text-muted-foreground/60">Research Prototype</div>
          </div>
        ) : (
          <div className="flex justify-center">
            <CircleDot className="h-4 w-4 text-success animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}
