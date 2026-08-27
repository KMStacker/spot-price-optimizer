import React, { useState } from "react";
import type { WindowSearchParams } from "../types";

interface OptimizationFormProps {
  maxAvailableHours: number;
  latestDataEndTime: string | null;
  onSearch: (params: WindowSearchParams) => void;
  isLoading: boolean;
}

export const OptimizationForm: React.FC<OptimizationFormProps> = ({
  maxAvailableHours,
  latestDataEndTime,
  onSearch,
  isLoading,
}) => {
  const formatDateTimeLocal = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [hours, setHours] = useState<number>(1);
  const [startAfter, setStartAfter] = useState<string>(
    formatDateTimeLocal(new Date())
  );
  const [endBefore, setEndBefore] = useState<string>("");

  let maxStartTime: string | undefined = undefined;
  if (latestDataEndTime) {
    const maxEnd = new Date(latestDataEndTime);
    maxEnd.setHours(maxEnd.getHours() - hours);
    maxStartTime = formatDateTimeLocal(maxEnd);
  }

  const baseStartDate = startAfter ? new Date(startAfter) : new Date();
  const minEndDate = new Date(baseStartDate);
  minEndDate.setHours(minEndDate.getHours() + hours);
  const minEndTime = formatDateTimeLocal(minEndDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalEndBefore = endBefore;
    if (endBefore && new Date(endBefore) < minEndDate) {
      finalEndBefore = minEndTime;
    }

    onSearch({
      hours,
      start_after: startAfter ? new Date(startAfter).toISOString() : undefined,
      end_before: finalEndBefore ? new Date(finalEndBefore).toISOString() : undefined,
    });
  };

  const hourOptions = Array.from(
    { length: Math.max(1, maxAvailableHours || 24) },
    (_, i) => i + 1
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <label htmlFor="duration-select" style={{ display: "block", marginBottom: "0.25rem" }}>
          Duration (hours):
        </label>
        <select
          id="duration-select"
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          disabled={isLoading}
        >
          {hourOptions.map((h) => (
            <option key={h} value={h}>
              {h} {h === 1 ? "hour" : "hours"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="start-after" style={{ display: "block", marginBottom: "0.25rem" }}>
          Start search after:
        </label>
        <input
          type="datetime-local"
          id="start-after"
          value={startAfter}
          max={maxStartTime}
          onChange={(e) => setStartAfter(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="end-before" style={{ display: "block", marginBottom: "0.25rem" }}>
          End search before:
        </label>
        <input
          type="datetime-local"
          id="end-before"
          value={endBefore}
          min={minEndTime}
          onChange={(e) => setEndBefore(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <button type="submit" disabled={isLoading} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
        {isLoading ? "Calculating..." : "Find Cheapest Window"}
      </button>
    </form>
  );
};