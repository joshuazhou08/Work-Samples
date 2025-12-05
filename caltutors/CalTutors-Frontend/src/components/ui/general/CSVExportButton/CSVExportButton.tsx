"use client";

import Papa from "papaparse";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CSVHeader<TData> {
  key: string;
  label: string;
  accessor?: (row: TData) => unknown;
}

interface CSVExportButtonProps<TData> {
  data: TData[];
  headers?: CSVHeader<TData>[];
  fileName?: string;
  className?: string;
  disabledText?: string;
}

export function CSVExportButton<TData>({
  data,
  headers,
  fileName = "export.csv",
  className,
  disabledText = "No data to export",
}: CSVExportButtonProps<TData>) {
  const resolveValue = (row: TData, key: string) => {
    const keyParts = key.split(".");
    let value: unknown = row as unknown;

    for (const part of keyParts) {
      if (value === null || value === undefined) {
        return "";
      }
      value = (value as Record<string, unknown>)[part];
    }

    return value ?? "";
  };

  const buildRows = (): Record<string, unknown>[] => {
    if (!headers || headers.length === 0) {
      return data.map((row) =>
        typeof row === "object" && row !== null ? { ...row } : { value: row }
      ) as Record<string, unknown>[];
    }

    return data.map((row) =>
      headers.reduce<Record<string, unknown>>((acc, header) => {
        const resolvedValue = header.accessor
          ? header.accessor(row)
          : resolveValue(row, header.key);
        acc[header.label] =
          resolvedValue === null || resolvedValue === undefined
            ? ""
            : resolvedValue;
        return acc;
      }, {})
    );
  };

  const handleExport = () => {
    if (!data || data.length === 0) {
      return;
    }

    const rows = buildRows();
    const csv = Papa.unparse(rows, {
      quotes: true,
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isDisabled = !data || data.length === 0;

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleExport}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        "disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none",
        className
      )}
      title={isDisabled ? disabledText : "Download CSV"}
    >
      <Download className="h-4 w-4" />
      <span>Export CSV</span>
    </Button>
  );
}
