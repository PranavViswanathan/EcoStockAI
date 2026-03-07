# ️ Developer Mode & Shell Scripts

[← Back to README](../README.md)

## Shell Scripts

All scripts live in the project root and are executable (`chmod +x`).

---

### `start.sh`

Starts the Docker Compose stack. Accepts an optional subcommand:

| Command | Description |
|---|---|
| `./start.sh` | Start all 7 containers in detached mode |
| `./start.sh start_dags` | Start containers + wait for Airflow + unpause all 3 DAGs |
| `./start.sh init` | Full first-time setup: start + seed + train ML model + start DAGs |

**`init` does exactly this, in order:**
1. `docker compose up -d`
2. `POST /seed` — loads 8 default items
3. `python ml/data_generator.py` — 90 days of synthetic usage history
4. `python ml/train.py` — trains LinearRegression, registers in MLflow
5. Promotes new model version to Production stage
6. Polls Airflow `/health` until ready
7. `PATCH /api/v1/dags/{dag_id}` for each DAG to set `is_paused: false`

---

### `stop.sh`

```bash
./stop.sh
```

Runs `docker compose down`, stopping and removing all containers. Data volumes are preserved (Postgres, MLruns).

---

### `health.sh`

```bash
./health.sh
```

Checks the status of all containers via `docker compose ps`, then pings each HTTP endpoint with up to **5 retries** (3 seconds between each) to account for slow startup (especially Airflow):

| Service | Endpoint checked |
|---|---|
| FastAPI Backend | `http://localhost:8000/` |
| React Frontend | `http://localhost:5173/` |
| Airflow Webserver | `http://localhost:8080/health` |
| MLflow | `http://localhost:5001/` |
| Evidently | `http://localhost:8001/` |

---

### `view_logs.sh`

```bash
./view_logs.sh [component]
```

Tails live logs for a named service:

| Argument | Service |
|---|---|
| `all` | All services |
| `backend` | FastAPI backend |
| `frontend` | React/Vite dev server |
| `airflow-web` | Airflow webserver |
| `airflow-sched` | Airflow scheduler |
| `mlflow` | MLflow tracking server |
| `evidently` | Evidently drift service |
| `postgres` | PostgreSQL database |

---

## Developer Mode (UI)

The **Developer Mode** panel in the React frontend (bottom right of the dashboard) simulates real-world inventory depletion.

### Advance Time
Slide the slider to select 1–60 days and click ** Advance Time**. This:
1. Subtracts `days × avg_daily_usage` from each item's quantity
2. Generates new synthetic usage rows with weekend seasonality and noise
3. Appends those rows to `data/usage_history.csv`
4. Triggers `drift_detection_dag` in Airflow

This is the fastest way to test whether the ML retraining pipeline fires correctly — advance 30–60 days several times, and the Evidently drift report will detect the distribution shift and kick off a retrain.

### Reset to Initial State
Clicking ** Reset to Initial State** calls `POST /devmode/reset`, which:
1. Restores all inventory quantities to `inventory_seed.json` values
2. Regenerates a clean 30-day usage history from those seed values
3. Refreshes the entire dashboard

This is useful to start a fresh simulation without needing to `./stop.sh` and `./start.sh init` again.

---

## Running Tests

The backend test suite uses `pytest` with FastAPI's `TestClient`:

```bash
docker compose exec backend pytest tests/ -v
```

| Test file | What it covers |
|---|---|
| `tests/test_happy_path.py` | Create item → get prediction (checks `days_until_stockout ≥ 0`, valid source) |
| `tests/test_edge_cases.py` | Zero-usage-rate returns 422; advance-days floors quantity at 0 |

Tests run against the live running backend container, so they exercise the full stack including the fallback logic path.
