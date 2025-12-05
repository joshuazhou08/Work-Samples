// Query key definitions for admin management
export const adminKeys = {
  all: ["admin"] as const,
  tutors: () => [...adminKeys.all, "tutors"] as const,
  clients: () => [...adminKeys.all, "clients"] as const,
  client: (id: number) => [...adminKeys.clients(), id] as const,
  students: () => [...adminKeys.all, "students"] as const,
  student: (id: number) => [...adminKeys.students(), id] as const,
  rates: () => [...adminKeys.all, "rates"] as const,
  rate: (id: number) => [...adminKeys.rates(), id] as const,
  studentRates: (studentId: number) =>
    [...adminKeys.rates(), "student", studentId] as const,
  tutorRates: (tutorId: number) =>
    [...adminKeys.rates(), "tutor", tutorId] as const,
  tutorPayments: (startDate?: string, endDate?: string) =>
    startDate || endDate
      ? [...adminKeys.all, "tutor-payments", startDate, endDate]
      : ([...adminKeys.all, "tutor-payments"] as const),
  charges: (filters?: any) =>
    filters
      ? [...adminKeys.all, "charges", filters]
      : ([...adminKeys.all, "charges"] as const),
  charge: (id: number) => [...adminKeys.all, "charge", id] as const,
  unchargedSessions: () => [...adminKeys.all, "uncharged-sessions"] as const,
  financeStats: (startDate: string, endDate: string) =>
    [...adminKeys.all, "finance-stats", startDate, endDate] as const,
  sessionStats: (startDate: string, endDate: string) =>
    [...adminKeys.all, "session-stats", startDate, endDate] as const,
};
