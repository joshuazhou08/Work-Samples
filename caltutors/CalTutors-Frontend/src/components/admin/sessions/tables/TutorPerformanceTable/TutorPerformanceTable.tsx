"use client";

import { Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface TutorInfo {
  id: number;
  first_name: string;
  last_name: string;
}

interface TutorStat {
  info: TutorInfo;
  count: number;
}

interface TutorPerformanceTableProps {
  tutors: TutorStat[];
  title: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function TutorPerformanceTable({
  tutors,
  title,
  isLoading = false,
  emptyMessage = "No tutor data available",
}: TutorPerformanceTableProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {tutors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Users size={48} className="mb-3" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Tutor</TableHead>
              <TableHead className="text-right font-semibold">
                Sessions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tutors.map((tutor, index) => (
              <TableRow key={tutor.info.id || index}>
                <TableCell className="font-medium">
                  {tutor.info.first_name} {tutor.info.last_name}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {tutor.count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
