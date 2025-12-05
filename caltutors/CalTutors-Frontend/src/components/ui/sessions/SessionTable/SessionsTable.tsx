import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/dashboard/DataTable";
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatTime,
} from "@/utils/formatters";

export interface SessionRow {
  id: number;
  start_time: string;
  duration_minutes: number;
  student_name: string;
  tutor_name?: string | null;
  student_rate?: string | null;
  student_charge?: string | null;
  tutor_rate?: string | null;
  tutor_payment?: string | null;
}

interface SessionsTableProps {
  sessions: SessionRow[];
  showTutorFinance?: boolean;
}

export function SessionsTable({
  sessions,
  showTutorFinance = true,
}: SessionsTableProps) {
  const hasTutorColumn = sessions.some(
    (session) => session.tutor_name && session.tutor_name.trim().length > 0,
  );

  const columns: ColumnDef<SessionRow>[] = [
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
      accessorKey: "student_name",
      header: "Student",
      cell: ({ row }) => (
        <p className="text-gray-900">{row.original.student_name}</p>
      ),
    },
  ];

  if (hasTutorColumn) {
    columns.push({
      accessorKey: "tutor_name",
      header: "Tutor",
      cell: ({ row }) =>
        row.original.tutor_name ? (
          <p className="text-gray-900">{row.original.tutor_name}</p>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    });
  }

  columns.push(
    {
      accessorKey: "duration_minutes",
      header: () => <div className="text-right">Duration</div>,
      cell: ({ row }) => (
        <div className="text-right text-gray-900">
          {formatDuration(row.original.duration_minutes)}
        </div>
      ),
    },
    {
      accessorKey: "student_rate",
      header: () => <div className="text-right">Student Rate</div>,
      cell: ({ row }) => {
        const { student_rate } = row.original;
        return (
          <div className="text-right text-gray-900">
            {student_rate ? `${formatCurrency(student_rate)}/hr` : "--"}
          </div>
        );
      },
    },
    {
      accessorKey: "student_charge",
      header: () => <div className="text-right">Student Charge</div>,
      cell: ({ row }) => {
        const { student_charge } = row.original;
        return (
          <div className="text-right font-medium text-gray-900">
            {student_charge ? formatCurrency(student_charge) : "--"}
          </div>
        );
      },
    },
  );

  if (showTutorFinance) {
    columns.push(
      {
        accessorKey: "tutor_rate",
        header: () => <div className="text-right">Tutor Rate</div>,
        cell: ({ row }) => {
          const { tutor_rate } = row.original;
          return (
            <div className="text-right text-gray-900">
              {tutor_rate ? `${formatCurrency(tutor_rate)}/hr` : "--"}
            </div>
          );
        },
      },
      {
        accessorKey: "tutor_payment",
        header: () => <div className="text-right">Tutor Payment</div>,
        cell: ({ row }) => {
          const { tutor_payment } = row.original;
          return (
            <div className="text-right font-medium text-gray-900">
              {tutor_payment ? formatCurrency(tutor_payment) : "--"}
            </div>
          );
        },
      },
    );
  }

  return (
    <div className="bg-gray-50 border-t border-gray-200 overflow-x-auto">
      <div className="min-w-[640px]">
        <DataTable columns={columns} data={sessions} variant="basic" />
      </div>
    </div>
  );
}
