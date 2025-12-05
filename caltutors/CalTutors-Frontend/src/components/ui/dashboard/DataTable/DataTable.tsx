"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  searchKey?: string;
  searchValue?: string;
  getRowClassName?: (row: TData) => string;
  variant?: "default" | "basic";
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  searchKey,
  searchValue,
  getRowClassName,
  variant = "default",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const containerClassName =
    variant === "basic"
      ? "overflow-hidden"
      : "overflow-hidden bg-white rounded-lg border border-gray-200/60 shadow-sm";

  const headerRowClassName =
    variant === "basic"
      ? "bg-gray-100 border-b border-gray-200"
      : "border-b border-gray-100";

  const headerCellClassName =
    variant === "basic" ? "text-xs font-medium text-gray-600" : "bg-gray-50/50";

  const bodyRowClassName =
    variant === "basic"
      ? "border-b border-gray-200 hover:bg-white transition-colors"
      : "border-b border-gray-50 transition-colors";

  const bodyRowHoverClassName =
    variant === "basic"
      ? ""
      : onRowClick
      ? "cursor-pointer hover:bg-blue-50/50"
      : "hover:bg-gray-50/50";

  return (
    <div className={containerClassName}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className={headerRowClassName}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className={headerCellClassName}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const customClassName = getRowClassName?.(row.original) || "";
              return (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={`${bodyRowClassName} ${bodyRowHoverClassName} ${customClassName}`}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-gray-400"
              >
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
