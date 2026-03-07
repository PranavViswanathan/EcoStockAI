from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
import uuid

from database import load_data, save_data
from models import Item, ItemCreate, ItemUpdate

router = APIRouter(prefix="/items", tags=["inventory"])

@router.get("", response_model=List[Item])
def get_items(search: Optional[str] = None, category: Optional[str] = None):
    data = load_data()
    result = []
    for item in data:
        if search and search.lower() not in item["name"].lower():
            continue
        if category and category.lower() != item["category"].lower():
            continue
        result.append(item)
    return result

@router.post("", response_model=Item)
def create_item(item_in: ItemCreate):
    data = load_data()
    new_item = item_in.dict()
    new_item["id"] = f"item_{uuid.uuid4().hex[:8]}"
    new_item["last_updated"] = datetime.utcnow().strftime("%Y-%m-%d")
    data.append(new_item)
    save_data(data)
    return new_item

@router.patch("/{item_id}", response_model=Item)
def update_item(item_id: str, item_in: ItemUpdate):
    data = load_data()
    for item in data:
        if item["id"] == item_id:
            update_data = item_in.dict(exclude_unset=True)
            for k, v in update_data.items():
                item[k] = v
            item["last_updated"] = datetime.utcnow().strftime("%Y-%m-%d")
            save_data(data)
            return item
    raise HTTPException(status_code=404, detail="Item not found")

@router.delete("/{item_id}")
def delete_item(item_id: str):
    data = load_data()
    for i, item in enumerate(data):
        if item["id"] == item_id:
            del data[i]
            save_data(data)
            return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Item not found")
