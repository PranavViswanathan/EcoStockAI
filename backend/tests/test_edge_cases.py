import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from main import app
from database import load_data, save_data

client = TestClient(app)

def test_zero_daily_usage_returns_422():
    res = client.post("/items", json={
        "name": "Test Equipment",
        "category": "Equipment",
        "quantity": 5,
        "unit": "pcs",
        "avg_daily_usage": 0,
        "shelf_life_days": 365,
        "reorder_threshold": 1
    })
    assert res.status_code == 422
    assert "avg_daily_usage" in res.text or "Input should be greater than 0" in res.text

def test_advance_days_floors_at_zero():
    # Add item
    res = client.post("/items", json={
        "name": "Test Advanced",
        "category": "Perishable",
        "quantity": 5,
        "unit": "pcs",
        "avg_daily_usage": 10.0,
        "shelf_life_days": 5,
        "reorder_threshold": 2
    })
    assert res.status_code == 200
    
    # Advance days by 3, expected usage > 5. Should floor at zero.
    res2 = client.post("/devmode/advance-days", json={"days": 3})
    assert res2.status_code == 200
    
    inventory = load_data()
    item = next(i for i in inventory if i["name"] == "Test Advanced")
    assert item["quantity"] == 0.0
