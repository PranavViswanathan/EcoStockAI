import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "usage_history.csv")

def generate_data():
    np.random.seed(42)
    start_date = datetime.utcnow() - timedelta(days=90)
    
    records = []
    # For item_001
    item_id = "item_001"
    quantity_remaining = 300.0 # start with a large amount
    
    for day_idx in range(90):
        current_date = start_date + timedelta(days=day_idx)
        # Weekends have higher usage (Sat=5, Sun=6)
        is_weekend = current_date.weekday() >= 5
        
        base_usage = 3.2
        usage = base_usage * (1.5 if is_weekend else 0.8)
        # Add some noise
        usage += np.random.normal(0, 0.5)
        usage = max(0, round(usage, 2))
        
        quantity_remaining -= usage
        quantity_remaining = max(0, quantity_remaining)
        
        records.append({
            "item_id": item_id,
            "date": current_date.strftime("%Y-%m-%d"),
            "quantity_used": usage,
            "quantity_remaining": round(quantity_remaining, 2)
        })
        
    df = pd.DataFrame(records)
    # Make sure output dir exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Generated {len(df)} records in {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_data()
