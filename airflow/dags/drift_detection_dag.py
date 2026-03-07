from airflow import DAG
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.operators.trigger_dagrun import TriggerDagRunOperator
from airflow.operators.empty import EmptyOperator
from datetime import datetime, timedelta
import pandas as pd
import requests

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2023, 1, 1),
}

with DAG('drift_detection_dag', default_args=default_args, schedule_interval='@daily', catchup=False) as dag:
    
    def load_reference_data(**kwargs):
        data_path = "/opt/airflow/data/usage_history.csv"
        df = pd.read_csv(data_path)
        df['date'] = pd.to_datetime(df['date'])
        start_date = df['date'].min()
        ref_df = df[df['date'] < start_date + timedelta(days=30)]
        ref_df['date'] = ref_df['date'].dt.strftime('%Y-%m-%d')
        return ref_df.to_dict(orient="records")

    def load_current_window(**kwargs):
        data_path = "/opt/airflow/data/usage_history.csv"
        df = pd.read_csv(data_path)
        df['date'] = pd.to_datetime(df['date'])
        end_date = df['date'].max()
        curr_df = df[df['date'] > end_date - timedelta(days=7)]
        curr_df['date'] = curr_df['date'].dt.strftime('%Y-%m-%d')
        return curr_df.to_dict(orient="records")

    def run_evidently_report(**kwargs):
        ti = kwargs['ti']
        ref = ti.xcom_pull(task_ids='load_reference_data')
        curr = ti.xcom_pull(task_ids='load_current_window')
        
        res = requests.post("http://evidently:8001/drift-report", json={'reference': ref, 'current': curr})
        res.raise_for_status()
        return res.json()

    def evaluate_drift(**kwargs):
        ti = kwargs['ti']
        report = ti.xcom_pull(task_ids='run_evidently_report')
        
        # If drift detected, trigger retraining
        if report.get('dataset_drift') and report.get('drift_share', 0) > 0.3:
            return 'trigger_retraining'
        else:
            return 'skip_retraining'

    t1 = PythonOperator(task_id='load_reference_data', python_callable=load_reference_data)
    t2 = PythonOperator(task_id='load_current_window', python_callable=load_current_window)
    t3 = PythonOperator(task_id='run_evidently_report', python_callable=run_evidently_report)
    t4 = BranchPythonOperator(task_id='evaluate_drift', python_callable=evaluate_drift)
    t5 = TriggerDagRunOperator(
        task_id='trigger_retraining',
        trigger_dag_id='retraining_dag'
    )
    t6 = EmptyOperator(task_id='skip_retraining')
    
    [t1, t2] >> t3 >> t4
    t4 >> t5
    t4 >> t6
