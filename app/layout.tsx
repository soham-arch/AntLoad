import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { SimulationProvider } from '@/lib/simulation/SimulationContext';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: 'AI Inference Load Balancing Lab',
  description:
    'Workload-Aware Ant Colony Optimization for Dynamic Inference Routing — a research platform for evaluating load-balancing algorithms in heterogeneous AI inference systems.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans antialiased`}>
        <SimulationProvider>
          <AppShell>{children}</AppShell>
        </SimulationProvider>
      </body>
    </html>
  );
}
