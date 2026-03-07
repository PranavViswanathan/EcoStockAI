import mlflow
import pandas as pd
from datetime import datetime
import os

mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://mlflow:5000"))

def get_ml_prediction(item):
    try:
        model_uri = "models:/inventory-forecaster/Production"
        model = mlflow.sklearn.load_model(model_uri)
        
        dow = datetime.utcnow().weekday()
        
        features = {
            'current_quantity': [float(item['quantity'])],
            'avg_daily_usage': [float(item['avg_daily_usage'])],
            'shelf_life_days': [float(item.get('shelf_life_days', 14))]
        }
        for i in range(7):
            features[f'dow_{i}'] = [1.0 if i == dow else 0.0]
            
        cols = ['current_quantity', 'avg_daily_usage', 'shelf_life_days'] + [f'dow_{i}' for i in range(7)]
        df = pd.DataFrame(features)[cols]
        
        pred = model.predict(df)[0]
        
        return {
            "days_until_stockout": max(0.0, round(float(pred), 1)),
            "reorder_recommended": float(pred) <= float(item.get("reorder_threshold", 10)),
            "prediction_source": "ml_model",
            "confidence": "high"
        }
    except Exception as e:
        print(f"ML prediction failed: {e}")
        return None
