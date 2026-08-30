import { useEffect, useState } from "react";
import { OptimizationForm } from "./components/OptimizationForm";
import { isAxiosError } from "axios";
import { getCheapestWindow, getPrices } from "./services/api";
import type { CheapestWindowResponse, PriceItem, WindowSearchParams } from "./types";

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
    <main
      style={{
        padding: "2rem",
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Spot Price Optimizer</h1>

      <OptimizationForm
        maxAvailableHours={maxAvailableHours}
        latestDataEndTime={latestDataEndTime}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {errorMessage && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#fde8e8",
            border: "1px solid #f8b4b4",
            borderRadius: "4px",
            color: "#9b1c1c",
          }}
        >
          {errorMessage}
        </div>
      )}

      {cheapestWindow && (
        <section
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            backgroundColor: "#f9fafb",
            textAlign: "left",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginTop: 0, marginBottom: "0.75rem" }}>
            Optimal Window Found
          </h2>
          <p style={{ margin: "0.25rem 0" }}>
            <strong>Start:</strong> {formatTimestamp(cheapestWindow.start_time)}
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            <strong>End:</strong> {formatTimestamp(cheapestWindow.end_time)}
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            <strong>Duration:</strong> {cheapestWindow.duration_hours} h ({cheapestWindow.intervals_count} intervals)
          </p>
          <p style={{ margin: "0.25rem 0", fontSize: "1.1rem" }}>
            <strong>Average Price:</strong> {cheapestWindow.average_price.toFixed(3)} c/kWh
          </p>
        </section>
      )}
    </main>
  );
}

export default App;