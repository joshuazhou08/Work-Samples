"use client";

import { useMemo } from "react";
import { Loader2, AlertCircle, CalendarX, CalendarClock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions } from "@/hooks/session_management";
import {
  SessionsTable,
  type SessionRow,
} from "@/components/ui/sessions/SessionTable";

const computeAmount = (rate: string | null | undefined, minutes: number) => {
  if (!rate) return null;
  const numericRate = Number(rate);
  if (Number.isNaN(numericRate)) return null;
  return ((numericRate * minutes) / 60).toFixed(2);
};

export function ClientSessions() {
  const { user } = useAuth();
  const isClient = user?.user_type === "client";
  const clientId = isClient ? user.id : undefined;

  const {
    data: sessions = [],
    isLoading,
    error,
  } = useSessions(clientId ? { client_id: clientId } : undefined);

  const unchargedSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          !session.student_charged &&
          new Date(session.end_time).getTime() <= Date.now()
      ),
    [sessions]
  );

  const upcomingSessions = useMemo(() => {
    const now = Date.now();
    return sessions.filter(
      (session) => new Date(session.start_time).getTime() > now
    );
  }, [sessions]);

  const unchargedRows = useMemo<SessionRow[]>(
    () =>
      unchargedSessions.map((session) => ({
        id: session.id,
        start_time: session.start_time,
        duration_minutes: session.duration_minutes,
        student_name: `${session.student_info.first_name} ${session.student_info.last_name}`,
        tutor_name: session.tutor_info
          ? `${session.tutor_info.first_name} ${session.tutor_info.last_name}`
          : null,
        student_rate: session.student_rate ?? null,
        student_charge: computeAmount(
          session.student_rate ?? null,
          session.duration_minutes
        ),
        tutor_rate: session.tutor_rate ?? null,
        tutor_payment: computeAmount(
          session.tutor_rate ?? null,
          session.duration_minutes
        ),
      })),
    [unchargedSessions]
  );

  const upcomingRows = useMemo<SessionRow[]>(
    () =>
      upcomingSessions.map((session) => ({
        id: session.id,
        start_time: session.start_time,
        duration_minutes: session.duration_minutes,
        student_name: `${session.student_info.first_name} ${session.student_info.last_name}`,
        tutor_name: session.tutor_info
          ? `${session.tutor_info.first_name} ${session.tutor_info.last_name}`
          : null,
        student_rate: session.student_rate ?? null,
        student_charge: computeAmount(
          session.student_rate ?? null,
          session.duration_minutes
        ),
        tutor_rate: session.tutor_rate ?? null,
        tutor_payment: null,
      })),
    [upcomingSessions]
  );

  if (!isClient) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="lg:col-span-2 px-1">
        <p className="text-sm text-gray-600">
          Note: Some sessions might not appear yet if your tutor hasn&apos;t
          clocked them—no need to worry, they&apos;ll show up once submitted.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Sessions to Review
            </h2>
            <p className="text-sm text-gray-600">
              Sessions that will be charged on next cycle automatically.
            </p>
          </div>
          {!isLoading && (
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-50 text-blue-700">
              {unchargedSessions.length}{" "}
              {unchargedSessions.length === 1 ? "session" : "sessions"}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Error loading sessions</p>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && unchargedSessions.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            <CalendarX className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p className="font-medium text-gray-900">No uncharged sessions</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        )}

        {!isLoading && !error && unchargedSessions.length > 0 && (
          <div className="px-6 pb-6">
            <SessionsTable
              sessions={unchargedRows}
              showTutorFinance={false}
            />
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Upcoming Sessions
            </h2>
            <p className="text-sm text-gray-600">
              Sessions scheduled for a future date.
            </p>
          </div>
          {!isLoading && (
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-emerald-50 text-emerald-700">
              {upcomingSessions.length}{" "}
              {upcomingSessions.length === 1 ? "session" : "sessions"}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Error loading sessions</p>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && upcomingSessions.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            <CalendarClock className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p className="font-medium text-gray-900">No upcoming sessions</p>
            <p className="text-sm">Book a new session to see it here.</p>
          </div>
        )}

        {!isLoading && !error && upcomingSessions.length > 0 && (
          <div className="px-6 pb-6">
            <SessionsTable
              sessions={upcomingRows}
              showTutorFinance={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
