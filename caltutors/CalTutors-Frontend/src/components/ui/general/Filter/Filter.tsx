"use client";

import { ReactNode } from "react";
import { Filter as FilterIcon, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export interface FilterOption {
  id: string;
  label: string;
  checked: boolean;
}

interface FilterProps {
  options: FilterOption[];
  onOptionChange: (optionId: string, checked: boolean) => void;
  onReset: () => void;
  showReset?: boolean;
  actionSlot?: ReactNode;
}

export function Filter({
  options,
  onOptionChange,
  onReset,
  showReset = true,
  actionSlot,
}: FilterProps) {
  const hasActiveFilters = options.some((option) => option.checked);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <FilterIcon size={18} className="text-gray-500" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        {(actionSlot || (showReset && hasActiveFilters)) && (
          <div className="flex items-center gap-2">
            {actionSlot}
            {showReset && hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-auto p-1 text-gray-600 hover:text-gray-900"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <div key={option.id} className="flex items-center gap-2">
            <Checkbox
              id={option.id}
              checked={option.checked}
              onCheckedChange={(checked) =>
                onOptionChange(option.id, checked as boolean)
              }
            />
            <label
              htmlFor={option.id}
              className="text-sm text-gray-700 cursor-pointer select-none leading-tight"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
