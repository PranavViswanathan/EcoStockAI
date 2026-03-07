#  ML Pipeline

[← Back to README](../README.md)

## Model

**Algorithm:** Scikit-Learn `LinearRegression`  
**Target variable:** `days_until_stockout`  
**Registered name in MLflow:** `inventory-forecaster`

---

## Training Data

Usage history is stored in `data/usage_history.csv` with the schema:

| Column | Type | Description |
|---|---|---|
| `item_id` | string | Links to inventory item |
| `date` | YYYY-MM-DD | Date of record |
| `quantity_used` | float | Units consumed that day |
| `quantity_remaining` | float | Units left at end of day |

The **synthetic data generator** (`backend/ml/data_generator.py`) creates 90 days of history with realistic patterns:
- **Weekdays:** `avg_daily_usage × 0.8` (lower weekday demand)
- **Weekends:** `avg_daily_usage × 1.5` (weekend demand spike)
- **Gaussian noise** added for realism

---

## Feature Engineering

Features are constructed in `backend/ml/train.py`:

```python
features = [
    'current_quantity',      # raw remaining quantity
    'avg_daily_usage',       # 7-day rolling mean usage
    'shelf_life_days',       # physical shelf life constraint
    'day_of_week_mon',       # one-hot encoded
    'day_of_week_tue',
    'day_of_week_wed',
    'day_of_week_thu',
    'day_of_week_fri',
    'day_of_week_sat',
    # sunday is the dropped base category
]
```

The **rolling 7-day average daily usage** is computed per item_id from the usage history before training. This means the model learns from recent consumption trends, not just static metadata.

---

## Training Script

```bash
docker compose exec backend python ml/train.py
```

What it does:
1. Reads `data/usage_history.csv`
2. Computes rolling 7-day `avg_daily_usage` per item
3. One-hot encodes day of week
4. Derives `days_until_stockout = quantity_remaining / avg_daily_usage`
5. Splits 80/20 train/test
6. Trains `LinearRegression`
7. Logs RMSE, MAE, R² to MLflow experiment `inventory_forecasting`
8. Registers the model as `inventory-forecaster` (new version)
9. Returns `{ run_id, rmse, version }` for Airflow to evaluate

---

## Model Registry Stages

| Stage | Meaning |
|---|---|
| `None` | Just trained, awaiting evaluation |
| `Production` | Active model used for all predictions |
| `Archived` | Previous production model, kept for rollback |

The retraining DAG only promotes a Challenger to Production if its RMSE is strictly lower than the current Production model's RMSE.

---

## Inference

`backend/ml/predict.py` handles inference:

```python
def get_ml_prediction(item):
    client = MlflowClient()
    model_uri = "models:/inventory-forecaster/Production"
    model = mlflow.sklearn.load_model(model_uri)
    
    features = build_feature_vector(item)  # same as training
    days = model.predict([features])[0]
    return { "days_until_stockout": max(0, days), "prediction_source": "ml_model" }
```

---

## Fallback Logic

If `get_ml_prediction()` raises any exception (model not loaded, feature error, etc.), the system calls `get_fallback_prediction()`:

```python
def get_fallback_prediction(item):
    days = item["quantity"] / item["avg_daily_usage"]
    return { "days_until_stockout": round(days, 1), "prediction_source": "rule_based_fallback" }
```

The frontend shows a yellow **"Rule-based"** badge vs. a blue **"AI Model"** badge to surface this transparently.

---

## MLflow Tracking

All runs are viewable at **http://localhost:5001**:
- Experiment: `inventory_forecasting`
- Metrics logged: `rmse`, `mae`, `r2`
- Artifacts: serialized `sklearn` model
- Model Registry: `inventory-forecaster` with version history
