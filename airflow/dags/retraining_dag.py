from airflow import DAG
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.operators.empty import EmptyOperator
from datetime import datetime
import sys
import json
import mlflow
from mlflow.tracking import MlflowClient

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2023, 1, 1),
}

with DAG('retraining_dag', default_args=default_args, schedule_interval=None, catchup=False) as dag:
    
    def retrain_model(**kwargs):
        sys.path.append("/opt/airflow/backend")
        from ml.train import train
        run_info = train()
        return run_info

    def compare_models(**kwargs):
        ti = kwargs['ti']
        new_model_info = ti.xcom_pull(task_ids='retrain_model')
        
        mlflow.set_tracking_uri("http://mlflow:5000")
        client = MlflowClient()
        name = "inventory-forecaster"
        
        try:
            prod_versions = client.get_latest_versions(name, stages=["Production"])
            if not prod_versions:
                return 'promote_if_better'  # No prod model yet
                
            prod_version = prod_versions[0]
            prod_run = client.get_run(prod_version.run_id)
            prod_rmse = prod_run.data.metrics.get("rmse", float('inf'))
            
            if new_model_info['rmse'] < prod_rmse:
                return 'promote_if_better'
            else:
                return 'notify_completion'
        except Exception as e:
            print(f"Error comparing models: {e}")
            return 'promote_if_better' # Default to promote if comparison fails setup

    def promote_if_better(**kwargs):
        ti = kwargs['ti']
        new_model_info = ti.xcom_pull(task_ids='retrain_model')
        
        mlflow.set_tracking_uri("http://mlflow:5000")
        client = MlflowClient()
        name = "inventory-forecaster"
        version = new_model_info['version']
        
        client.transition_model_version_stage(
            name=name,
            version=version,
            stage="Production",
            archive_existing_versions=True
        )
        return {"status": "promoted", "version": version}

    def notify_completion(**kwargs):
        ti = kwargs['ti']
        # Can be reached either direct from compare or after promote
        # Just write log
        with open("/opt/airflow/data/retraining_log.json", "w") as f:
            json.dump({"timestamp": datetime.utcnow().isoformat(), "status": "completed"}, f)

    t1 = PythonOperator(task_id='retrain_model', python_callable=retrain_model)
    t2 = BranchPythonOperator(task_id='compare_models', python_callable=compare_models)
    t3 = PythonOperator(task_id='promote_if_better', python_callable=promote_if_better)
    t4 = PythonOperator(task_id='notify_completion', python_callable=notify_completion, trigger_rule="none_failed_or_skipped")
    
    t1 >> t2
    t2 >> t3 >> t4
    t2 >> t4
