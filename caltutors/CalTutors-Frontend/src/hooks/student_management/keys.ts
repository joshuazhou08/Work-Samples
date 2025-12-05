export const studentKeys = {
  all: ["students"] as const,
  list: (params?: Record<string, unknown>) =>
    params
      ? [...studentKeys.all, "list", params]
      : ([...studentKeys.all, "list"] as const),
  detail: (id: number) => [...studentKeys.all, "detail", id] as const,
};
