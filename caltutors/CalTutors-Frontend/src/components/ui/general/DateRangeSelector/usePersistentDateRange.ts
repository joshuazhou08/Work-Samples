"use client";

import { useMemo, useState, useEffect } from "react";
import type { DateRangePreset } from "./DateRangeSelector";

interface UsePersistentDateRangeOptions {
  /**
   * Preset to use when nothing is stored.
   * Defaults to "current_month".
   */
  defaultPreset?: DateRangePreset;
  /**
   * Default start date when nothing is stored.
   * Defaults to the first day of the current month.
   */
  defaultStartDate?: string;
  /**
   * Default end date when nothing is stored.
   * Defaults to the last day of the current month.
   */
  defaultEndDate?: string;
}

const STORAGE_SUFFIXES = {
  preset: "preset",
  start: "startDate",
  end: "endDate",
} as const;

const getCurrentMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: firstDay.toISOString().split("T")[0],
    end: lastDay.toISOString().split("T")[0],
  };
};

export function usePersistentDateRange(
  storageKey: string,
  options: UsePersistentDateRangeOptions = {}
) {
  const currentMonth = useMemo(() => getCurrentMonthRange(), []);
  const defaultPreset = options.defaultPreset ?? "current_month";
  const defaultStartDate =
    options.defaultStartDate ?? currentMonth.start;
  const defaultEndDate =
    options.defaultEndDate ?? currentMonth.end;

  const buildStorageKey = (suffix: string) =>
    `${storageKey}-${suffix}`;

  const [preset, setPreset] = useState<DateRangePreset>(() => {
    if (typeof window === "undefined") return defaultPreset;
    const saved = window.localStorage.getItem(
      buildStorageKey(STORAGE_SUFFIXES.preset)
    );
    return (saved as DateRangePreset) ?? defaultPreset;
  });

  const [startDate, setStartDate] = useState<string>(() => {
    if (typeof window === "undefined") return defaultStartDate;
    const saved = window.localStorage.getItem(
      buildStorageKey(STORAGE_SUFFIXES.start)
    );
    return saved !== null ? saved : defaultStartDate;
  });

  const [endDate, setEndDate] = useState<string>(() => {
    if (typeof window === "undefined") return defaultEndDate;
    const saved = window.localStorage.getItem(
      buildStorageKey(STORAGE_SUFFIXES.end)
    );
    return saved !== null ? saved : defaultEndDate;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      buildStorageKey(STORAGE_SUFFIXES.preset),
      preset
    );
  }, [preset, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      buildStorageKey(STORAGE_SUFFIXES.start),
      startDate
    );
  }, [startDate, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      buildStorageKey(STORAGE_SUFFIXES.end),
      endDate
    );
  }, [endDate, storageKey]);

  return {
    preset,
    setPreset,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    currentMonth,
  };
}

export type UsePersistentDateRangeReturn = ReturnType<
  typeof usePersistentDateRange
>;
