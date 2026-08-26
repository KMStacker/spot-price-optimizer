from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class PriceItemBase(BaseModel):
    start_time: datetime
    end_time: datetime
    price: float


class PriceItemResponse(PriceItemBase):
    id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class CheapestWindowResponse(BaseModel):
    start_time: datetime
    end_time: datetime
    duration_hours: float
    average_price: float
    intervals_count: int
    prices: List[PriceItemBase]


class FetchPricesResponse(BaseModel):
    status: str
    records_processed: int