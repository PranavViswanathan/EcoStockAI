from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import inventory, predictions, devmode, drift, analytics

app = FastAPI(title="Green-Tech Inventory Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inventory.router)
app.include_router(predictions.router)
app.include_router(devmode.router)
app.include_router(drift.router)
app.include_router(analytics.router)

@app.post("/seed")
def seed_database():
    import json
    import os
    from database import save_data
    seed_file = os.path.join(os.path.dirname(__file__), "data", "inventory_seed.json")
    if os.path.exists(seed_file):
        with open(seed_file, "r") as f:
            data = json.load(f)
            save_data(data)
            return {"status": "seeded", "count": len(data)}
    return {"status": "seed file not found"}

@app.get("/")
def read_root():
    return {"status": "backend ok"}
