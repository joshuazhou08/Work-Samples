export const sessionKeys = {
  all: ["sessions"] as const,
  list: (filters?: any) =>
    filters
      ? [...sessionKeys.all, "list", filters]
      : ([...sessionKeys.all, "list"] as const),
  detail: (id: number) => [...sessionKeys.all, "detail", id] as const,
  upcomingSessions: () => [...sessionKeys.all, "upcoming"] as const,
  sessionStats: () => [...sessionKeys.all, "stats"] as const,
  availableStudents: () => [...sessionKeys.all, "available-students"] as const,
  rates: () => [...sessionKeys.all, "rates"] as const,
  studentRates: (studentId: number) =>
    [...sessionKeys.rates(), "student", studentId] as const,
  tutorRates: (tutorId: number) =>
    [...sessionKeys.rates(), "tutor", tutorId] as const,
};
