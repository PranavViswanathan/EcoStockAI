# Testing

[← Back to README](../README.md)

The test suite is written with **pytest** and uses FastAPI's built-in `TestClient` (backed by `httpx`) to exercise the HTTP layer without spinning up a live server.

---

## Running the Tests

```bash
# Run full suite inside Docker (recommended)
docker compose exec backend pytest tests/ -v

# Run a specific file
docker compose exec backend pytest tests/test_happy_path.py -v
docker compose exec backend pytest tests/test_edge_cases.py -v
```

> [!NOTE]
> Tests run against the in-process `TestClient` — no external services (MLflow, Airflow, Postgres) are required. The ML prediction endpoint gracefully falls back to rule-based logic when no Production model is registered.

---

## Test Structure

```
backend/tests/
├── test_happy_path.py   # Core happy-path flows (item creation → prediction)
└── test_edge_cases.py   # Boundary & validation scenarios
```

---

## Test Coverage

### `test_happy_path.py`

| Test | Endpoint(s) | What it asserts |
|---|---|---|
| `test_add_item_and_get_prediction` | `POST /items` → `GET /items/{id}/prediction` | Item is created (200); prediction returns `days_until_stockout ≥ 0` and a valid `prediction_source` (`ml_model` or `rule_based_fallback`) |

This is the primary smoke test for the core ML prediction loop. It confirms:
- The inventory write path works end-to-end.
- The prediction endpoint resolves the correct item and returns a well-formed response regardless of whether the ML model is loaded.
- The `prediction_source` field is always present (Responsible AI transparency contract).

---

### `test_edge_cases.py`

| Test | Endpoint(s) | What it asserts |
|---|---|---|
| `test_zero_daily_usage_returns_422` | `POST /items` | `avg_daily_usage = 0` is rejected with HTTP 422 (Pydantic validation) |
| `test_advance_days_floors_at_zero` | `POST /items` → `POST /devmode/advance-days` | After advancing time beyond an item's supply, `quantity` floors at `0.0` and never goes negative |

**Why these matter:**
- **Zero-usage guard** — Division by zero in the fallback formula (`quantity / avg_daily_usage`) would produce `inf`. The 422 rejection ensures bad data never reaches prediction logic.
- **Quantity floor** — The `/devmode/advance-days` endpoint simulates real usage. Clamping at zero prevents physically impossible negative stock values from propagating into training features.

---

## Prediction Source Contract

Every response from `GET /items/{id}/prediction` must include:

```json
{
  "days_until_stockout": 7.4,
  "prediction_source": "ml_model",
  "item_id": "...",
  "insight_message": "Your solar panel supply will run out in 7 days. Want to see local, fair-trade suppliers?"
}
```

| Field | Possible Values |
|---|---|
| `prediction_source` | `ml_model` — sklearn `LinearRegression` from MLflow Production registry |
| | `rule_based_fallback` — `quantity / avg_daily_usage` when no model is loaded |

The `test_happy_path` test validates both values are accepted, making the fallback an explicit, tested code path — not silent dead code.

---

## Adding New Tests

1. Create a new file under `backend/tests/` prefixed with `test_`.
2. Import the shared `TestClient`:
   ```python
   from fastapi.testclient import TestClient
   import sys, os
   sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
   from main import app
   client = TestClient(app)
   ```
3. Run `docker compose exec backend pytest tests/ -v` to confirm all tests pass.
