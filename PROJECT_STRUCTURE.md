# Complete Project & File Structure Guide

**Project Title:** *A Workload-Aware Ant Colony Optimization Approach for Dynamic Load Balancing in AI Inference Systems*  
**Repository Architecture:** Decoupled Client-Server (Python FastAPI + Next.js TypeScript)  
**Academic Reference:** B.Tech Engineering — Advanced Intelligent & Embedded Systems (AIES)  

---

## Table of Contents
1. [Master Directory Tree](#1-master-directory-tree)
2. [Root Configuration Files](#2-root-configuration-files)
3. [Backend Subsystem (`backend/`)](#3-backend-subsystem-backend)
   - [Application Entrypoint & API](#application-entrypoint--api)
   - [Data Models (`schemas.py`)](#data-models-schemaspy)
   - [Routing Algorithms (`algorithms/`)](#routing-algorithms-algorithms)
   - [Simulation Engine (`simulation/`)](#simulation-engine-simulation)
   - [Metrics & Experiments (`metrics/` & `experiments/`)](#metrics--experiments-metrics--experiments)
   - [Automated Test Suite (`tests/`)](#automated-test-suite-tests)
4. [Frontend Application (`app/`)](#4-frontend-application-app)
5. [UI Components (`components/`)](#5-ui-components-components)
   - [Layout Shell (`components/layout/`)](#layout-shell-componentslayout)
   - [Domain-Specific Visualizers (`components/shared/`)](#domain-specific-visualizers-componentsshared)
   - [UI Primitives (`components/ui/`)](#ui-primitives-componentsui)
6. [Frontend Libraries, Services & Types (`lib/` & `types/`)](#6-frontend-libraries-services--types-lib--types)
7. [System Data Flow & Dependency Matrix](#7-system-data-flow--dependency-matrix)
8. [Summary File Quick-Reference Table](#8-summary-file-quick-reference-table)

---

## 1. Master Directory Tree

```
project/
├── app/                                  # Next.js 14 App Router Pages
│   ├── aco/                              # ACO Explorer interactive learning page
│   │   └── page.tsx
│   ├── comparison/                       # 4-Algorithm comparison workbench
│   │   └── page.tsx
│   ├── experiments/                      # 6 Pre-configured empirical benchmark scenarios
│   │   └── page.tsx
│   ├── research/                         # Literature, methodology, citations
│   │   └── page.tsx
│   ├── simulation/                       # Live interactive simulation dashboard
│   │   └── page.tsx
│   ├── globals.css                       # Global Tailwind styles & dark mode variables
│   ├── layout.tsx                        # Root layout wrapping AppShell & Context
│   └── page.tsx                          # Overview & System Architecture dashboard
│
├── backend/                              # Python 3.12 FastAPI Numerical Engine
│   ├── algorithms/                       # Routing Policy Implementations
│   │   ├── __init__.py                   # Factory function & Algorithm router interface
│   │   ├── aco.py                        # Workload-Aware Ant Colony Optimization
│   │   ├── least_requests.py             # Least Outstanding Requests (LOR) policy
│   │   ├── round_robin.py                # Cyclic Round Robin (RR) policy
│   │   └── weighted.py                   # Multi-criteria Weighted Workload policy
│   ├── api/                              # REST API Route Handlers
│   │   ├── __init__.py
│   │   └── routes.py                     # All FastAPI endpoints for simulation & benchmarks
│   ├── experiments/                      # Batch Benchmark Harness
│   │   ├── __init__.py
│   │   └── runner.py                     # Multi-algorithm scenario execution & insights
│   ├── metrics/                          # Mathematical Metrics & Statistical Aggregations
│   │   ├── __init__.py
│   │   └── calculator.py                 # P50/P95 latencies, throughput, load balance score
│   ├── models/                           # Pydantic Data Contracts
│   │   ├── __init__.py
│   │   └── schemas.py                    # CamelCase-serialized API schemas
│   ├── simulation/                       # Discrete-Event Simulation Mechanics
│   │   ├── __init__.py
│   │   ├── engine.py                     # Discrete-time simulation engine (reproducible seed)
│   │   ├── nodes.py                      # NodeCluster & Heterogeneous GPU hardware tiers
│   │   └── workload.py                   # 7 synthetic traffic arrival distributions
│   ├── tests/                            # Headless Automated Pytest Suite (19 tests)
│   │   ├── test_algorithms.py            # Unit tests for RR, LOR, Weighted, and ACO
│   │   ├── test_api.py                   # FastAPI TestClient endpoint integration tests
│   │   ├── test_experiments.py          # Benchmark reproducibility & differentiation tests
│   │   ├── test_metrics.py               # Statistical calculation validation
│   │   └── test_simulation.py           # Tick step, queue dynamics, burst, degrade tests
│   ├── __init__.py
│   └── main.py                           # FastAPI application entrypoint & CORS config
│
├── components/                           # React 19 Frontend Components
│   ├── layout/                           # Layout Shell & Navigation
│   │   ├── AppShell.tsx                  # Main responsive layout container
│   │   ├── Sidebar.tsx                   # Left navigation sidebar
│   │   └── TopBar.tsx                    # Header with algorithm status & quick controls
│   ├── shared/                           # Domain-Specific UI Visualizers
│   │   ├── ArchitectureDiagram.tsx       # Interactive SVG cluster topology
│   │   ├── ComparisonCharts.tsx          # Recharts bar, line, and radar visualizations
│   │   ├── ComparisonTable.tsx           # Full comparison table with winner highlights
│   │   ├── MetricCard.tsx                # Metric KPI card with trend indicator
│   │   ├── MetricCharts.tsx              # Real-time streaming charts (latency, queue, util)
│   │   ├── NodeCard.tsx                  # GPU card with utilization bar & action buttons
│   │   ├── PheromoneVisualization.tsx    # Pheromone (τ) vs Heuristic (η) dual-bar display
│   │   ├── RequestFlow.tsx               # Animated live request routing feed
│   │   ├── SimulationControls.tsx        # Control panel (start, pause, reset, burst, pattern)
│   │   └── SystemPipeline.tsx            # Animated 8-stage inference pipeline diagram
│   └── ui/                               # Modular Radix UI Primitives (47 files)
│
├── hooks/                                # Custom React Hooks
│   └── use-toast.ts                      # Toast notification state hook
│
├── lib/                                  # Frontend Core Services, Algorithms & Utilities
│   ├── algorithms/                       # Client fallback algorithms (RR, LOR, WT, ACO)
│   ├── data/                             # Baseline static datasets
│   │   ├── experiments.ts                # Scenario definitions for the 6 experiments
│   │   └── mockData.ts                   # Deterministic GPU baseline profiles & defaults
│   ├── metrics/                          # Client fallback metrics calculator
│   │   └── calculator.ts
│   ├── services/                         # Client-Server API Bridge
│   │   ├── apiService.ts                 # FastApiClient HTTP wrapper
│   │   └── simulationService.ts          # State synchronizer with local fallback
│   ├── simulation/                       # Client simulation context & engine
│   │   ├── SimulationContext.tsx         # Global React Context provider
│   │   └── engine.ts                     # In-browser fallback simulation engine
│   └── utils.ts                          # Tailwind class-merging helper (cn)
│
├── types/                                # TypeScript Interfaces
│   ├── algorithms.ts                     # UI metadata, labels, and color mappings
│   └── simulation.ts                     # TypeScript data contracts matching Python models
│
├── PROJECT_DOCUMENTATION.md              # Research and architectural documentation
├── README.md                             # Repository introductory README
├── next.config.js                        # Next.js reverse-proxy configuration
├── package.json                          # Node dependencies and scripts
├── requirements.txt                      # Python dependencies
└── tsconfig.json                         # TypeScript compiler configuration
```

---

## 2. Root Configuration Files

### [`next.config.js`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/next.config.js)
- **Role:** Next.js framework configuration.
- **What it does:** Configures API rewrites so that any browser request starting with `/api/:path*` is automatically proxied internally to `http://127.0.0.1:8000/api/:path*`.
- **Importance:** Eliminates browser Cross-Origin Resource Sharing (CORS) complications during development and production while preserving clean relative URL paths in frontend code.

### [`package.json`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/package.json)
- **Role:** Node.js project manifest.
- **What it does:** Defines project dependencies (Next.js 14, React 19, Lucide React, Framer Motion, Recharts, Radix UI) and scripts (`dev`, `build`, `start`, `lint`).
- **Importance:** Manages all client-side runtime packages and build toolchains.

### [`requirements.txt`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/requirements.txt)
- **Role:** Python package manifest.
- **What it does:** Declares backend dependencies (`fastapi`, `uvicorn`, `pydantic`, `numpy`, `pandas`, `pytest`, `httpx`).
- **Importance:** Ensures the Python virtual environment has all numerical, statistical, and server frameworks installed.

### [`tsconfig.json`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/tsconfig.json)
- **Role:** TypeScript compiler settings.
- **What it does:** Configures strict type safety, JSX preservation, module resolution, and path alias `@/*` mapping directly to the root directory.
- **Importance:** Guarantees strict type checking and eliminates broken import paths across the codebase.

### [`tailwind.config.ts`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/tailwind.config.ts) & [`postcss.config.js`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/postcss.config.js)
- **Role:** CSS framework configuration.
- **What it does:** Defines HSL-based design tokens (primary cyan, ACO purple, warning amber, success emerald, danger rose) and enables responsive utilities.
- **Importance:** Powers the dark-mode aesthetic, glowing glassmorphism borders, and animated UI elements.

---

## 3. Backend Subsystem (`backend/`)

### Application Entrypoint & API

#### [`backend/main.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/main.py)
- **What it does:** Instantiates the FastAPI application, mounts `CORSMiddleware` (allowing cross-origin requests from the Next.js port), registers the router from `backend.api.routes`, and initializes the backend logger.
- **Importance:** The core server entrypoint. Running `python -m uvicorn backend.main:app` boots this file.

#### [`backend/api/routes.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/api/routes.py)
- **What it does:** Declares all REST API endpoints:
  - Simulation lifecycle: `/api/simulation/start`, `/pause`, `/reset`, `/state`, `/config`, `/burst`.
  - Cluster operations: `/api/nodes`, `/api/nodes/{id}/degrade`, `/api/nodes/{id}/restore`.
  - Decision querying: `/api/simulation/decision`.
  - Multi-simulation comparisons: `/api/comparison/run`.
  - Research experiments: `/api/experiments/run`.
- **Importance:** Translates incoming HTTP requests into actions executed on the in-memory simulation engine and returns serialized JSON to the frontend.

---

### Data Models (`schemas.py`)

#### [`backend/models/schemas.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/models/schemas.py)
- **What it does:** Defines 10+ Pydantic v2 data models. Configured with `to_camel` alias generator:
  - `NodeMetrics`: Hardware specs, live utilization, queue length, active requests, latency, throughput, pheromone, heuristic, and health status.
  - `SimulationConfig`: Selected algorithm, workload pattern, request rate, node count, duration, ACO hyperparameters ($\alpha, \beta, \rho, Q$), and weighted routing weights.
  - `InferenceRequest`: Request ID, arrival timestamp, compute complexity multiplier, assigned node, completion latency, and success flag.
  - `RoutingDecision`: Request ID, selected node, probability distribution vector, and human-readable reasoning strings.
  - `MetricsSnapshot`: Time-series data point recording average latency, P50, P95, throughput, GPU utilization, and load balance score.
  - `AlgorithmResult`: Full benchmark result for one algorithm (summary KPIs, distribution percentages, time series).
  - `ExperimentResult`: Complete 4-algorithm benchmark report with winner annotations and research insight text.
- **Importance:** The single source of truth for data structures in Python; guarantees serialization compatibility with TypeScript.

---

### Routing Algorithms (`algorithms/`)

#### [`backend/algorithms/__init__.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/algorithms/__init__.py)
- **What it does:** Defines the abstract `BaseRouter` interface and the `get_router(algorithm_type, ...)` factory function.
- **Importance:** Decouples the simulation engine from algorithm details, allowing polymorphic algorithm switching at runtime.

#### [`backend/algorithms/round_robin.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/algorithms/round_robin.py)
- **What it does:** Implements standard Round Robin routing using a cyclic index counter ($i \leftarrow (i + 1) \pmod N$) across healthy nodes.
- **Importance:** Acts as the baseline control algorithm demonstrating why naive cyclic distribution fails when nodes or workloads are heterogeneous.

#### [`backend/algorithms/least_requests.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/algorithms/least_requests.py)
- **What it does:** Evaluates instantaneous concurrency ($Score_i = \text{Queue}_i + \text{Active}_i$) and selects the node with the lowest pending workload.
- **Importance:** Represents the industry-standard concurrency-aware load balancer (used by NGINX, HAProxy, and AWS ALB).

#### [`backend/algorithms/weighted.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/algorithms/weighted.py)
- **What it does:** Computes a composite multi-criteria penalty score factoring normalized utilization ($w_u$), queue length ($w_q$), average latency ($w_l$), and hardware capacity ($w_c$).
- **Importance:** Serves as the static multi-metric baseline.

#### [`backend/algorithms/aco.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/algorithms/aco.py)
- **What it does:** Implements the complete Workload-Aware Ant Colony Optimization router:
  - Manages pheromone memory $\tau_i$ bounded within $[\tau_{\min}, \tau_{\max}]$.
  - Computes dynamic heuristic $\eta_i$ based on available GPU headroom, queue capacity, latency, and hardware compute multiplier.
  - Computes probability distribution:
    $$P_i = \frac{\tau_i^\alpha \cdot \eta_i^\beta}{\sum_j \tau_j^\alpha \cdot \eta_j^\beta}$$
  - Selects nodes probabilistically using Roulette Wheel sampling with an isolated random generator.
  - Implements exponential pheromone decay ($\tau \leftarrow (1-\rho)\tau$) and inverse-latency reward reinforcement.
- **Importance:** The core scientific contribution of the research project.

---

### Simulation Engine (`simulation/`)

#### [`backend/simulation/nodes.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/simulation/nodes.py)
- **What it does:** Manages the cluster of GPU nodes. Defines hardware tiers across three heterogeneity profiles:
  - *High Heterogeneity:* A100 (120 cap), RTX 4090 (100 cap), RTX 4080 (85 cap), RTX 3090 (75 cap), RTX 3080 (60 cap), RTX 3060 (45 cap), T4 (35 cap).
  - Handles degradation state (`degrade_node` adds a 1.8x latency multiplier; `restore_node` restores full performance).
- **Importance:** Models the physical execution layer and hardware differences that load balancers must navigate.

#### [`backend/simulation/workload.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/simulation/workload.py)
- **What it does:** Generates synthetic request arrival sequences under 7 mathematical patterns (`steady`, `bursty`, `fluctuating`, `diurnal`, `ramp-up`, `mixed`, `hotspot`) and 3 complexity tiers (`light`: 0.3x, `medium`: 0.7x, `heavy`: 1.5x).
- **Importance:** Recreates the traffic volatility of real-world AI inference clusters.

#### [`backend/simulation/engine.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/simulation/engine.py)
- **What it does:** Discrete-time simulation engine executing time-step iterations ($\Delta t$):
  - Ingests incoming workload requests from `WorkloadGenerator`.
  - Dispatches requests to the active router.
  - Tracks in-flight request completions on each node.
  - Updates queue depths and utilization percentages.
  - Samples time-series snapshots and maintains pheromone history.
  - Uses an internal instance `random.Random(seed)` to guarantee bitwise reproducibility across runs.
- **Importance:** Orchestrates the entire simulation loop.

---

### Metrics & Experiments (`metrics/` & `experiments/`)

#### [`backend/metrics/calculator.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/metrics/calculator.py)
- **What it does:** Calculates latency percentiles (P50, P95, Mean), throughput (req/s), node load variance ($\sigma^2$), and Load Balance Score ($100 - 1.5\sqrt{\sigma^2}$).
- **Importance:** Converts raw execution logs into quantitative academic evaluation metrics.

#### [`backend/experiments/runner.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/experiments/runner.py)
- **What it does:** Executes batch experiments comparing Round Robin, Least Requests, Weighted, and ACO under identical conditions. Automatically generates human-readable research insights analyzing why the winning algorithm prevailed.
- **Importance:** Powers the automated empirical evaluation and comparison pages.

---

### Automated Test Suite (`tests/`)

- [`test_algorithms.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/tests/test_algorithms.py): Asserts sequence correctness for RR, concurrency checks for LOR, weight formulas for Weighted, and pheromone dynamics for ACO.
- [`test_simulation.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/tests/test_simulation.py): Validates queue draining, capacity scaling, traffic bursts, and node degradation.
- [`test_metrics.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/tests/test_metrics.py): Validates latency percentile algorithms and load balance score boundaries ($0 \le \text{Score} \le 100$).
- [`test_experiments.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/tests/test_experiments.py): Verifies seed reproducibility and confirms all four algorithms produce distinct, non-fabricated metrics.
- [`test_api.py`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/backend/tests/test_api.py): Executes FastAPI `TestClient` checks against all REST endpoints.

---

## 4. Frontend Application (`app/`)

### [`app/layout.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/app/layout.tsx)
- **What it does:** Root layout component. Injects Google Inter font, sets HTML metadata, and wraps all pages inside `<SimulationProvider>` and `<AppShell>`.
- **Importance:** Establishes global React Context and page layout hierarchy across the entire frontend.

### [`app/globals.css`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/app/globals.css)
- **What it does:** Configures Tailwind base layers, CSS variables for dark theme, custom scrollbars, and keyframe animations (`fade-in`, `pulse-glow`).
- **Importance:** Provides uniform styling and responsive visual aesthetics.

### [`app/page.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/app/page.tsx) (Overview Dashboard)
- **What it does:** Landing page featuring the research title hero, quick action buttons, live System KPI metric cards, an interactive SVG cluster topology diagram, and active GPU node cards.
- **Importance:** The central dashboard providing an instant visual summary of cluster status.

### [`app/simulation/page.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/app/simulation/page.tsx) (Live Simulation)
- **What it does:** Primary interactive simulation interface featuring:
  - 8-stage pipeline animation ([`SystemPipeline`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/shared/SystemPipeline.tsx)).
  - Left control panel ([`SimulationControls`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/shared/SimulationControls.tsx)).
  - Tabbed workspace: Live Request Routing Feed, GPU Node Cards with degrade toggles, Real-Time Metric Charts, and ACO Decision Probability Breakdowns.
- **Importance:** Allows users to observe and interact with live routing decisions in real time.

### [`app/comparison/page.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/app/comparison/page.tsx) (Algorithm Comparison)
- **What it does:** Head-to-head comparison workspace. Configures workload patterns, request rates, duration, and node counts, then executes all 4 algorithms on identical workloads via the backend `/api/comparison/run` endpoint. Renders comparison tables, winner cards, and multi-metric radar plots.
- **Importance:** The core comparative analysis tool for benchmarking algorithms.

### [`app/experiments/page.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/app/experiments/page.tsx) (Empirical Scenarios)
- **What it does:** Displays 6 pre-configured research scenarios (e.g., *Sudden Node Degradation*, *High-Concurrency Burst*, *Skewed Heavy-Compute*). Clicking "Run Experiment" executes the scenario on the backend and displays comprehensive ranking cards and time-series line charts.
- **Importance:** Standardized research testbed ensuring reproducible benchmark comparisons.

### [`app/aco/page.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/app/aco/page.tsx) (ACO Explorer)
- **What it does:** Interactive educational guide explaining ACO concepts (Ants $\to$ Routing decisions, Pheromone $\to$ Historical quality, Heuristic $\to$ Instantaneous headroom). Features live dual-bar visualizations of $\tau$ and $\eta$ values and hyperparameter explanations.
- **Importance:** Demystifies the mathematical mechanics of Ant Colony Optimization.

### [`app/research/page.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/app/research/page.tsx) (Research & Methodology)
- **What it does:** Academic reference section detailing mathematical formulations, related literature, experimental setup, and citations for report/paper writing.
- **Importance:** Documents the academic rigor and theoretical backing of the project.

---

## 5. UI Components (`components/`)

### Layout Shell (`components/layout/`)

- [`AppShell.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/layout/AppShell.tsx): Outer responsive framework managing mobile sidebar states and main content padding.
- [`Sidebar.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/layout/Sidebar.tsx): Sticky sidebar with navigation links to Overview, Simulation, Comparison, Experiments, ACO Explorer, and Research.
- [`TopBar.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/layout/TopBar.tsx): Top header bar displaying active router badge, live status indicators (`Running`, `Paused`, `Idle`), quick play/reset controls, and presentation mode toggle.

### Domain-Specific Visualizers (`components/shared/`)

- [`ArchitectureDiagram.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/shared/ArchitectureDiagram.tsx): SVG-based interactive architecture visualizer showing client requests passing through the load balancing gateway to heterogeneous GPUs.
- [`ComparisonCharts.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/shared/ComparisonCharts.tsx): Recharts-powered bar charts, multi-line charts, and radar charts comparing all 4 algorithms.
- [`ComparisonTable.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/shared/ComparisonTable.tsx): Metric table summarizing Avg Latency, P50, P95, Throughput, GPU Util, Load Balance Score, and Load Variance with trophy icons for top performers.
- [`MetricCard.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/shared/MetricCard.tsx): Standardized KPI card featuring colored accents, numeric formatting, tooltip descriptions, and hydration protection (`suppressHydrationWarning`).
- [`MetricCharts.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/shared/MetricCharts.tsx): Real-time streaming charts plotting latency, queue length, GPU utilization, and throughput over elapsed simulation time.
- [`NodeCard.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/shared/NodeCard.tsx): Displays individual GPU telemetry (utilization progress bar, queue, active count, latency, throughput, capacity, and ACO pheromone level). Contains full-width, bottom-aligned "Degrade Node" and "Restore Node" action buttons.
- [`PheromoneVisualization.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/shared/PheromoneVisualization.tsx): Renders dual horizontal bars comparing pheromone level ($\tau$, purple) and heuristic suitability ($\eta$, blue) per node.
- [`RequestFlow.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/shared/RequestFlow.tsx): Live feed of the last 10 routed requests showing request ID, complexity, target GPU, and routing rationale.
- [`SimulationControls.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/shared/SimulationControls.tsx): Control panel containing:
  - Algorithm selector buttons (Round Robin, Least Requests, Weighted, ACO).
  - Balanced 7-pattern workload grid with tooltip descriptions.
  - Sliders for request rate and button toggles for node count and heterogeneity.
  - Symmetrical Start, Pause, Reset, and Burst action buttons.
- [`SystemPipeline.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/shared/SystemPipeline.tsx): Animated horizontal stepper illustrating the 8 phases of inference request routing (Arrival $\to$ Inspection $\to$ Metric Sampling $\to$ ACO Routing $\to$ Dispatch $\to$ GPU Execution $\to$ Reinforcement $\to$ Response).

### UI Primitives (`components/ui/`)
- Contains 47 modular components built on Radix UI primitives: [`button.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/ui/button.tsx), [`card.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/ui/card.tsx), [`badge.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/ui/badge.tsx), [`progress.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/ui/progress.tsx), [`separator.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/ui/separator.tsx), [`tabs.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/ui/tabs.tsx), [`tooltip.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/ui/tooltip.tsx), and [`slider.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/components/ui/slider.tsx).
- **Importance:** Provides accessible, keyboard-navigable UI building blocks.

---

## 6. Frontend Libraries, Services & Types (`lib/` & `types/`)

### [`lib/services/apiService.ts`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/lib/services/apiService.ts)
- **What it does:** Provides the `FastApiClient` class wrapping browser `fetch` calls with error handling and JSON parsing for all backend endpoints.
- **Importance:** The single point of network communication between frontend and backend.

### [`lib/services/simulationService.ts`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/lib/services/simulationService.ts)
- **What it does:** Implements the `SimulationService` interface:
  - `FastAPIInferenceService`: Connects directly to the Python backend; synchronizes state continuously.
  - `LocalSimulationService`: In-browser fallback engine activated automatically if the Python backend is unreachable.
- **Importance:** Guarantees zero frontend crashes even if the backend is stopped or restarting.

### [`lib/simulation/SimulationContext.tsx`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/lib/simulation/SimulationContext.tsx)
- **What it does:** React Context providing global state: `config`, `state`, `nodes`, `kpis`, `recentDecisions`, `metricsHistory`, and controls (`start`, `pause`, `reset`, `injectBurst`, `degradeNode`, `restoreNode`, `runComparison`, `runExperiment`).
- **Importance:** Coordinates simulation state across all pages without prop-drilling.

### [`lib/data/mockData.ts`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/lib/data/mockData.ts)
- **What it does:** Declares deterministic initial baseline profiles for GPUs (Low, Medium, High) and default configuration constants. Avoids non-deterministic random calls to eliminate React hydration mismatch errors.
- **Importance:** Ensures consistent initial rendering across SSR and client hydration.

### [`lib/data/experiments.ts`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/lib/data/experiments.ts)
- **What it does:** Defines configuration dictionaries for the 6 standardized research benchmark scenarios.
- **Importance:** Ensures experiments use identical parameters across runs.

### [`lib/utils.ts`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/lib/utils.ts)
- **What it does:** Exports the `cn(...)` utility merging `clsx` conditionals with `tailwind-merge` class deduplication.
- **Importance:** Used by all UI components for dynamic Tailwind class styling.

### [`types/simulation.ts`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/types/simulation.ts) & [`types/algorithms.ts`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/types/algorithms.ts)
- **What they do:** Define TypeScript interfaces for simulation models, requests, decisions, snapshots, algorithms, and workload patterns.
- **Importance:** Guarantees end-to-end type safety between frontend code and backend API contracts.

---

## 7. System Data Flow & Dependency Matrix

```
[ User Interaction: Slider / Button Click ]
                   │
                   ▼
       SimulationControls.tsx / Page
                   │
                   ▼
         SimulationContext.tsx
                   │
                   ▼
          simulationService.ts
                   │
                   ▼
             apiService.ts
                   │
             (HTTP POST / GET)
                   │
                   ▼
         backend/api/routes.py
                   │
                   ▼
       backend/simulation/engine.py
        ├── algorithms/ (aco.py, least_requests.py, etc.)
        ├── simulation/nodes.py (NodeCluster)
        └── simulation/workload.py (WorkloadGenerator)
                   │
                   ▼
       backend/metrics/calculator.py
                   │
             (JSON Response)
                   │
                   ▼
         SimulationContext.tsx
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
    NodeCard.tsx      MetricCharts.tsx / ComparisonTable.tsx
  (UI updates at 60 FPS without layout shift or hydration errors)
```

---

## 8. Summary File Quick-Reference Table

| File Path | Primary Technology | Core Functionality | Importance |
| :--- | :--- | :--- | :--- |
| `backend/main.py` | Python (FastAPI) | Server entrypoint, CORS configuration | Bootstraps backend service |
| `backend/api/routes.py` | Python (FastAPI) | REST endpoint handlers | Connects HTTP requests to simulator |
| `backend/models/schemas.py` | Python (Pydantic v2) | Data schemas with camelCase serialization | Type contract with TypeScript |
| `backend/algorithms/aco.py` | Python (NumPy) | Workload-aware ACO router ($\tau, \eta, P_i$) | Core research contribution |
| `backend/algorithms/least_requests.py` | Python | Least Outstanding Requests router | Concurrency-aware baseline |
| `backend/algorithms/round_robin.py` | Python | Cyclic Round Robin router | Traditional baseline control |
| `backend/algorithms/weighted.py` | Python | Multi-criteria weighted router | Static metric baseline |
| `backend/simulation/engine.py` | Python | Discrete-event simulation loop | Executes deterministic physics |
| `backend/simulation/nodes.py` | Python | Heterogeneous GPU cluster manager | Models hardware compute capacities |
| `backend/simulation/workload.py` | Python | 7 traffic distribution generators | Recreates dynamic inference surges |
| `backend/metrics/calculator.py` | Python | Latency (P50/P95), throughput, score | Produces academic benchmarks |
| `backend/experiments/runner.py` | Python | Batch multi-algorithm benchmark harness | Powers scenario comparisons |
| `backend/tests/*` (5 files) | Python (Pytest) | 19 automated unit & integration tests | Guarantees numerical integrity |
| `app/page.tsx` | TypeScript (Next.js) | Overview dashboard & cluster topology | Main landing page |
| `app/simulation/page.tsx` | TypeScript (Next.js) | Interactive real-time simulation page | Live telemetry & control plane |
| `app/comparison/page.tsx` | TypeScript (Next.js) | 4-algorithm head-to-head workbench | Empirical evaluation dashboard |
| `app/experiments/page.tsx` | TypeScript (Next.js) | 6 standardized research scenarios | Reproducible research evaluations |
| `app/aco/page.tsx` | TypeScript (Next.js) | Interactive ACO visualizer & guide | Educational algorithm explorer |
| `app/research/page.tsx` | TypeScript (Next.js) | Academic methodology & citations | Paper & report reference |
| `components/shared/NodeCard.tsx` | TypeScript (React) | GPU telemetry card with degrade button | Visualizes node state & health |
| `components/shared/SimulationControls.tsx` | TypeScript (React) | Parameter sliders & simulation buttons | User input control panel |
| `components/shared/ComparisonCharts.tsx` | TypeScript (Recharts) | Bar, line, and radar comparison graphs | Visual multi-metric analytics |
| `components/shared/ComparisonTable.tsx` | TypeScript (React) | Tabular metric comparison with trophies | Numerical head-to-head view |
| `lib/services/apiService.ts` | TypeScript | Typed fetch client for backend REST API | Client-server HTTP bridge |
| `lib/services/simulationService.ts` | TypeScript | Dual-engine state synchronizer | Fault-tolerant state manager |
| `lib/simulation/SimulationContext.tsx` | TypeScript (React) | Global React Context provider | Central frontend state store |
| `next.config.js` | JavaScript | API reverse-proxy configuration | Eliminates CORS during development |
| `package.json` | JSON | Frontend dependencies and scripts | Manages Node ecosystem |
| `requirements.txt` | Text | Python dependencies | Manages Python ecosystem |
| `PROJECT_DOCUMENTATION.md` | Markdown | Academic architecture guide | Comprehensive project manual |
| `PROJECT_STRUCTURE.md` | Markdown | Detailed file & directory breakdown | Complete repository reference |
