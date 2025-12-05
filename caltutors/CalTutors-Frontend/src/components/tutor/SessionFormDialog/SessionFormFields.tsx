import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DatePicker from "@/components/ui/general/DatePicker";
import { generateTimeOptions } from "@/components/ui/dashboard/Calendar";

interface SessionFormData {
  student: string;
  time: string;
  duration: string;
  date: string;
}

interface AvailableStudent {
  id: number;
  first_name: string;
  last_name: string;
  client_name?: string;
}

interface SessionFormFieldsProps {
  formData: SessionFormData;
  onFormChange: (field: keyof SessionFormData, value: string) => void;
  availableStudents: AvailableStudent[];
}

const timeOptions = generateTimeOptions();

export function SessionFormFields({
  formData,
  onFormChange,
  availableStudents,
}: SessionFormFieldsProps) {
  return (
    <>
      <div>
        <Label htmlFor="date">Date *</Label>
        <DatePicker
          value={formData.date}
          onChange={(date) => onFormChange("date", date)}
          placeholder="Select session date"
        />
      </div>

      <div>
        <Label htmlFor="student">Student *</Label>
        <Select
          value={formData.student}
          onValueChange={(value) => onFormChange("student", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a student" />
          </SelectTrigger>
          <SelectContent>
            {availableStudents.map((student) => (
              <SelectItem key={student.id} value={student.id.toString()}>
                {student.first_name} {student.last_name}
                {student.client_name && ` (${student.client_name})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="time">Time *</Label>
          <Select
            value={formData.time}
            onValueChange={(value) => onFormChange("time", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time.value} value={time.value}>
                  {time.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="duration">Duration *</Label>
          <Select
            value={formData.duration}
            onValueChange={(value) => onFormChange("duration", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 min</SelectItem>
              <SelectItem value="45">45 min</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
              <SelectItem value="150">2.5 hours</SelectItem>
              <SelectItem value="180">3 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
}
