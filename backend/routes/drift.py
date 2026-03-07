from fastapi import APIRouter

router = APIRouter(prefix="/drift", tags=["drift"])

@router.get("/status")
def drift_status():
    return {
        "dataset_drift": False,
        "drift_share": 0.0,
        "drifted_features": [],
        "report_html_path": None
    }
