import os
import pandas as pd
from fastapi import APIRouter

router = APIRouter(prefix="/analytics", tags=["analytics"])

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "usage_history.csv")

@router.get("/usage-history")
def get_usage_history():
    """Return last 30 days of usage for all items for the trend chart."""
    try:
        df = pd.read_csv(DATA_PATH)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        last_30 = df[df['date'] >= df['date'].max() - pd.Timedelta(days=30)]
        # Aggregate by date
        agg = last_30.groupby('date')['quantity_used'].sum().reset_index()
        agg['date'] = agg['date'].dt.strftime('%b %d')
        return agg.to_dict(orient='records')
    except Exception as e:
        return []

@router.get("/stock-levels")
def get_stock_levels():
    """Return current stock levels for each item for bar chart."""
    from database import load_data
    items = load_data()
    return [{"name": i["name"], "quantity": i["quantity"], "reorder_threshold": i["reorder_threshold"]} for i in items]

@router.get("/category-breakdown")
def get_category_breakdown():
    """Return items grouped by category for donut chart."""
    from database import load_data
    items = load_data()
    cats = {}
    for i in items:
        cats[i["category"]] = cats.get(i["category"], 0) + 1
    return [{"name": k, "value": v} for k, v in cats.items()]
