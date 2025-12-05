import { UnchargedSessionItem } from "../UnchargedSessionItem";
import type { UnchargedSessionGroup } from "@/types/admin_management";

interface UnchargedSessionsListProps {
  groups: UnchargedSessionGroup[];
  expandedStudents: Set<number>;
  onToggleStudent: (studentId: number) => void;
}

export function UnchargedSessionsList({
  groups,
  expandedStudents,
  onToggleStudent,
}: UnchargedSessionsListProps) {
  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <UnchargedSessionItem
          key={group.student.id}
          group={group}
          isExpanded={expandedStudents.has(group.student.id)}
          onToggle={() => onToggleStudent(group.student.id)}
        />
      ))}
    </div>
  );
}
