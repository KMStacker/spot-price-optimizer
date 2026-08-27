import { useEffect, useState } from "react";
import { OptimizationForm } from "./components/OptimizationForm";
import { getPrices } from "./services/api";
import type { PriceItem, WindowSearchParams } from "./types";

function App() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSearch, setLastSearch] = useState<WindowSearchParams | null>(null);

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

  const handleSearch = (params: WindowSearchParams) => {
    setIsLoading(true);
    console.log("Search parameters received:", params);
    setLastSearch(params);
    setIsLoading(false);
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

      {lastSearch && (
        <section
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        >
          <h3>Submitted Parameters:</h3>
          <pre>{JSON.stringify(lastSearch, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}

export default App;