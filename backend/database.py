import json
import os
from threading import Lock

DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "inventory.json")
lock = Lock()

def load_data():
    with lock:
        if not os.path.exists(DATA_FILE):
            return []
        with open(DATA_FILE, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []

def save_data(data):
    with lock:
        with open(DATA_FILE, "w") as f:
            json.dump(data, f, indent=2)
