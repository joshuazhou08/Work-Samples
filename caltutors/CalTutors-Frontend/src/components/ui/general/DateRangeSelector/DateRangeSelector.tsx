"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import DatePicker from "@/components/ui/general/DatePicker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DateRangePreset = "current_month" | "all_time" | "custom";

const pad = (value: number) => value.toString().padStart(2, "0");

const toDateOnlyString = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toStartOfDayISOString = (date: string) => {
  if (!date) return "";
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return "";
  const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  return localDate.toISOString();
};

const toEndOfDayISOString = (date: string) => {
  if (!date) return "";
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return "";
  const localDate = new Date(year, month - 1, day, 23, 59, 59, 999);
  return localDate.toISOString();
};

const extractDateOnly = (value: string) => {
  if (!value) return "";
  if (!value.includes("T")) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return toDateOnlyString(parsed);
};

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  preset: DateRangePreset;
  onPresetChange: (preset: DateRangePreset) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  showRefresh?: boolean;
}

export default function DateRangeSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  preset,
  onPresetChange,
  onRefresh,
  isLoading = false,
  showRefresh = true,
}: DateRangeSelectorProps) {
  // Calculate current month dates
  const getCurrentMonthDates = () => {
    const now = new Date();
    const firstDay = toDateOnlyString(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );
    const lastDay = toDateOnlyString(
      new Date(now.getFullYear(), now.getMonth() + 1, 0)
    );
    return {
      start: toStartOfDayISOString(firstDay),
      end: toEndOfDayISOString(lastDay),
    };
  };

  useEffect(() => {
    if (!startDate) return;
    if (startDate.includes("T")) return;
    onStartDateChange(toStartOfDayISOString(startDate));
  }, [onStartDateChange, startDate]);

  useEffect(() => {
    if (!endDate) return;
    if (endDate.includes("T")) return;
    onEndDateChange(toEndOfDayISOString(endDate));
  }, [endDate, onEndDateChange]);

  const handlePresetChange = (value: DateRangePreset) => {
    onPresetChange(value);

    if (value === "current_month") {
      const currentMonth = getCurrentMonthDates();
      onStartDateChange(currentMonth.start);
      onEndDateChange(currentMonth.end);
    } else if (value === "all_time") {
      // Clear dates for all time
      onStartDateChange("");
      onEndDateChange("");
    }
    // For "custom", don't change dates - let user set them
  };

  return (
    <div className="flex gap-3 items-end flex-wrap">
      <div className="w-[250px]">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Date Range
        </label>
        <Select value={preset} onValueChange={handlePresetChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current_month">Current Month</SelectItem>
            <SelectItem value="all_time">All Time</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {preset === "custom" && (
        <>
          <div className="w-[250px]">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Start Date
            </label>
            <DatePicker
              value={extractDateOnly(startDate)}
              onChange={(value) =>
                onStartDateChange(value ? toStartOfDayISOString(value) : "")
              }
              placeholder="Select start date"
            />
          </div>
          <div className="w-[250px]">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              End Date
            </label>
            <DatePicker
              value={extractDateOnly(endDate)}
              onChange={(value) =>
                onEndDateChange(value ? toEndOfDayISOString(value) : "")
              }
              placeholder="Select end date"
            />
          </div>
        </>
      )}

      {showRefresh && onRefresh && (
        <Button onClick={onRefresh} disabled={isLoading} size="sm">
          <RefreshCw className={isLoading ? "animate-spin" : ""} />
          Refresh
        </Button>
      )}
    </div>
  );
}
