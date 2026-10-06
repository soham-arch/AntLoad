# Project Documentation & System Architecture Guide

**Project Title:** *A Workload-Aware Ant Colony Optimization Approach for Dynamic Load Balancing in AI Inference Systems*  
**Academic Context:** B.Tech Engineering — Advanced Intelligent & Embedded Systems (AIES)  
**Authors/Maintainers:** Research & Development Team  

---

## Table of Contents
1. [Executive Summary & Research Objective](#1-executive-summary--research-objective)
2. [Why Backend and Frontend Are Run Separately](#2-why-backend-and-frontend-are-run-separately)
3. [End-to-End System Workflow (How It Works)](#3-end-to-end-system-workflow-how-it-works)
4. [Deep Dive: What the Backend Actually Contains](#4-deep-dive-what-the-backend-actually-contains)
5. [Complete Repository File Map & Technical Breakdown](#5-complete-repository-file-map--technical-breakdown)
6. [Mathematical Formulations Implemented](#6-mathematical-formulations-implemented)
7. [API Endpoints Reference](#7-api-endpoints-reference)
8. [Setup, Execution & Testing Guide](#8-setup-execution--testing-guide)
9. [Empirical Insights & Academic Integrity](#9-empirical-insights--academic-integrity)

---

## 1. Executive Summary & Research Objective

Modern artificial intelligence (AI) inference deployments—such as serving Large Language Models (LLMs), diffusion pipelines, and vision models—face high dynamic variability:
- **Workload Heterogeneity:** Request compute demands vary dramatically (e.g., short token completion vs. long-context reasoning or multi-step chain-of-thought).
- **Hardware Heterogeneity:** Infrastructure clusters often mix diverse GPU hardware tiers (e.g., high-tier NVIDIA A100/RTX 4090 alongside mid-tier RTX 3080/3060 and edge-tier T4).
- **Dynamic System Conditions:** Nodes experience sudden thermal throttling, variable queue delays, and memory pressure.

### The Problem
Traditional load-balancing strategies fail under these conditions:
1. **Round Robin (RR):** Distributes traffic blindly in a cycle, overloading weak GPUs while starving powerful ones.
2. **Least Outstanding Requests (LOR):** Looks only at instantaneous active counts without considering whether a request is light or heavy, or whether a node is fast or slow.
3. **Static Weighted Routing:** Assigns fixed weights based on nominal hardware capacity, failing when conditions degrade dynamically.

### The Proposed Solution
A **Workload-Aware Ant Colony Optimization (ACO)** router that models inference routing as dynamic stigmergic path selection:
- **Pheromone trails ($\tau$):** Maintain adaptive memory of historical routing quality (lower latency and high completion rate reinforce trails; evaporation prevents stagnation).
- **Heuristic desirability ($\eta$):** Evaluates instantaneous real-time suitability (queue length, current GPU utilization, latency, and hardware compute capacity).
- **Probabilistic Path Selection:** Selects nodes using exploration-exploitation trade-offs governed by parameters $\alpha$ (history) and $\beta$ (urgency).

> **Core Research Principle:** The platform conducts fair, empirical evaluations. Algorithms run on **identical workloads with deterministic random seeds**. ACO is **not** artificially programmed or hardcoded to win; results reflect genuine simulated physics and queuing behavior.

---

## 2. Why Backend and Frontend Are Run Separately

The project employs a modern, decoupled client-server architecture:
- **Backend:** Python 3.12 + FastAPI + Pydantic v2 + NumPy + Pandas (Running on `http://127.0.0.1:8000`)
- **Frontend:** Next.js 14 (App Router) + TypeScript + React 19 + Tailwind CSS + Framer Motion + Recharts (Running on `http://localhost:3000`)

### Why This Separation Is Necessary

| Dimension | Python FastAPI Backend | Next.js Frontend |
| :--- | :--- | :--- |
| **Primary Responsibility** | Mathematical modeling, discrete-event queuing simulation, routing heuristics, statistical calculations. | Real-time visualization, dynamic SVG diagrams, user interaction, parameter sliders, responsive UI. |
| **Computational Tooling** | Native support for vectorized mathematics (NumPy), statistical distributions (exponential, Poisson, normal), and reproducible PRNG seeds. | Browser rendering, component lifecycle management, high-performance chart animations at 60 FPS. |
| **Concurrency & Execution** | Python backend processes multi-node simulation state deterministically in memory without blocking UI rendering. | Client stays lightweight, fluid, and responsive regardless of how heavy the simulation compute load is. |
| **Architectural Realism** | Matches real production AI inference infrastructure (e.g., Triton Inference Server, vLLM, Ray Serve routers operate as Python/C++ microservices). | Operates as an observability dashboard / control plane querying inference telemetry via standard REST endpoints. |
| **Academic Rigor** | Backend algorithms are covered by headless automated unit/integration test suites (`pytest`) independent of browser environments. | UI can be updated or swapped without affecting the scientific validity of the routing engine. |

### How Frontend and Backend Communicate
1. In development, the Next.js dev server proxies API calls via `next.config.js`:
   ```javascript
   async rewrites() {
     return [
       {
         source: '/api/:path*',
         destination: 'http://127.0.0.1:8000/api/:path*',
       },
     ];
   }
   ```
2. The frontend [`apiService.ts`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/lib/services/apiService.ts) and [`simulationService.ts`](file:///e:/MITWPU/Engineering/3rd%20Year/AIES/Project/project/lib/services/simulationService.ts) make standard HTTP requests (`fetch('/api/simulation/state')`, `fetch('/api/comparison/run')`, etc.).
3. If the backend is temporarily offline, the frontend gracefully falls back to an embedded client-side fallback engine to prevent UI crashes.

---

## 3. End-to-End System Workflow (How It Works)

```
[ Incoming Inference Request ]
              │
              ▼
 1. Workload Generator (workload.py / mockData.ts)
    - Pattern: steady | bursty | fluctuating | diurnal | ramp-up | mixed | hotspot
    - Complexity: light (0.3x) | medium (0.7x) | heavy (1.5x)
              │
              ▼
 2. Load Balancing Router (algorithms/)
    - Round Robin: Cyclic deterministic index
    - Least Requests: Concurrency min argmin(Q + A)
    - Weighted: Multi-criteria utility score
    - ACO: P_i = (τ_i^α * η_i^β) / Σ(τ_j^α * η_j^β)
              │
              ▼
 3. Heterogeneous GPU Cluster (nodes.py)
    - High: A100 (120), RTX 4090 (100), RTX 4080 (85), RTX 3090 (75), RTX 3080 (60), RTX 3060 (45), T4 (35)
    - Queue mechanics: First-In-First-Out with concurrency tracking
    - Dynamic degradation injection: 1.8x latency penalty + 50% throughput dampening
              │
              ▼
 4. Pheromone Dynamics (aco.py)
    - Evaporation: τ_i ← (1 - ρ) * τ_i
    - Reinforcement: Δτ_i = Q / (Latency * DegradationFactor)
              │
              ▼
 5. Metrics Engine & Aggregator (metrics/calculator.py)
    - Latency (Avg, P50, P95), Throughput (req/s), GPU Util (%),
      Load Variance, Load Balance Score, Completion Rate (%)
              │
              ▼
 6. Next.js Observability Telemetry (app/)
    - Live Pipeline Animation -> Request Flow -> Comparative Radar -> Empirical Reports
```

---

## 4. Deep Dive: What the Backend Actually Contains

The backend is organized in the `backend/` directory as a modular Python package:

### 1. Data Models (`backend/models/schemas.py`)
- Defines robust Pydantic v2 schemas validating all data structures exchanged with the client.
- Uses `to_camel` alias generator so Python code uses snake_case (`request_rate`, `node_count`) while automatically serializing to JSON `camelCase` (`requestRate`, `nodeCount`) for seamless TypeScript compatibility.
- Models include: `GPUProfile`, `NodeMetrics`, `InferenceRequest`, `RoutingDecision`, `SimulationConfig`, `SimulationState`, `MetricsSnapshot`, `KPIMetrics`, `AlgorithmResult`, and `ExperimentConfig`.

### 2. Load Balancing Algorithms (`backend/algorithms/`)
- **`round_robin.py` (`RoundRobinRouter`):** Maintains an atomic cycle pointer advancing modulo the healthy node count. Agnostic of workload complexity or queue size.
- **`least_requests.py` (`LeastRequestsRouter`):** Selects node minimizing $Score_i = Queue_i + Active_i$. Balances instantaneous concurrency.
- **`weighted.py` (`WeightedWorkloadRouter`):** Calculates multi-attribute normalized score factoring utilization ($w_u$), queue length ($w_q$), average latency ($w_l$), and hardware compute capacity ($w_c$).
- **`aco.py` (`ACORouter`):**
  - Manages pheromone dictionary `tau: Dict[node_id, float]` bounded by $[\tau_{\min}, \tau_{\max}]$.
  - Calculates real-time heuristic $\eta_i$ factoring available headroom, queue length, latency, and capacity factor.
  - Generates cumulative probability distributions and selects nodes using Roulette Wheel sampling with reproducible pseudo-random generators.
  - Implements exponential evaporation and inverse-latency reward reinforcement.

### 3. Simulation Engine (`backend/simulation/`)
- **`nodes.py` (`NodeCluster`):**
  - Instantiates heterogeneous GPU node pools across Low, Medium, and High heterogeneity profiles.
  - Tracks node health status (`healthy`, `degraded`, `overloaded`, `offline`).
  - Supports dynamic degradation injection and node restoration.
- **`workload.py` (`WorkloadGenerator`):**
  - Generates realistic inference request arrival sequences matching 7 distinct traffic distributions:
    - *Steady:* Uniform arrivals.
    - *Bursty:* Poisson arrivals with intermittent high-amplitude surges.
    - *Fluctuating:* Sinusoidal arrival intensity.
    - *Diurnal:* Day/night load cycles.
    - *Ramp-Up:* Monotonically increasing stress load.
    - *Mixed:* Realistic compound traffic.
    - *Hotspot:* Concentrated heavy compute bursts.
  - Tags requests with discrete compute multipliers (`light`: 0.3x, `medium`: 0.7x, `heavy`: 1.5x).
- **`engine.py` (`SimulationEngine`):**
  - Discrete-time simulation engine executing state updates over configurable time deltas ($\Delta t$).
  - Tracks in-flight request completions, updates queue lengths, applies capacity-scaled processing rates, and records routing decisions.
  - Employs an internal, isolated `random.Random(seed)` instance to guarantee 100% reproducible benchmark results.

### 4. Metrics & Evaluation (`backend/metrics/calculator.py`)
- Calculates statistical percentiles (P50, P95) and arithmetic means.
- Computes **Load Variance** across nodes:
  $$\text{Variance} = \frac{1}{N}\sum_{i=1}^N (\text{Util}_i - \overline{\text{Util}})^2$$
- Computes **Load Balance Score**:
  $$\text{Score} = \max\left(0, 100 - 1.5 \cdot \sqrt{\text{Variance}}\right)$$
- Tracks throughput ($completed / \Delta t$) and request completion rates.

### 5. Experiment Runner (`backend/experiments/runner.py`)
- Executes multi-algorithm benchmark comparisons under identical traffic streams.
- Runs 6 pre-configured research scenarios:
  1. *Baseline Heterogeneous Traffic*
  2. *High-Concurrency Traffic Burst*
  3. *Sudden Node Degradation / Thermal Throttling*
  4. *Skewed Heavy-Compute Requests*
  5. *Extended Diurnal Cycle*
  6. *Extreme Hardware Heterogeneity (A100 down to T4)*
- Produces automated research insights explaining *why* the winning algorithm succeeded based on measured performance characteristics.

### 6. REST API Controller (`backend/api/routes.py` & `backend/main.py`)
- Provides clean, well-documented FastAPI endpoints with CORS middleware and automatic Swagger OpenAPI documentation at `http://127.0.0.1:8000/docs`.

### 7. Test Suite (`backend/tests/`)
- 19 comprehensive, headless automated tests verifying:
  - Algorithm routing decisions and sequence logic.
  - ACO mathematical pheromone bounds and evaporation dynamics.
  - Simulation discrete-time step updates and traffic burst response.
  - Metric calculation precision.
  - Experiment reproducibility and distinct algorithmic behaviors.
  - REST API endpoint contracts.

---

## 5. Complete Repository File Map & Technical Breakdown

```
project/
├── backend/                              # Python FastAPI Backend
│   ├── algorithms/                       # Routing Policy Implementations
│   │   ├── __init__.py                   # Algorithm factory & interface
│   │   ├── aco.py                        # Workload-Aware Ant Colony Optimization
│   │   ├── least_requests.py             # Least Outstanding Requests policy
│   │   ├── round_robin.py                # Cyclic Round Robin policy
│   │   └── weighted.py                   # Multi-criteria Weighted routing policy
│   ├── api/                              # REST API Router Layer
│   │   ├── __init__.py
│   │   └── routes.py                     # Route handlers for simulation, nodes, comparison
│   ├── experiments/                      # Controlled Empirical Experiments
│   │   ├── __init__.py
│   │   └── runner.py                     # Batch experiment harness & insight generator
│   ├── metrics/                          # Mathematical Metrics & Statistics
│   │   ├── __init__.py
│   │   └── calculator.py                 # Latency (P50/P95), throughput, load balance score
│   ├── models/                           # Pydantic v2 Data Schemas
│   │   ├── __init__.py
│   │   └── schemas.py                    # CamelCase-serialized API models
│   ├── simulation/                       # Discrete Event Simulation Engine
│   │   ├── __init__.py
│   │   ├── engine.py                     # Core tick-based simulator
│   │   ├── nodes.py                      # NodeCluster & GPU hardware profiles
│   │   └── workload.py                   # Synthetic inference workload generators
│   ├── tests/                            # Automated Pytest Suite (19 tests)
│   │   ├── test_algorithms.py
│   │   ├── test_api.py
│   │   ├── test_experiments.py
│   │   ├── test_metrics.py
│   │   └── test_simulation.py
│   ├── __init__.py
│   └── main.py                           # FastAPI application entrypoint
│
├── app/                                  # Next.js 14 App Router (Frontend)
│   ├── aco/                              # ACO Explorer Page
│   │   └── page.tsx                      # Live pheromone trails, heuristics, math guide
│   ├── comparison/                       # Algorithm Comparison Page
│   │   └── page.tsx                      # 4-algorithm head-to-head comparison harness
│   ├── experiments/                      # Predefined Research Scenarios Page
│   │   └── page.tsx                      # 6 empirical benchmark scenario cards & charts
│   ├── research/                         # Academic Research Page
│   │   └── page.tsx                      # Paper literature, methodology, citations
│   ├── simulation/                       # Live Interactive Simulator Page
│   │   └── page.tsx                      # Pipeline visualizer, node cards, live controls
│   ├── globals.css                       # Global styles, Tailwind directives, dark theme
│   ├── layout.tsx                        # Root layout wrapping AppShell & SimulationProvider
│   └── page.tsx                          # Overview Dashboard (Hero, KPIs, System Topology)
│
├── components/                           # React UI Components
│   ├── layout/                           # Layout Shell Components
│   │   ├── AppShell.tsx                  # Responsive layout container with sidebar
│   │   ├── Sidebar.tsx                   # Main navigation drawer
│   │   └── TopBar.tsx                    # Header with algorithm status & quick controls
│   ├── shared/                           # Domain-Specific UI Components
│   │   ├── ArchitectureDiagram.tsx       # Interactive SVG topology diagram
│   │   ├── ComparisonCharts.tsx          # Recharts bar, line, and radar visualizations
│   │   ├── ComparisonTable.tsx           # Full metrics comparison table with winner badges
│   │   ├── MetricCard.tsx                # Metric KPI card with trend & hydration safety
│   │   ├── MetricCharts.tsx              # Live time-series charts (latency, util, queue)
│   │   ├── NodeCard.tsx                  # GPU card with utilization bar & degrade button
│   │   ├── PheromoneVisualization.tsx    # ACO pheromone (τ) vs heuristic (η) bars
│   │   ├── RequestFlow.tsx               # Animated visual trace of routed requests
│   │   ├── SimulationControls.tsx        # Control panel (start, pause, reset, burst, pattern)
│   │   └── SystemPipeline.tsx            # End-to-end inference lifecycle pipeline animation
│   └── ui/                               # Radix UI Primitives (Button, Card, Badge, etc.)
│
├── lib/                                  # Frontend Library & Services Layer
│   ├── algorithms/                       # Client fallback algorithms
│   ├── data/
│   │   └── mockData.ts                   # Initial baseline state & deterministic GPU profiles
│   ├── metrics/
│   │   └── calculator.ts                 # Client metric calculation utilities
│   ├── services/
│   │   ├── apiService.ts                 # FastApiClient HTTP wrapper
│   │   └── simulationService.ts          # FastAPIInferenceService state manager
│   ├── simulation/
│   │   ├── engine.ts                     # Client-side fallback simulation engine
│   │   └── SimulationContext.tsx         # React Context providing global simulation state
│   └── utils.ts                          # Class variance utilities (cn helper)
│
├── types/                                # TypeScript Interfaces
│   ├── algorithms.ts                     # Algorithm and workload metadata
│   └── simulation.ts                     # Core TypeScript schemas matching backend models
│
├── next.config.js                        # Next.js config with /api/* reverse proxy to FastAPI
├── package.json                          # Node dependencies and npm scripts
├── requirements.txt                      # Python dependencies (fastapi, uvicorn, numpy, etc.)
├── tsconfig.json                         # TypeScript compiler configuration
└── README.md                             # Repository introductory README
```

---

## 6. Mathematical Formulations Implemented

### 1. Workload-Aware ACO Selection Probability
For each incoming request, the probability $P_i$ of routing to node $i \in \mathcal{N}_{\text{healthy}}$ is:

$$P_i = \frac{\tau_i^\alpha \cdot \eta_i^\beta}{\sum_{j \in \mathcal{N}_{\text{healthy}}} \tau_j^\alpha \cdot \eta_j^\beta}$$

- **$\tau_i$ (Pheromone Trail):** Reflects cumulative historical performance.
- **$\eta_i$ (Heuristic Desirability):** Real-time node suitability evaluated at request time:
  $$\eta_i = w_u \cdot \left(1 - \frac{\text{Util}_i}{100}\right) + w_q \cdot \frac{1}{1 + Q_i} + w_l \cdot \frac{100}{100 + L_i} + w_c \cdot \frac{C_i}{C_{\max}}$$
- **$\alpha, \beta$:** Weight exponents governing exploration vs. exploitation.

### 2. Pheromone Evaporation & Reinforcement
- **Evaporation:** Prevents the colony from converging prematurely on outdated states:
  $$\tau_i(t + \Delta t) = \max\left(\tau_{\min}, (1 - \rho) \cdot \tau_i(t)\right)$$
  *(where $\rho \in (0, 1)$ is the evaporation rate, default $0.1$)*.
- **Reinforcement:** Applied upon successful inference completion:
  $$\Delta \tau_i = \frac{Q_{\text{base}}}{\max(10, \text{Latency}_i) \cdot \text{DegradationMultiplier}}$$
  $$\tau_i \leftarrow \min\left(\tau_{\max}, \tau_i + \Delta \tau_i\right)$$

### 3. Latency Physics Model
Execution latency is modeled realistically based on node queue length, utilization, hardware compute capacity, and compute requirement:
$$\text{BaseLatency} = 30 + (\text{ComputeMultiplier} \times 0.8)$$
$$\text{QueueDelay} = Q_i \times 8\text{ ms}$$
$$\text{UtilizationDelay} = \left(\frac{\text{Util}_i}{100}\right) \times 40\text{ ms}$$
$$\text{CapacityFactor} = \frac{100}{\max(10, \text{Capacity}_i)}$$
$$\text{TotalLatency} = (\text{BaseLatency} + \text{QueueDelay} + \text{UtilizationDelay}) \times \text{CapacityFactor} \times \text{DegradationMultiplier}$$

---

## 7. API Endpoints Reference

The FastAPI backend exposes the following REST API at `http://127.0.0.1:8000`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint returning status and version. |
| `GET` | `/api/nodes` | List all nodes, current health, queue, and metrics. |
| `POST` | `/api/nodes/{node_id}/degrade` | Inject degradation penalty (simulates thermal throttling). |
| `POST` | `/api/nodes/{node_id}/restore` | Restore degraded node to normal health. |
| `GET` | `/api/simulation/state` | Fetch complete current simulation state snapshot. |
| `POST` | `/api/simulation/start` | Start/resume live discrete-time simulation. |
| `POST` | `/api/simulation/pause` | Pause live simulation. |
| `POST` | `/api/simulation/reset` | Reset simulation state to initial baselines. |
| `POST` | `/api/simulation/config` | Update simulation configuration parameters. |
| `POST` | `/api/simulation/burst` | Inject a high-volume traffic surge into the cluster. |
| `POST` | `/api/simulation/decision` | Query routing decision for a candidate request under chosen policy. |
| `POST` | `/api/comparison/run` | Execute 4 algorithms on identical synthetic workloads and return comparative metrics. |
| `POST` | `/api/experiments/run` | Execute a predefined research experiment scenario. |

---

## 8. Setup, Execution & Testing Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **Python:** v3.10, 3.11, or 3.12
- **Git**

### Installation

1. **Clone & Open Project Directory:**
   ```bash
   cd "project"
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

3. **Install Python Backend Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

---

### Running the System (2 Terminals)

#### Terminal 1: Start Python FastAPI Backend
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend will be active at:* `http://127.0.0.1:8000`  
*Interactive Swagger API Docs:* `http://127.0.0.1:8000/docs`

#### Terminal 2: Start Next.js Frontend
```bash
npm run dev
```
*Frontend will be active at:* `http://localhost:3000`

---

### Automated Testing

#### Run Backend Pytest Suite
```bash
python -m pytest backend/tests -v
```
*Validates algorithms, mathematical pheromone dynamics, simulation ticks, metrics, and API routes (19/19 passing).*

#### Run TypeScript Type Check
```bash
node node_modules/typescript/lib/tsc.js --noEmit
```
*Ensures zero type regressions across all frontend components and pages.*

---

## 9. Empirical Insights & Academic Integrity

The research evaluation platform demonstrates nuanced, realistic conclusions:

1. **Where ACO Excels:**
   - Under **high hardware heterogeneity** and **bursty or mixed workloads**, ACO consistently yields superior P95 latency and higher throughput by gravitating toward high-capacity nodes while using heuristic adaptability to prevent queue pile-ups.
   - Under **node degradation scenarios**, ACO quickly detects falling heuristic suitability and evaporates stale pheromone, rerouting traffic away from failing GPUs faster than static policies.

2. **Where Simpler Heuristics Suffice:**
   - Under **low heterogeneity** (uniform GPUs) and **steady, light traffic**, Least Outstanding Requests or Round Robin often achieve comparable latency with lower computational decision overhead.

3. **Academic Integrity:**
   - The platform **never fabricates metrics**. If Round Robin or Least Requests outperforms ACO under a specific uniform workload, the system presents those results honestly and provides a technical explanation in the Research Insight panel.

---

## 10. Conclusion

This project integrates a production-grade Python numerical simulation engine with an interactive, modern Next.js visualization interface. By decoupling the simulation mechanics from the rendering layer, it achieves both computational fidelity and real-time observability—providing a robust platform for experimental research in AI inference load balancing.
