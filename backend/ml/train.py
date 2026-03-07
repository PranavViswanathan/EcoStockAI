import os
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import mlflow
import mlflow.sklearn
from mlflow.tracking import MlflowClient
import warnings
warnings.filterwarnings('ignore')

mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://mlflow:5000"))

def ingest_data():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "usage_history.csv")
    df = pd.read_csv(data_path)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by='date')
    return df

def feature_engineer(df):
    df['shelf_life_days'] = 14
    df['current_quantity'] = df['quantity_remaining']
    df['avg_daily_usage'] = df['quantity_used'].rolling(window=7, min_periods=1).mean()
    
    df['day_of_week'] = df['date'].dt.dayofweek
    df = pd.get_dummies(df, columns=['day_of_week'], prefix='dow')
    
    for i in range(7):
        col = f'dow_{i}'
        if col not in df.columns:
            df[col] = False
            
    if (df['quantity_remaining'] <= 0).any():
        stockout_date = df[df['quantity_remaining'] <= 0]['date'].min()
    else:
        last_date = df['date'].iloc[-1]
        last_qty = df['quantity_remaining'].iloc[-1]
        last_avg = df['avg_daily_usage'].iloc[-1]
        days_left = last_qty / last_avg if last_avg > 0 else 90
        stockout_date = last_date + pd.Timedelta(days=int(days_left))
        
    df['days_until_stockout'] = (stockout_date - df['date']).dt.days
    df = df[df['days_until_stockout'] > 0]
    
    features = ['current_quantity', 'avg_daily_usage', 'shelf_life_days'] + [f'dow_{i}' for i in range(7)]
    df = df.dropna(subset=features + ['days_until_stockout'])
    return df, features

def train():
    df = ingest_data()
    df, features = feature_engineer(df)
    
    X = df[features]
    y = df['days_until_stockout']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    mlflow.set_experiment("inventory_forecasting")
    
    with mlflow.start_run(run_name="initial_training") as run:
        model = LinearRegression()
        model.fit(X_train, y_train)
        
        preds = model.predict(X_test)
        rmse = mean_squared_error(y_test, preds) ** 0.5
        mae = mean_absolute_error(y_test, preds)
        r2 = r2_score(y_test, preds)
        
        mlflow.log_params({"model": "LinearRegression", "features": features})
        mlflow.log_metrics({"rmse": rmse, "mae": mae, "r2": r2})
        
        model_info = mlflow.sklearn.log_model(
            model, 
            "model", 
            registered_model_name="inventory-forecaster"
        )
        print(f"Logged model run: {run.info.run_id}")
        
        # We return the metrics and the version so Airflow DAG can decide to promote
        client = MlflowClient()
        latest_versions = client.get_latest_versions("inventory-forecaster", stages=["None"])
        new_version = latest_versions[-1].version if latest_versions else None
        
        return {
            "run_id": run.info.run_id,
            "rmse": float(rmse),
            "version": new_version
        }

if __name__ == "__main__":
    train()
