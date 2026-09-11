import { useEffect, useState } from "react";
import { OptimizationForm } from "./components/OptimizationForm";
import { isAxiosError } from "axios";
import { getCheapestWindow, getPrices } from "./services/api";
import type { CheapestWindowResponse, PriceItem, WindowSearchParams } from "./types";
import "./App.css";

function App() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cheapestWindow, setCheapestWindow] = useState<CheapestWindowResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadPrices = async () => {
      try {
        const data = await getPrices();
        setPrices(data);
      } catch (error) {
        console.error("Failed to load initial price data:", error);
      }
    };
    loadPrices();
  }, []);

  const latestDataEndTime =
    prices.length > 0 ? prices[prices.length - 1].end_time : null;

  const maxAvailableHours = Math.floor(prices.length / 4);

  const handleSearch = async (params: WindowSearchParams) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await getCheapestWindow(params);
      setCheapestWindow(result);
    } catch (error: unknown) {
      console.error("Optimization query failed:", error);
      if (isAxiosError(error)) {
        const detail = (error.response?.data as { detail?: unknown })?.detail;
        setErrorMessage(
          typeof detail === "string" ? detail : "Failed to calculate the cheapest window."
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setCheapestWindow(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="app-container">
      <h1 className="app-title">Spot Price Optimizer</h1>

      <OptimizationForm
        maxAvailableHours={maxAvailableHours}
        latestDataEndTime={latestDataEndTime}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {errorMessage && (
        <div className="error-banner">
          {errorMessage}
        </div>
      )}

      {cheapestWindow && (
        <section className="result-card">
          <h2 className="result-header">Optimal Window Found</h2>
          
          <div className="result-highlight">
            <span className="result-label">Average Price</span>
            <span className="result-price">
              {cheapestWindow.average_price.toFixed(3)} c/kWh
            </span>
          </div>

          <div className="result-grid">
            <div className="result-grid-item">
              <span className="result-label">Start</span>
              <p>{formatTimestamp(cheapestWindow.start_time)}</p>
            </div>
            <div className="result-grid-item">
              <span className="result-label">End</span>
              <p>{formatTimestamp(cheapestWindow.end_time)}</p>
            </div>
            <div className="result-grid-item">
              <span className="result-label">Duration</span>
              <p>{cheapestWindow.duration_hours} h</p>
            </div>
            <div className="result-grid-item">
              <span className="result-label">Intervals</span>
              <p>{cheapestWindow.intervals_count} intervals</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;