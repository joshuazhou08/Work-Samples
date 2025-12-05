import { AxiosError } from "axios";

type BackendErrorResponse = {
  error?: string;
  messages?: unknown;
};

export function getErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<BackendErrorResponse>;
  const data = axiosErr?.response?.data;

  if (Array.isArray(data?.messages)) {
    const messages = data.messages.filter(
      (message): message is string => typeof message === "string",
    );

    if (messages.length > 0) {
      return messages.join("\n");
    }
  }

  if (typeof data?.error === "string") {
    return data.error;
  }

  // Fallback for anything else
  if (err instanceof Error) {
    return err.message;
  }

  return "An unknown error occurred";
}
