import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from main import app
from database import save_data

client = TestClient(app)

def test_add_item_and_get_prediction():
    # POST a new item with known quantity + avg_daily_usage
    res = client.post("/items", json={
        "name": "Test Soy Milk",
        "category": "Perishable",
        "quantity": 100,
        "unit": "cartons",
        "avg_daily_usage": 10.0,
        "shelf_life_days": 10,
        "reorder_threshold": 5
    })
    assert res.status_code == 200
    item = res.json()
    item_id = item["id"]
    
    # GET /items/{id}/prediction
    pred_res = client.get(f"/items/{item_id}/prediction")
    assert pred_res.status_code == 200
    pred = pred_res.json()
    
    # Assert
    assert pred["days_until_stockout"] >= 0
    assert pred["prediction_source"] in ["rule_based_fallback", "ml_model"]
