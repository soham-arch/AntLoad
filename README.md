<div align="center">

# 🐜 AntLoad
### Workload-Aware Ant Colony Optimization for Dynamic Load Balancing in AI Inference Systems

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Pytest](https://img.shields.io/badge/Tests-19%20Passed-brightgreen.svg?logo=pytest&logoColor=white)](https://pytest.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

*An empirical research and simulation platform evaluating dynamic, workload-aware Ant Colony Optimization (ACO) against conventional routing strategies (Round Robin, Least Outstanding Requests, Weighted) across heterogeneous GPU clusters under volatile AI inference workloads.*

---

[Key Features](#-key-features) • [System Architecture](#-system-architecture) • [Mathematical Formulations](#-mathematical-formulations) • [Tech Stack](#-tech-stack) • [Quickstart](#-quickstart--installation) • [API Reference](#-api-endpoints) • [Testing](#-testing--verification)

</div>

---

## 📖 Table of Contents
- [Executive Overview](#-executive-overview)
- [Why AntLoad? (The AI Inference Challenge)](#-why-antload-the-ai-inference-challenge)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Mathematical Formulations](#-mathematical-formulations)
- [Comparative Routing Algorithms](#-comparative-routing-algorithms)
- [Repository Structure](#-repository-structure)
- [Tech Stack](#-tech-stack)
- [Quickstart & Installation](#-quickstart--installation)
- [API Endpoints](#-api-endpoints)
- [Experimental Scenarios & Reproducibility](#-experimental-scenarios--reproducibility)
- [Testing & Verification](#-testing--verification)
- [License](#-license)

---

## 🔬 Executive Overview

Modern Artificial Intelligence (AI) inference deployments (e.g., serving Large Language Models, Vision-Language Transformers, Diffusion Pipelines) demand rapid, dynamic load distribution. Real-world clusters are inherently **heterogeneous**—mixing premium nodes (e.g., NVIDIA A100, RTX 4090) with mid-tier or edge devices (RTX 3080, RTX 3060, T4). 

**AntLoad** implements a biologically inspired **Workload-Aware Ant Colony Optimization (ACO)** routing engine that dynamically adapts to incoming request complexity, GPU compute capacities, queue backlogs, and real-time hardware degradation.

> ⚖️ **Scientific Integrity & Academic Rigor:** AntLoad is designed for honest empirical evaluation. All algorithms are tested against identical sequences of inference requests generated using deterministic random seeds. ACO is **never** artificially hardcoded or biased to win; results reflect genuine simulated queuing and computational dynamics.

---

## ⚡ Why AntLoad? (The AI Inference Challenge)

| Challenge in AI Inference | Traditional Approaches (RR / LOR / Static) | AntLoad (Workload-Aware ACO) |
| :--- | :--- | :--- |
| **Workload Heterogeneity** | Ignores whether a prompt requires 10 tokens or 4,000 tokens of reasoning. | Factors request complexity ($\text{Light}=0.3\times, \text{Medium}=0.7\times, \text{Heavy}=1.5\times$) into routing heuristics. |
| **Hardware Heterogeneity** | Treats high-power A100 nodes identically to low-power T4 edge nodes. | Dynamically normalizes compute capacity into desirability scores ($\eta_i$). |
| **Historical Performance Memory** | Stateless routing; forgets past bottlenecks, thermal throttling, and queue build-ups. | Stigmergic pheromone trails ($\tau_i$) maintain an adaptive memory of recent execution latency. |
| **Sudden Node Degradation** | Sends full traffic to degraded nodes until queues overflow. | Pheromone decay and live heuristic penalties immediately divert traffic away from degraded nodes. |

---

## ✨ Key Features

- 🐜 **Workload-Aware Ant Colony Optimization:**
  - Dynamic pheromone matrix ($\tau$) with exponential time-step evaporation.
  - Multi-factor heuristic desirability ($\eta$) incorporating available compute headroom, queue length penalties, latency, and hardware capacity.
  - Non-linear exploration vs. exploitation control via tunable $\alpha$ and $\beta$ hyperparameters.
- 🔀 **4 Comparative Load Balancing Algorithms:**
  1. **Workload-Aware ACO** (Pheromone + Live Heuristics)
  2. **Weighted Workload-Based Routing** (Multi-criteria normalized utility scoring)
  3. **Least Outstanding Requests (LOR)** (Concurrency-aware minimum queue routing)
  4. **Round Robin (RR)** (Deterministic cyclic baseline)
- 🖥️ **Heterogeneous GPU Cluster Simulation:**
  - Node profiles for **NVIDIA A100 (120 compute units)**, **RTX 4090 (100 CU)**, **RTX 4080 (85 CU)**, **RTX 3090 (75 CU)**, **RTX 3080 (60 CU)**, **RTX 3060 (45 CU)**, and **T4 (35 CU)**.
  - First-In-First-Out (FIFO) queuing with concurrency tracking and capacity degradation injection.
- 📈 **7 Realistic Traffic Generation Distributions:**
  - *Steady*, *Bursty*, *Fluctuating*, *Diurnal*, *Ramp-Up*, *Mixed*, and *Hotspot*.
- 📊 **Real-time Observability & Telemetry Dashboard:**
  - Live animated request routing pipelines.
  - Pheromone heatmap and heuristic breakdown explorer.
  - 4-way comparative radar charts, latency percentiles ($P_{50}, P_{95}, \text{Avg}$), throughput (req/s), and load balance variance metrics.
- 🧪 **Controlled Experimentation Engine:**
  - Built-in predefined experimental scenarios with 100% reproducible PRNG seeds.

---

## 🏗️ System Architecture

AntLoad is structured as a decoupled client-server platform:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   Next.js 14 Observability Frontend                      │
│     (App Router, React 18, Tailwind CSS, Framer Motion, Recharts)        │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │  Live Dashboard  │  │   ACO Explorer   │  │ Comparative Benchmark  │  │
│  └──────────────────┘  └──────────────────┘  └────────────────────────┘  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ REST API (Proxied /api/*)
┌────────────────────────────────────▼─────────────────────────────────────┐
│                       FastAPI Simulation Server                          │
│                      (Python 3.11+, Uvicorn :8000)                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│  │    Routing Engine     │  │   Node Cluster    │  │  Metrics Engine  │  │
│  │  - ACO Router         │  │  - GPU Profiles   │  │  - Latency Calc  │  │
│  │  - Weighted Router    │  │  - FIFO Queues    │  │  - P50/P95 Stats │  │
│  │  - Least Reqs Router  │  │  - Degradation    │  │  - Load Variance │  │
│  │  - Round Robin Router │  │    Injector       │  │  - Throughput    │  │
│  └───────────────────────┘  └───────────────────┘  └──────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │               Workload Generator (7 Traffic Models)                │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 Mathematical Formulations

### 1. ACO Selection Probability
For each incoming inference request, the probability $P_i$ of choosing node $i$ from all healthy candidate nodes is:

$$P_i = \frac{\tau_i^\alpha \cdot \eta_i^\beta}{\sum_{j=1}^{N} \tau_j^\alpha \cdot \eta_j^\beta}$$

where:
- $\tau_i \in [\tau_{\min}, \tau_{\max}]$: Pheromone intensity (historical routing performance).
- $\eta_i \in [0.01, 1.0]$: Real-time heuristic desirability score.
- $\alpha \ge 0$: Pheromone trail weight (historical memory factor).
- $\beta \ge 0$: Heuristic desirability weight (instantaneous urgency factor).

### 2. Heuristic Desirability Function ($\eta_i$)
At the moment of request arrival, node suitability is computed across four weighted dimensions with degradation penalties:

$$\eta_i = w_u \cdot (1 - \text{util}_i) + w_q \cdot (1 - \text{pen}_{q,i}) + w_l \cdot (1 - \text{pen}_{l,i}) + w_c \cdot \left(\frac{\text{cap}_i}{100}\right) - \text{pen}_{\text{deg},i}$$

*Default weights: $w_u = 0.30$ (utilization), $w_q = 0.25$ (queue), $w_l = 0.20$ (latency), $w_c = 0.25$ (compute capacity).*

### 3. Pheromone Evaporation
To prevent stale convergence and continuously explore dynamic cluster changes, pheromones evaporate at each time delta $\Delta t$:

$$\tau_i(t + \Delta t) = \max\left(\tau_{\min}, \tau_i(t) \cdot (1 - \rho \cdot \Delta t)\right)$$

where $\rho$ is the evaporation rate ($0 < \rho < 1$).

### 4. Pheromone Reinforcement
Upon successful request completion with observed execution latency $L$:

$$\Delta \tau_i = Q \cdot \max\left(0.1, 1 - \frac{L}{L_{\text{ref}}}\right)$$

$$\tau_i \leftarrow \min\left(\tau_{\max}, \tau_i + \Delta \tau_i\right)$$

where $Q$ is the reinforcement reward base and $L_{\text{ref}} = 300\text{ ms}$ is the reference target latency. Failed or timed-out requests receive zero reinforcement.

---

## 🔄 Comparative Routing Algorithms

| Algorithm | Decision Criteria | Strengths | Weaknesses |
| :--- | :--- | :--- | :--- |
| **Workload-Aware ACO** | Stigmergic probability ($P_i \propto \tau_i^\alpha \eta_i^\beta$) combining history & live heuristics | Self-healing, adapts to degraded nodes, workload-complexity aware | Requires tuning of $\alpha, \beta, \rho$ |
| **Weighted Workload (WT)** | Deterministic multi-criteria utility score ($w_u, w_q, w_l, w_c$) | Balances multiple metrics simultaneously | Stateless; cannot anticipate dynamic trend shifts |
| **Least Outstanding Requests (LOR)** | Selects node minimizing $\arg\min(Q_i + A_i)$ | Fast, simple, prevents queue piling | Ignores GPU hardware capacity and job size |
| **Round Robin (RR)** | Deterministic cyclic index ($k \leftarrow (k + 1) \pmod N$) | Minimal computation overhead ($O(1)$) | Overloads weak GPUs; ignores system load |

---

## 📁 Repository Structure

```
AntLoad/
├── backend/                    # Python FastAPI Simulation Backend
│   ├── algorithms/             # Load balancing algorithms
│   │   ├── aco.py              # Workload-Aware Ant Colony Optimization
│   │   ├── least_requests.py   # Least Outstanding Requests Router
│   │   ├── round_robin.py      # Round Robin Router
│   │   └── weighted.py         # Weighted Multi-criteria Router
│   ├── api/                    # REST API routes & controllers
│   │   └── routes.py           # Simulation, node, experiment endpoints
│   ├── experiments/            # Controlled experiment runners
│   │   └── runner.py           # Multi-algorithm benchmark executor
│   ├── metrics/                # Performance calculation engine
│   │   └── calculator.py       # Latency, throughput, variance, P50/P95
│   ├── models/                 # Pydantic data models & schemas
│   │   └── schemas.py          # CamelCase / snake_case validated schemas
│   ├── simulation/             # Discrete-event simulation
│   │   ├── engine.py           # Core simulation loop & state
│   │   ├── nodes.py            # Heterogeneous GPU cluster & degradation
│   │   └── workload.py         # 7 synthetic traffic distribution models
│   ├── tests/                  # Automated pytest test suite (19 test cases)
│   └── main.py                 # FastAPI application entry point
├── app/                        # Next.js 14 App Router Pages
│   ├── page.tsx                # Main live simulation dashboard
│   ├── aco-explorer/           # Interactive ACO pheromone & heuristic visualizer
│   ├── comparison/             # Side-by-side 4-algorithm benchmark
│   ├── scenarios/              # Predefined research experiment runner
│   ├── algorithms/             # Algorithm theoretical reference
│   └── layout.tsx              # Root app layout & navigation
├── components/                 # Reusable UI & Visualization Components
│   ├── aco/                    # Pheromone heatmap, probability dials
│   ├── charts/                 # Recharts line, bar, and radar charts
│   ├── dashboard/              # Metrics cards, node cluster grids
│   ├── simulation/             # Parameter controls, traffic injection
│   └── ui/                     # Radix UI primitives & styled components
├── lib/                        # Client-side services & utilities
│   ├── services/               # API clients (apiService.ts, simulationService.ts)
│   ├── simulation/             # Client fallback simulation engine
│   └── utils.ts                # Tailwind & formatting utilities
├── requirements.txt            # Python dependencies
├── package.json                # Node.js dependencies & scripts
├── PROJECT_DOCUMENTATION.md    # Detailed academic & system documentation
└── README.md                   # Project overview & documentation
```

---

## 💻 Tech Stack

### Backend Core
- **Language:** Python 3.11+
- **Framework:** FastAPI
- **Data Validation:** Pydantic v2
- **Scientific Computing:** NumPy & Pandas
- **ASGI Server:** Uvicorn
- **Testing:** Pytest & HTTPX

### Frontend & Observability
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18 & TypeScript
- **Styling:** Tailwind CSS & Radix UI
- **Animations:** Framer Motion
- **Visualization:** Recharts & Lucide Icons
- **Notifications:** Sonner

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Python:** Version 3.11 or newer ([Download](https://www.python.org/downloads/))
- **Node.js:** Version 18.0.0 or newer with npm ([Download](https://nodejs.org/))
- **Git:** Installed on your system

### 1. Clone the Repository
```bash
git clone https://github.com/soham-arch/AntLoad.git
cd AntLoad
```

### 2. Setup & Run the Python Backend
```bash
# Optional: Create and activate a virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI backend server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
> The API server will start on `http://localhost:8000`.  
> Interactive Swagger API docs are available at `http://localhost:8000/docs`.

### 3. Setup & Run the Next.js Frontend
In a **new terminal window**:
```bash
# Install Node.js dependencies
npm install

# Start the Next.js development server
npm run dev
```
> Open `http://localhost:3000` in your web browser. Next.js will automatically proxy all `/api/*` requests to the FastAPI backend.

---

## 🔌 API Endpoints

The FastAPI backend provides a comprehensive REST interface:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and uptime |
| `GET` | `/api/nodes` | Live status, utilization, and queue depths of all GPU nodes |
| `GET` | `/api/simulation/state` | Complete simulation snapshot (metrics, nodes, history) |
| `POST` | `/api/simulation/start` | Start or resume real-time simulation clock |
| `POST` | `/api/simulation/pause` | Pause active simulation loop |
| `POST` | `/api/simulation/reset` | Reset simulation state to initial configuration |
| `POST` | `/api/simulation/tick` | Advance simulation by one discrete time step ($\Delta t$) |
| `POST` | `/api/simulation/config` | Dynamically update simulation parameters (arrival rate, $\alpha, \beta, \rho$, etc.) |
| `POST` | `/api/simulation/burst` | Inject instantaneous traffic burst into the queue |
| `POST` | `/api/simulation/request` | Submit and route a single ad-hoc inference request |
| `POST` | `/api/nodes/{id}/degrade` | Simulate hardware degradation/thermal throttling on a node |
| `POST` | `/api/nodes/{id}/restore` | Restore degraded GPU node back to 100% capacity |
| `POST` | `/api/algorithms/decision` | Step-by-step mathematical breakdown for a routing decision |
| `POST` | `/api/comparison/run` | Execute identical multi-algorithm benchmark and return comparative report |
| `GET` | `/api/experiments` | List all predefined experimental research scenarios |
| `GET` | `/api/experiments/{id}` | Run a specific predefined experiment by scenario ID |

---

## 🧪 Experimental Scenarios & Reproducibility

AntLoad includes pre-configured experiment scenarios designed to test algorithm resilience:

1. **Bursty Traffic Surge:** Evaluates queue management and backpressure handling when request rates surge 5×.
2. **Node Degradation & Recovery:** Injects a 50% capacity drop on a high-tier node to evaluate how quickly algorithms divert traffic and recover.
3. **High Heterogeneity Stress:** Tests load balancing across an asymmetric cluster (A100 vs. T4).
4. **Mixed Complexity Workload:** Evaluates performance when light, medium, and heavy inference jobs arrive simultaneously.

### Deterministic Random Seeds
All benchmark comparisons support a deterministic `seed` parameter:
```json
{
  "algorithm": "aco",
  "requestRate": 30.0,
  "workloadPattern": "bursty",
  "seed": 42
}
```
Using the same seed guarantees identical request arrival times, complexities, and execution characteristics across every algorithm.

---

## 🧪 Testing & Verification

AntLoad contains an automated unit and integration test suite covering algorithms, mathematical edge cases, API routes, and experiment reproducibility.

Run the test suite:
```bash
python -m pytest backend/tests -v
```

### Verified Test Cases:
- `test_round_robin_sequence` — Deterministic cycle and modulo rotation.
- `test_least_requests_selection` — Concurrency argmin selection.
- `test_weighted_routing_calculation` — Multi-factor scoring logic.
- `test_aco_probability_and_dynamics` — Roulette wheel selection and bounds.
- `test_aco_evaporation_and_reinforcement` — Pheromone decay and latency rewards.
- `test_health_endpoint` & `test_nodes_endpoint` — FastAPI endpoint integrity.
- `test_simulation_lifecycle` — Start, pause, tick, and reset transitions.
- `test_node_degradation_api` & `test_node_degradation_and_restoration` — Dynamic failure recovery.
- `test_experiment_reproducibility` — Deterministic seed guarantee.
- `test_all_algorithms_behave_differently` — Validates distinct behavioral characteristics.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE) — feel free to use, modify, and distribute for academic and commercial purposes.

---

<div align="center">
Built with ❤️ for AI Systems & Distributed Load Balancing Research
</div>
