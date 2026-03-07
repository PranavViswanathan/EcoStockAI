# ️ System Architecture

[← Back to README](../README.md)

## Overview

EcoStock AI is a containerized, microservices-based application. All services are defined in `docker-compose.yml` and communicate over a shared Docker network (`green-tech-inventory_default`).

---

## Container Map

| Container | Image | Port | Role |
|---|---|---|---|
| `postgres` | postgres:15 | 5432 | Stores Airflow metadata + MLflow run history |
| `mlflow` | custom (ghcr.io/mlflow) | 5001→5000 | Experiment tracking + model registry |
| `airflow-init` | custom apache/airflow | — | One-time DB migration + admin user creation |
| `airflow-webserver` | custom apache/airflow | 8080 | DAG UI + REST API |
| `airflow-scheduler` | custom apache/airflow | — | Executes DAG tasks on schedule |
| `backend` | custom python:3.10 | 8000 | FastAPI application server |
| `frontend` | custom node:20-alpine | 5173 | Vite/React dev server |
| `evidently` | custom python:3.10 | 8001 | Drift detection microservice |

---

## Data Flow

### Prediction Request (real-time)
```
Browser → GET /items/{id}/prediction
  → backend loads item from inventory.json
  → backend calls get_ml_prediction(item)
      → loads "Production" model from MLflow registry
      → constructs feature vector [quantity, avg_daily_usage, day_of_week, shelf_life]
      → returns days_until_stockout + insight_message
  → if ML fails → get_fallback_prediction(item)
      → returns quantity / avg_daily_usage
  → response: { days_until_stockout, prediction_source, insight_message }
```

### Autonomous Drift & Retraining Loop (scheduled)
```
Every hour:
  Airflow (inference_dag)
    → calls GET /items → GET /items/{id}/prediction for each item
    → flags items below reorder_threshold
    → logs run to MLflow experiment "inference_runs"

Every day:
  Airflow (drift_detection_dag)
    → loads last 7 days from usage_history.csv (current window)
    → loads days 8–68 as reference window
    → POST /drift-report to Evidently service
        → Evidently runs DataDriftPreset report
        → returns { dataset_drift, drift_share, drifted_features }
    → if dataset_drift == true:
        → trigger retraining_dag via Airflow REST API

On trigger:
  Airflow (retraining_dag)
    → runs backend/ml/train.py
        → reads usage_history.csv
        → engineers features (rolling avg, one-hot day, shelf_life)
        → trains LinearRegression
        → logs to MLflow, registers as new version
    → loads current Production model RMSE from MLflow
    → if new_rmse < production_rmse:
        → promotes new version to Production
        → archives old version
    → else: keeps existing Production model
```

---

## Persistent Storage

| Path | What's stored |
|---|---|
| `./data/inventory.json` | Current inventory state (quantities, metadata) |
| `./data/inventory_seed.json` | Initial seed values (used by reset) |
| `./data/usage_history.csv` | Timestamped daily usage records per item |
| `./mlruns/` | MLflow artifact storage (model files, metrics) |
| `postgres-data` (Docker volume) | Airflow DB + MLflow run metadata |

---

## Startup Dependencies

```
postgres
  ↓
mlflow (depends_on: postgres)
  ↓
airflow-init (depends_on: postgres) → runs DB migrations once, then exits
  ↓
airflow-webserver (depends_on: airflow-init completed)
airflow-scheduler (depends_on: airflow-init completed)
backend (depends_on: mlflow)
frontend (depends_on: backend)
evidently (no dependencies)
```
