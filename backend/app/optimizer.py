from datetime import datetime
from typing import Any, Dict, List, Optional
import pandas as pd

from .models import SpotPrice


def find_cheapest_window(
    prices: List[SpotPrice],
    hours: float,
    start_after: Optional[datetime] = None,
    end_before: Optional[datetime] = None,
) -> Optional[Dict[str, Any]]:

    if not prices:
        return None

    data = [
        {
            "start_time": p.start_time,
            "end_time": p.end_time,
            "price": p.price,
        }
        for p in prices
    ]
    df = pd.DataFrame(data)

    df = df.sort_values(by="start_time")

    if start_after:
        df = df[df["start_time"] >= start_after]
    if end_before:
        df = df[df["end_time"] <= end_before]

    df = df.reset_index(drop=True)

    intervals = int(hours * 4)

    if len(df) < intervals or intervals <= 0:
        return None

    df["rolling_avg"] = df["price"].rolling(window=intervals).mean()

    min_idx = df["rolling_avg"].idxmin()
    if pd.isna(min_idx):
        return None

    start_idx = int(min_idx - intervals + 1)
    best_slice = df.iloc[start_idx : int(min_idx) + 1]

    best_start = best_slice["start_time"].iloc[0]
    best_end = best_slice["end_time"].iloc[-1]
    avg_price = float(best_slice["price"].mean())

    return {
        "start_time": best_start,
        "end_time": best_end,
        "duration_hours": hours,
        "average_price": round(avg_price, 4),
        "intervals_count": intervals,
        "prices": best_slice.to_dict(orient="records"),
    }