# ️ Airflow DAGs

[← Back to README](../README.md)

## Overview

Apache Airflow orchestrates the three autonomous ML pipelines. All DAGs live in `airflow/dags/`. The Airflow webserver is at **http://localhost:8080** (admin / admin).

> **Important:** DAGs start **paused** by default. Use `./start.sh start_dags` or `./start.sh init` to activate them, or toggle them manually in the UI.

---

## DAG 1: `inference_dag`

**Schedule:** Every hour (`@hourly`)  
**File:** `airflow/dags/inference_dag.py`

### Purpose
Runs predictions across all inventory items, flags urgent stock situations, and logs inference metadata to MLflow.

### Task Graph
```
load_inventory → run_predictions → flag_low_stock → log_to_mlflow
```

### Tasks

| Task | Description |
|---|---|
| `load_inventory` | Calls `GET /items` on the backend, returns item list via XCom |
| `run_predictions` | Calls `GET /items/{id}/prediction` for each item in parallel |
| `flag_low_stock` | Filters items where `days_until_stockout <= reorder_threshold days` and logs warnings |
| `log_to_mlflow` | Creates an MLflow run under experiment `inference_runs`, logs count of flagged items |

---

## DAG 2: `drift_detection_dag`

**Schedule:** Daily (`@daily`)  
**File:** `airflow/dags/drift_detection_dag.py`

### Purpose
Compares the statistical distribution of recent usage against the older reference window. If the distributions have shifted significantly, it triggers the retraining DAG.

### Task Graph
```
load_data_windows → run_evidently_report → evaluate_drift → [trigger_retraining | no_action]
```

### Tasks

| Task | Description |
|---|---|
| `load_data_windows` | Reads `usage_history.csv`, splits into **current** (last 7 days) and **reference** (days 8–68) windows |
| `run_evidently_report` | POSTs both windows to `http://evidently:8001/drift-report`, receives drift metrics |
| `evaluate_drift` | Checks `dataset_drift` boolean from Evidently response |
| `trigger_retraining` | If drift detected → hits Airflow REST API to trigger `retraining_dag` |

### Drift Detection (Evidently)
The Evidently service runs `DataDriftPreset`, which applies the **Jensen-Shannon divergence** or **Wasserstein distance** (depending on feature type) to detect distribution shift per feature column. It returns:
- `dataset_drift` (bool) — overall drift detected
- `drift_share` (float) — fraction of features that drifted  
- `drifted_features` (list) — names of drifted columns

---

## DAG 3: `retraining_dag`

**Schedule:** None (triggered externally by `drift_detection_dag`)  
**File:** `airflow/dags/retraining_dag.py`

### Purpose
Retrain the ML model on the latest usage data, compare it against the current Production model, and only promote it if it performs better.

### Task Graph
```
retrain_model → compare_performance → [promote_model | keep_existing] → notify_completion
```

### Tasks

| Task | Description |
|---|---|
| `retrain_model` | Runs `backend/ml/train.py` inside the Airflow container, logs the new version to MLflow |
| `compare_performance` | Fetches RMSE of the new Challenger vs. the current Production model from MLflow |
| `promote_model` | If Challenger RMSE < Production RMSE → promotes Challenger to Production, archives old |
| `keep_existing` | Logs that existing model was retained; marks Challenger as Archived |
| `notify_completion` | Logs final promotion decision |

### Gating Logic (Responsible AI)
The promotion only happens when:
```
challenger_rmse < production_rmse
```
This prevents the system from blindly deploying a worse model just because usage patterns changed.

---

## Viewing DAG History

Each DAG run is visible in the Airflow UI at http://localhost:8080. You can:
- Click a DAG run to see per-task logs
- Re-trigger any DAG manually with the ️ button
- View XCom values passed between tasks

All inference and retraining runs are also cross-logged to **MLflow** at http://localhost:5001 for a unified model lineage view.
