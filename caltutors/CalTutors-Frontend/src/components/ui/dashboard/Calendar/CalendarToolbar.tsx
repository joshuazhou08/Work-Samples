import { View, Views } from "react-big-calendar";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DatePicker from "@/components/ui/general/DatePicker";

interface CalendarToolbarProps {
  label: string;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  onView: (view: View) => void;
  view: View;
  availableViews: View[];
  isMobile: boolean;
  date: Date;
  onDateChange: (date: Date) => void;
}

export function CalendarToolbar({
  label,
  onNavigate,
  onView,
  view,
  availableViews,
  isMobile,
  date,
  onDateChange,
}: CalendarToolbarProps) {
  const handleDateSelect = (selectedDate: string) => {
    const nextDate = parseISO(selectedDate);
    onDateChange(nextDate);
  };

  const mobileViewLabels: Record<string, string> = {
    [Views.DAY]: "day",
    [Views.WEEK]: "week",
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 pb-3 border-b border-gray-100">
      <div className="flex items-center gap-2 justify-center md:justify-start">
        <Button
          type="button"
          variant="ghost"
          className="min-w-[44px] h-10 px-3 text-gray-700 hover:text-gray-900 font-medium text-sm"
          onClick={() => onNavigate("PREV")}
        >
          ‹
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-w-[60px] h-10 px-3 text-gray-700 hover:text-gray-900 font-medium text-sm"
          onClick={() => onNavigate("TODAY")}
        >
          Today
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-w-[44px] h-10 px-3 text-gray-700 hover:text-gray-900 font-medium text-sm"
          onClick={() => onNavigate("NEXT")}
        >
          ›
        </Button>
      </div>

      <div className="text-center md:flex-1 md:flex md:flex-col md:items-center">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
          {label}
        </h2>
        {view === Views.DAY && (
          <div className="mt-3 w-full md:w-64 md:mt-2">
            <DatePicker
              value={format(date, "yyyy-MM-dd")}
              onChange={handleDateSelect}
              placeholder="Select date"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 bg-gray-100 rounded-lg p-1">
        {availableViews.map((viewName) => (
          <Button
            key={viewName}
            type="button"
            variant={view === viewName ? "default" : "ghost"}
            className={cn(
              "whitespace-nowrap px-4 md:px-5 py-2 text-xs md:text-sm font-medium capitalize shrink-0 min-w-[72px] md:min-w-[88px]",
              view === viewName
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "text-gray-600 hover:text-gray-900"
            )}
            onClick={() => onView(viewName)}
          >
            {isMobile
              ? mobileViewLabels[viewName as keyof typeof mobileViewLabels] ??
                viewName.toLowerCase()
              : viewName.toLowerCase()}
          </Button>
        ))}
      </div>
    </div>
  );
    }
