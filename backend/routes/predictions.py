from fastapi import APIRouter, HTTPException
from database import load_data

from ml.predict import get_ml_prediction
from ml.fallback import get_fallback_prediction

router = APIRouter(prefix="/items", tags=["predictions"])

@router.get("/{item_id}/prediction")
def get_prediction(item_id: str):
    data = load_data()
    item = next((i for i in data if i["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    pred = get_ml_prediction(item)
    if not pred:
        pred = get_fallback_prediction(item)
        
    if not pred:
        raise HTTPException(status_code=422, detail="avg_daily_usage must be > 0 for prediction")

    pred["item_id"] = item_id
    
    days = pred.get("days_until_stockout", 0)
    # Generate the AI predictive reorder insight message
    pred["insight_message"] = f"Your {item.get('name', 'item').lower()} supply will run out in {int(days)} days. Want to see local, fair-trade suppliers?"
    
    return pred
