#  API Reference

[← Back to README](../README.md)

> Interactive docs available at **http://localhost:8000/docs** (Swagger UI)

---

## Inventory

### `GET /items`
List all inventory items. Supports optional filtering.

**Query params:**
- `search` (string) — filter by name substring
- `category` (string) — filter by category

**Response:**
```json
[
  {
    "id": "item_001",
    "name": "Oat Milk (1L)",
    "category": "Perishable",
    "quantity": 120.0,
    "unit": "cartons",
    "avg_daily_usage": 3.2,
    "shelf_life_days": 14,
    "reorder_threshold": 20.0,
    "last_updated": "2026-03-07"
  }
]
```

---

### `POST /items`
Create a new inventory item.

**Request body:**
```json
{
  "name": "Coffee Beans",
  "category": "Non-Perishable",
  "quantity": 80.0,
  "unit": "kg",
  "avg_daily_usage": 1.8,
  "shelf_life_days": 180,
  "reorder_threshold": 10.0
}
```

**Validation:** `avg_daily_usage` must be > 0. `quantity` must be ≥ 0.

---

### `PUT /items/{id}`
Update an existing item's fields (partial update supported).

### `DELETE /items/{id}`
Delete an item by ID.

### `POST /seed`
Reset the inventory database to the values in `data/inventory_seed.json`.

---

## Predictions

### `GET /items/{id}/prediction`
Get AI-powered stockout prediction for a single item.

**Response:**
```json
{
  "item_id": "item_002",
  "days_until_stockout": 7.6,
  "prediction_source": "ml_model",
  "insight_message": "Your coffee beans supply will run out in 7 days. Want to see local, fair-trade suppliers?"
}
```

| `prediction_source` | Meaning |
|---|---|
| `ml_model` | Scikit-Learn LinearRegression from MLflow Production registry |
| `rule_based_fallback` | Simple `quantity / avg_daily_usage` math |

---

## Analytics

### `GET /analytics/stock-levels`
Returns current quantity and reorder threshold for all items (used by bar chart).

### `GET /analytics/usage-history`
Returns aggregated daily usage totals for the last 30 days (used by trend chart).

### `GET /analytics/category-breakdown`
Returns item counts grouped by category (used by pie chart).

---

## Developer Mode

### `POST /devmode/advance-days`
Simulate time passing. Subtracts usage from quantities and appends rows to `usage_history.csv`.

**Request body:**
```json
{ "days": 17 }
```

**What it does:**
1. Subtracts `days × avg_daily_usage` from each item's quantity (floored at 0)
2. Generates synthetic daily usage rows with weekend uplift and Gaussian noise
3. Appends rows to `data/usage_history.csv`
4. Triggers `drift_detection_dag` via Airflow REST API

---

### `POST /devmode/reset`
Reset inventory quantities to seed values and regenerate a clean 30-day usage history.

**Response:**
```json
{ "status": "reset", "inventory": [...] }
```

---

## Drift

### `GET /drift/status`
Returns the most recent Evidently drift report result.

```json
{
  "dataset_drift": false,
  "drift_share": 0.1,
  "drifted_features": []
}
```

---

## System

### `GET /`
Health check. Returns `{ "status": "backend ok" }`.
