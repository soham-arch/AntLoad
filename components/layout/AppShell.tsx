'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useSimulation } from '@/lib/simulation/SimulationContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { presentationMode } = useSimulation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          presentationMode ? 'lg:w-20 lg:collapsed' : 'lg:w-64'
        }`}
      >
        <Sidebar
          collapsed={presentationMode}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-[1600px] p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
