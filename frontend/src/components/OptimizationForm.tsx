import React, { useState } from "react";
import type { WindowSearchParams } from "../types";

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

interface TimeSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  optional?: boolean;
}

const TimeSelect: React.FC<TimeSelectProps> = ({
  id,
  value,
  onChange,
  disabled,
  optional = false,
}) => {
  const [currentHour, currentMinute] = value ? value.split(":") : ["", ""];

  const handleHourChange = (newHour: string) => {
    if (!newHour) {
      onChange("");
      return;
    }
    const min = currentMinute || "00";
    onChange(`${newHour}:${min}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    const hr = currentHour || "00";
    onChange(`${hr}:${newMinute}`);
  };

  return (
    <div className="time-select-group">
      <select
        id={id}
        className="form-select"
        value={currentHour}
        onChange={(e) => handleHourChange(e.target.value)}
        disabled={disabled}
      >
        {optional && <option value="">--</option>}
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="time-select-separator">:</span>
      <select
        aria-label={`${id} minutes`}
        className="form-select"
        value={currentMinute}
        onChange={(e) => handleMinuteChange(e.target.value)}
        disabled={disabled || (optional && !currentHour)}
      >
        {optional && !currentHour && <option value="">--</option>}
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
};

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
  const getCurrentTimeString = (): string => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const roundedMinutes = (Math.floor(now.getMinutes() / 15) * 15)
    .toString()
    .padStart(2, "0");
  return `${hours}:${roundedMinutes}`;
};

  const combineDayAndTime = (day: "today" | "tomorrow", timeString: string): string => {
    const targetDate = new Date();
    if (day === "tomorrow") {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    const [hours, minutes] = timeString.split(":").map(Number);
    targetDate.setHours(hours, minutes, 0, 0);
    return targetDate.toISOString();
  };

  const [hours, setHours] = useState<number>(1);
  const [startDay, setStartDay] = useState<"today" | "tomorrow">("today");
  const [startTime, setStartTime] = useState<string>(getCurrentTimeString());
  const [endDay, setEndDay] = useState<"today" | "tomorrow">("today");
  const [endTime, setEndTime] = useState<string>("");

  const isTomorrowAvailable = latestDataEndTime
    ? new Date(latestDataEndTime).getDate() !== new Date().getDate()
    : false;

  const handlePresetNow = () => {
    setStartDay("today");
    setStartTime(getCurrentTimeString());
    setEndTime("");
  };

  const handlePresetTonight = () => {
    setStartDay("today");
    setStartTime("22:00");
    if (isTomorrowAvailable) {
      setEndDay("tomorrow");
      setEndTime("07:00");
    } else {
      setEndTime("");
    }
  };

  const handlePresetTomorrowDay = () => {
    if (!isTomorrowAvailable) return;
    setStartDay("tomorrow");
    setStartTime("08:00");
    setEndDay("tomorrow");
    setEndTime("20:00");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startIso = combineDayAndTime(startDay, startTime);
    const endIso = endTime ? combineDayAndTime(endDay, endTime) : undefined;

    onSearch({
      hours,
      start_after: startIso,
      end_before: endIso,
    });
  };

  const hourOptions = Array.from(
    { length: Math.max(1, maxAvailableHours || 24) },
    (_, i) => i + 1
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="preset-container">
        <button
          type="button"
          className="preset-button"
          onClick={handlePresetNow}
          disabled={isLoading}
        >
          Now
        </button>
        <button
          type="button"
          className="preset-button"
          onClick={handlePresetTonight}
          disabled={isLoading}
        >
          Night (22:00–07:00)
        </button>
        <button
          type="button"
          className="preset-button"
          onClick={handlePresetTomorrowDay}
          disabled={isLoading || !isTomorrowAvailable}
        >
          Tomorrow daytime
        </button>
      </div>

      <div className="form-group">
        <label htmlFor="duration-select" className="form-label">
          Duration (hours):
        </label>
        <select
          id="duration-select"
          className="form-select"
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

      <div className="form-group">
        <label htmlFor="start-time" className="form-label">
          Start search after:
        </label>
        <div className="time-input-row">
          <div className="day-toggle-group">
            <button
              type="button"
              className={`day-button ${startDay === "today" ? "active" : ""}`}
              onClick={() => setStartDay("today")}
              disabled={isLoading}
            >
              Today
            </button>
            <button
              type="button"
              className={`day-button ${startDay === "tomorrow" ? "active" : ""}`}
              onClick={() => setStartDay("tomorrow")}
              disabled={isLoading || !isTomorrowAvailable}
            >
              Tomorrow
            </button>
          </div>
          <TimeSelect
            id="start-time"
            value={startTime}
            onChange={setStartTime}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="end-time" className="form-label">
          End search before (optional):
        </label>
        <div className="time-input-row">
          <div className="day-toggle-group">
            <button
              type="button"
              className={`day-button ${endDay === "today" ? "active" : ""}`}
              onClick={() => setEndDay("today")}
              disabled={isLoading}
            >
              Today
            </button>
            <button
              type="button"
              className={`day-button ${endDay === "tomorrow" ? "active" : ""}`}
              onClick={() => setEndDay("tomorrow")}
              disabled={isLoading || !isTomorrowAvailable}
            >
              Tomorrow
            </button>
          </div>
          <TimeSelect
            id="end-time"
            value={endTime}
            onChange={setEndTime}
            disabled={isLoading}
            optional
          />
        </div>
      </div>

      <button type="submit" className="submit-button" disabled={isLoading}>
        {isLoading ? "Calculating..." : "Find Cheapest Window"}
      </button>
    </form>
  );
};