from datetime import datetime
import httpx
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from .models import SpotPrice

API_URL = "https://api.porssisahko.net/v2/latest-prices.json"


def fetch_and_store_prices(db: Session) -> int:
    with httpx.Client(timeout=10.0) as client:
        response = client.get(API_URL)
        response.raise_for_status()
        data = response.json()

    prices_data = data.get("prices", [])
    if not prices_data:
        return 0

    records = []
    for item in prices_data:
        records.append(
            {
                "start_time": datetime.fromisoformat(item["startDate"]),
                "end_time": datetime.fromisoformat(item["endDate"]),
                "price": float(item["price"]),
            }
        )

    stmt = insert(SpotPrice).values(records)
    statement = stmt.on_conflict_do_nothing(index_elements=["start_time"])

    db.execute(statement)
    db.commit()

    return len(records)