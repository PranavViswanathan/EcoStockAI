import os
import requests
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel
from database import load_data, save_data

router = APIRouter(prefix="/devmode", tags=["devmode"])

class DevmodeRequest(BaseModel):
    days: int

@router.post("/advance-days")
def advance_days(req: DevmodeRequest):
    data = load_data()
    
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "usage_history.csv")
    df = pd.read_csv(data_path)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by='date')
    last_date = df['date'].iloc[-1]
    
    new_records = []
    
    for item in data:
        consumed = item["avg_daily_usage"] * req.days
        original_quantity = item["quantity"]
        item["quantity"] = max(0.0, item["quantity"] - consumed)
        
        curr_qty = original_quantity
        for day_idx in range(1, req.days + 1):
            current_date = last_date + timedelta(days=day_idx)
            is_weekend = current_date.weekday() >= 5
            usage = item["avg_daily_usage"] * (1.5 if is_weekend else 0.8)
            usage += np.random.normal(0, 0.5)
            usage = max(0, round(usage, 2))
            
            curr_qty -= usage
            curr_qty = max(0, curr_qty)
            
            new_records.append({
                "item_id": item["id"],
                "date": current_date.strftime("%Y-%m-%d"),
                "quantity_used": usage,
                "quantity_remaining": round(curr_qty, 2)
            })

    save_data(data)
    
    if new_records:
        new_df = pd.DataFrame(new_records)
        df = pd.concat([df, new_df], ignore_index=True)
        # convert dates back to strings properly
        df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
        df.to_csv(data_path, index=False)
    
    try:
        url = "http://airflow-webserver:8080/api/v1/dags/drift_detection_dag/dagRuns"
        payload = {"conf": {}}
        res = requests.post(url, json=payload, auth=("admin", "admin"))
        res.raise_for_status()
    except Exception as e:
        print(f"Failed to trigger Airflow DAG: {e}")
        
    return {"status": "advanced", "days": req.days, "inventory": data}


@router.post("/reset")
def reset_to_seed():
    """Reset inventory AND usage history back to initial seed state."""
    import json
    seed_file = os.path.join(os.path.dirname(__file__), "..", "data", "inventory_seed.json")
    with open(seed_file, "r") as f:
        seed_data = json.load(f)
    
    # Restore inventory to seed quantities
    save_data(seed_data)
    
    # Reset usage history CSV with a fresh generator run using seed quantities
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "usage_history.csv")
    records = []
    base_date = datetime.utcnow()
    for item in seed_data:
        for day_offset in range(30, 0, -1):
            current_date = base_date - timedelta(days=day_offset)
            is_weekend = current_date.weekday() >= 5
            usage = item["avg_daily_usage"] * (1.5 if is_weekend else 0.8)
            usage += np.random.normal(0, 0.3)
            usage = max(0, round(usage, 2))
            records.append({
                "item_id": item["id"],
                "date": current_date.strftime("%Y-%m-%d"),
                "quantity_used": usage,
                "quantity_remaining": round(item["quantity"], 2)
            })
    
    df = pd.DataFrame(records)
    df.to_csv(data_path, index=False)
    
    return {"status": "reset", "inventory": seed_data}
