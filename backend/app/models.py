from sqlalchemy import Column, DateTime, Float, Integer
from .database import Base


class SpotPrice(Base):
    __tablename__ = "spot_prices"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime(timezone=True), unique=True, nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False)
    price = Column(Float, nullable=False)