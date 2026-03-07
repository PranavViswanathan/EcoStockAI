from pydantic import BaseModel, Field
from typing import Optional

class ItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str
    quantity: float = Field(..., ge=0)
    unit: str
    avg_daily_usage: float = Field(..., gt=0)
    shelf_life_days: int
    reorder_threshold: float

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = None
    quantity: Optional[float] = Field(None, ge=0)
    unit: Optional[str] = None
    avg_daily_usage: Optional[float] = Field(None, gt=0)
    shelf_life_days: Optional[int] = None
    reorder_threshold: Optional[float] = None

class Item(ItemBase):
    id: str
    last_updated: str
