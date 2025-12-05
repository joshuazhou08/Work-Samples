import { ChevronDown, ChevronRight } from "lucide-react";
import { DataTable } from "@/components/ui/dashboard/DataTable";
import { formatDate, formatTime } from "@/utils/formatters";
import { ColumnDef } from "@tanstack/react-table";
import type {
  UnchargedSessionGroup,
  UnchargedSessionItem as SessionItem,
} from "@/types/admin_management";

interface UnchargedSessionItemProps {
  group: UnchargedSessionGroup;
  isExpanded: boolean;
  onToggle: () => void;
}

export function UnchargedSessionItem({
  group,
  isExpanded,
  onToggle,
}: UnchargedSessionItemProps) {
  const sessionColumns: ColumnDef<SessionItem>[] = [
    {
      accessorKey: "start_time",
      header: "Date & Time",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">
            {formatDate(row.original.start_time)}
          </p>
          <p className="text-xs text-gray-500">
            {formatTime(row.original.start_time)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "tutor_name",
      header: "Tutor",
      cell: ({ row }) => (
        <p className="text-gray-900">{row.original.tutor_name}</p>
      ),
    },
    {
      accessorKey: "duration_minutes",
      header: () => <div className="text-right">Duration</div>,
      cell: ({ row }) => (
        <div className="text-right text-gray-900">
          {(row.original.duration_minutes / 60).toFixed(1)}h
        </div>
      ),
    },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
          <div className="text-left">
            <p className="font-medium text-gray-900">
              {group.student.first_name} {group.student.last_name}
            </p>
            <p className="text-sm text-gray-500">
              {(() => {
                const uniqueTutors = new Set(
                  group.sessions.map((s) => s.tutor_name)
                );
                if (uniqueTutors.size === 1) {
                  return `Tutor: ${group.sessions[0].tutor_name}`;
                }
                return `${group.sessions.length} sessions with multiple tutors`;
              })()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900">
            {group.sessions.length}{" "}
            {group.sessions.length === 1 ? "session" : "sessions"}
          </p>
          <p className="text-sm text-gray-500">
            {group.student.email || "No email"}
          </p>
        </div>
      </button>

      {isExpanded && group.sessions.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200">
          <DataTable
            columns={sessionColumns}
            data={group.sessions}
            variant="basic"
          />
        </div>
      )}
    </div>
  );
}
