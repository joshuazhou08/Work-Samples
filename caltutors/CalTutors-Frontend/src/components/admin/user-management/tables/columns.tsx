import { ColumnDef } from "@tanstack/react-table";
import { AdminUser } from "@/types/admin_management";
import type { Student } from "@/types/students";
import { Mail, DollarSign, UserIcon } from "lucide-react";
import { DataTableColumnHeader } from "@/components/ui/dashboard/DataTable";

// Note: Status fields (hasStudents, hasTutors, hasActiveStudents) are now computed in backend
export type ClientWithStatus = AdminUser;
export type StudentWithStatus = Student;
export type TutorWithStatus = AdminUser;

export const tutorColumns: ColumnDef<TutorWithStatus>[] = [
  {
    accessorKey: "first_name",
    size: 250,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {user.first_name[0]}
            {user.last_name[0]}
          </div>
          <div>
            <div className="font-medium">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-sm text-gray-500">@{user.username}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    size: 280,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Mail size={16} className="text-gray-400" />
        <span>{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "subjects_taught",
    size: 200,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subjects" />
    ),
    cell: ({ row }) => (
      <div className="text-gray-700">
        {row.original.subjects_taught || "No subjects"}
      </div>
    ),
  },
  {
    accessorKey: "is_recently_active",
    size: 160,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Recent Activity" />
    ),
    cell: ({ row }) => (
      <span
        className={
          row.original.is_recently_active
            ? "text-sm text-green-600 font-medium"
            : "text-sm text-gray-500"
        }
      >
        {row.original.is_recently_active ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    accessorKey: "notices",
    size: 200,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Notices" />
    ),
    cell: ({ row }) => {
      const notices = row.original.notices || [];
      if (!notices.length) {
        return <span className="text-sm text-gray-500">None</span>;
      }
      if (notices.length > 1) {
        return (
          <ol className="text-sm text-red-600 list-decimal list-inside space-y-0.5">
            {notices.map((notice, idx) => (
              <li key={`${notice}-${idx}`}>{notice}</li>
            ))}
          </ol>
        );
      }
      return <span className="text-sm text-red-600">{notices[0]}</span>;
    },
  },
  {
    accessorKey: "date_joined",
    size: 140,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Joined" />
    ),
    cell: ({ row }) =>
      row.original.date_joined
        ? new Date(row.original.date_joined).toLocaleDateString()
        : "N/A",
  },
];

export const clientColumns: ColumnDef<ClientWithStatus>[] = [
  {
    accessorKey: "first_name",
    size: 250,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {user.first_name[0]}
            {user.last_name[0]}
          </div>
          <div>
            <div className="font-medium">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-sm text-gray-500">@{user.username}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    size: 280,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Mail size={16} className="text-gray-400" />
        <span>{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "balance",
    size: 140,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Credits" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <DollarSign size={16} className="text-green-600" />
        <span className="font-medium text-green-600">
          ${row.original.balance || "0.00"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "is_recently_active",
    size: 160,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Recent Activity" />
    ),
    cell: ({ row }) => (
      <span
        className={
          row.original.is_recently_active
            ? "text-sm text-green-600 font-medium"
            : "text-sm text-gray-500"
        }
      >
        {row.original.is_recently_active ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    accessorKey: "notices",
    size: 200,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Notices" />
    ),
    cell: ({ row }) => {
      const notices = row.original.notices || [];
      if (!notices.length) {
        return <span className="text-sm text-gray-500">None</span>;
      }
      if (notices.length > 1) {
        return (
          <ol className="text-sm text-red-600 list-decimal list-inside space-y-0.5">
            {notices.map((notice, idx) => (
              <li key={`${notice}-${idx}`}>{notice}</li>
            ))}
          </ol>
        );
      }
      return <span className="text-sm text-red-600">{notices[0]}</span>;
    },
  },
  {
    accessorKey: "date_joined",
    size: 140,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Joined" />
    ),
    cell: ({ row }) =>
      row.original.date_joined
        ? new Date(row.original.date_joined).toLocaleDateString()
        : "N/A",
  },
];

export const studentColumns: ColumnDef<StudentWithStatus>[] = [
  {
    accessorKey: "first_name",
    size: 250,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const student = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {student.first_name[0]}
            {student.last_name[0]}
          </div>
          <div>
            <div className="font-medium">
              {student.first_name} {student.last_name}
            </div>
            {student.grade_level && (
              <div className="text-sm text-gray-500">
                Grade: {student.grade_level}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    size: 280,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Mail size={16} className="text-gray-400" />
        <span>{row.original.email || "No email"}</span>
      </div>
    ),
  },
  {
    accessorKey: "client_name",
    size: 200,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Client" />
    ),
    cell: ({ row }) => (
      <div className="text-gray-700">
        {row.original.client_name || `Client ID: ${row.original.client}`}
      </div>
    ),
  },
  {
    accessorKey: "hasTutors",
    size: 150,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const hasTutors = row.original.hasTutors;
      if (hasTutors === false) {
        return (
          <div className="flex items-center gap-1.5 text-red-600">
            <UserIcon size={16} />
            <span className="font-medium text-sm">No tutors!</span>
          </div>
        );
      }
      return <span className="text-sm text-gray-500">Active</span>;
    },
  },
  {
    accessorKey: "created_at",
    size: 140,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) =>
      row.original.created_at
        ? new Date(row.original.created_at).toLocaleDateString()
        : "N/A",
  },
];
