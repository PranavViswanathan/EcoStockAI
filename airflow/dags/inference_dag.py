from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import requests
import json
import mlflow

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2023, 1, 1),
    'retries': 1,
    'retry_delay': timedelta(minutes=1),
}

with DAG('inference_dag', default_args=default_args, schedule_interval='@hourly', catchup=False) as dag:
    
    def load_inventory(**kwargs):
        with open("/opt/airflow/data/inventory.json", "r") as f:
            return json.load(f)

    def run_predictions(**kwargs):
        ti = kwargs['ti']
        inventory = ti.xcom_pull(task_ids='load_inventory')
        if not inventory:
            return []
        predictions = []
        for item in inventory:
            try:
                res = requests.get(f"http://backend:8000/items/{item['id']}/prediction")
                if res.status_code == 200:
                    predictions.append(res.json())
            except Exception as e:
                print(f"Failed to get prediction for {item['id']}: {e}")
        return predictions

    def flag_low_stock(**kwargs):
        ti = kwargs['ti']
        predictions = ti.xcom_pull(task_ids='run_predictions')
        alerts = [p for p in predictions if p.get('reorder_recommended')]
        
        with open("/opt/airflow/data/alerts.json", "w") as f:
            json.dump(alerts, f, indent=2)
        return len(alerts)

    def log_inference_run(**kwargs):
        ti = kwargs['ti']
        predictions = ti.xcom_pull(task_ids='run_predictions')
        
        mlflow.set_tracking_uri("http://mlflow:5000")
        mlflow.set_experiment("inference_logs")
        with mlflow.start_run(run_name=f"inference_batch"):
            mlflow.log_metric("items_processed", len(predictions))
            reorders = sum(1 for p in predictions if p.get('reorder_recommended'))
            mlflow.log_metric("reorder_alerts", reorders)

    t1 = PythonOperator(task_id='load_inventory', python_callable=load_inventory)
    t2 = PythonOperator(task_id='run_predictions', python_callable=run_predictions)
    t3 = PythonOperator(task_id='flag_low_stock', python_callable=flag_low_stock)
    t4 = PythonOperator(task_id='log_inference_run', python_callable=log_inference_run)

    t1 >> t2 >> [t3, t4]
