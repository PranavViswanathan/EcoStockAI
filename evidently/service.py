import os
import json
from datetime import datetime
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

from evidently.report import Report
from evidently.metric_preset import DataDriftPreset
import mlflow

app = FastAPI()

class DriftRequest(BaseModel):
    reference: List[Dict[str, Any]]
    current: List[Dict[str, Any]]

@app.post("/drift-report")
def run_drift_report(req: DriftRequest):
    try:
        ref_df = pd.DataFrame(req.reference)
        curr_df = pd.DataFrame(req.current)
        
        # Evidently report
        report = Report(metrics=[DataDriftPreset()])
        report.run(reference_data=ref_df, current_data=curr_df)
        
        # Get metrics
        report_dict = report.as_dict()
        drift_metrics = report_dict["metrics"][0]["result"]
        dataset_drift = drift_metrics["dataset_drift"]
        drift_share = drift_metrics["share_of_drifted_columns"]
        drifted_features = [k for k, v in drift_metrics["drift_by_columns"].items() if v["drift_detected"]]
        
        # Save HTML
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        report_filename = f"drift_report_{timestamp}.html"
        reports_dir = os.path.join(os.path.dirname(__file__), "data", "reports")
        os.makedirs(reports_dir, exist_ok=True)
        report_path = os.path.join(reports_dir, report_filename)
        report.save_html(report_path)
        
        # Log to MLflow
        mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://mlflow:5000"))
        mlflow.set_experiment("drift_reports")
        with mlflow.start_run(run_name=f"drift_{timestamp}"):
            mlflow.log_artifact(report_path)
            mlflow.log_metric("drift_share", drift_share)
            mlflow.log_param("dataset_drift", dataset_drift)
            
        return {
            "dataset_drift": dataset_drift,
            "drift_share": drift_share,
            "drifted_features": drifted_features,
            "report_html_path": report_path
        }
    except Exception as e:
        print(f"Drift report generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"status": "evidently ok"}
