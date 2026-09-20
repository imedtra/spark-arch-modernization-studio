# 🚀 SPARK Architecture Modernization Studio (DrModernize)

> **End-to-End Enterprise Cloud Architecture Assessment, 6R Treatment Engine, Dependency Wave Planner, Google Cloud 5-Pillar Well-Architected Framework (WAF) Validator, and 3-Year Executive TCO Studio.**

Built for **Google Cloud EMEA Customer Engineering** (`//depot/google3/experimental/emea-oce-tooling/arch-modernization-studio`), combining the client-facing workflow of [DrMigrate](https://www.drmigrate.com/) with Google3's dynamic service mapping (`aws-to-gcp-service-mapper`), WAF scoring (`gcp-waf-validator`), and Cloud Run + IAP deployment (`algolis-app-creator`).

---

## 🌟 Core Capabilities

1. **Dual Executive & Technical Workbench Modes**:
   - **Live Technical Workbench**: Interactive 4-tab studio for Customer Engineers and Solutions Architects.
   - **Executive Business Case (CxO View)**: Boardroom-ready 3-year TCO comparison, ROI, Payback Period (in months), and Carbon Footprint reduction ($tCO_2e$).
2. **Pre-Loaded Enterprise Estates & Batch CSV Importer**:
   - **Cymbal Global Retail (48 Servers, VMware + AWS Hybrid)**
   - **EuroBank Core Banking (64 Servers, IBM AIX / Mainframe DB2)**
   - **FleetPulse Global IoT & SaaS (35 Workloads, AWS Multi-Account)**
   - Plus **+ Import CSV** (RVTools / server inventory) and **+ Add Workload** intake wizard.
3. **Interactive 6R Treatment Engine & Precision Tuning**:
   - Assigns *Rehost, Replatform, Refactor, Replace, Retain, or Retire* strategies and target Google Cloud services (*GKE Autopilot, Cloud Run, AlloyDB, Cloud SQL Enterprise Plus, BigQuery Lakehouse, Memorystore*).
   - Change any workload's 6R strategy or target GCP service in real time to immediately recalculate TCO, Waves, and ROI.
4. **Live SVG Dependency Topology & Wave Planner**:
   - Dynamic SVG visual graph mapping Perimeter/IAM $\rightarrow$ Web/Ingress $\rightarrow$ Middleware/Compute $\rightarrow$ Data/AI Lakehouse dependencies.
   - Automated topological sorting into **Waves 0 – 3** (18-week accelerated modernization timeline).
5. **5-Pillar Google Cloud Well-Architected Framework (WAF) Audit**:
   - Control-level evaluation across Security, Reliability, Operational Excellence, Performance, and Cost Optimization with 1-click **Apply AI Remediation**.
6. **1-Click Deliverable Exports**:
   - Export full **Executive & Technical Assessment Markdown Report** or **Google Cloud FastFabric Terraform HCL Blueprint** (`main.tf`).

---

## 🛠️ Build, Test & Run Locally (Blaze)

```bash
# 1. Run unit tests
/google/bin/releases/arca9-local-blaze-cli/blaze-for-agents test //experimental/emea-oce-tooling/arch-modernization-studio/...

# 2. Build application binary
/google/bin/releases/arca9-local-blaze-cli/blaze-for-agents build //experimental/emea-oce-tooling/arch-modernization-studio/app:app

# 3. Run local server (defaults to port 8085)
PORT=8085 ./blaze-bin/experimental/emea-oce-tooling/arch-modernization-studio/app/app
```

---

## ☁️ Deploy to Cloud Run with Identity-Aware Proxy (IAP)

```bash
/google/bin/releases/arca9-local-blaze-cli/blaze-for-agents run //experimental/emea-oce-tooling/arch-modernization-studio:deploy -- /path/to/external/terraform-config-dir
```
