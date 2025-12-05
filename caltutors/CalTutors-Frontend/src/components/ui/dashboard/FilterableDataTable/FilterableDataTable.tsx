"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../DataTable";
import { Filter, FilterOption } from "@/components/ui/general/Filter";
import {
  CSVExportButton,
  CSVHeader,
} from "@/components/ui/general/CSVExportButton";

interface FilterableDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  filterOptions?: FilterOption[];
  onFilterChange?: (optionId: string, checked: boolean) => void;
  onFilterReset?: () => void;
  showFilter?: boolean;
  exportToCSV?: boolean;
  csvFileName?: string;
  csvHeaders?: CSVHeader<TData>[];
}

export function FilterableDataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  filterOptions = [],
  onFilterChange,
  onFilterReset,
  showFilter = true,
  exportToCSV = false,
  csvFileName = "export.csv",
  csvHeaders,
}: FilterableDataTableProps<TData, TValue>) {
  const hasFilters = filterOptions.length > 0 && showFilter;

  const exportButton = exportToCSV ? (
    <CSVExportButton
      data={data}
      headers={csvHeaders}
      fileName={csvFileName}
      className="w-full sm:w-auto sm:self-start"
    />
  ) : null;

  return (
    <div className="space-y-4">
      {hasFilters && onFilterChange && onFilterReset ? (
        <Filter
          options={filterOptions}
          onOptionChange={onFilterChange}
          onReset={onFilterReset}
          actionSlot={exportButton}
        />
      ) : (
        exportToCSV && <div className="flex justify-end">{exportButton}</div>
      )}
      <DataTable columns={columns} data={data} onRowClick={onRowClick} />
    </div>
  );
}
