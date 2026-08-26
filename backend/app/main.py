from datetime import datetime
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import ElectricityPrice
from .optimizer import find_cheapest_window
from .schemas import CheapestWindowResponse, FetchPricesResponse, PriceItemResponse
from .services import fetch_and_store_prices

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Spot Price Optimizer API",
    description="API for fetching, storing, and analyzing electricity spot prices.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post(
    "/api/prices/fetch",
    response_model=FetchPricesResponse,
    status_code=status.HTTP_200_OK,
)
def trigger_fetch_prices(db: Session = Depends(get_db)):
    try:
        count = fetch_and_store_prices(db)
        return FetchPricesResponse(status="success", records_processed=count)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch prices from external API: {str(e)}",
        )

@app.get(
    "/api/prices",
    response_model=List[PriceItemResponse],
    status_code=status.HTTP_200_OK,
)
def get_prices(
    start_after: Optional[datetime] = Query(None),
    end_before: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(ElectricityPrice)
    if start_after:
        query = query.filter(ElectricityPrice.start_time >= start_after)
    if end_before:
        query = query.filter(ElectricityPrice.end_time <= end_before)

    return query.order_by(ElectricityPrice.start_time.asc()).all()

@app.get(
    "/api/prices/cheapest-window",
    response_model=CheapestWindowResponse,
    status_code=status.HTTP_200_OK,
)
def get_cheapest_window(
    hours: float = Query(
        ...,
        gt=0,
        le=24,
        description="Duration of the window in hours (e.g. 1.0, 2.5, 4.0)",
    ),
    start_after: Optional[datetime] = Query(
        None, description="Start limit in ISO format"
    ),
    end_before: Optional[datetime] = Query(
        None, description="End limit in ISO format"
    ),
    db: Session = Depends(get_db),
):
    prices = db.query(ElectricityPrice).order_by(ElectricityPrice.start_time.asc()).all()
    if not prices:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No price data available in database. Fetch data first.",
        )

    result = find_cheapest_window(
        prices=prices,
        hours=hours,
        start_after=start_after,
        end_before=end_before,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough price data available for the requested time range and duration.",
        )

    return result