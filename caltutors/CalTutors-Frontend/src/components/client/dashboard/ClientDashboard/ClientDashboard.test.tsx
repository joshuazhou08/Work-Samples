import { render, screen } from "@testing-library/react";
import { ClientDashboard } from "./ClientDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions } from "@/hooks/session_management";
import { StatsGrid } from "@/components/ui/general";
import { mockUser as baseMockUser, createSession } from "@/utils/test-utils";

jest.mock("@/contexts/AuthContext");
jest.mock("@/hooks/session_management");
jest.mock("@/components/ui/general", () => ({
  StatsGrid: jest.fn(() => <div data-testid="stats-grid" />),
}));
jest.mock(
  "@/components/client/dashboard/ClientStudents/ClientStudentsSection",
  () => ({
    ClientStudentsSection: jest.fn(() => (
      <div data-testid="client-students-section" />
    )),
  })
);

const mockUseAuth = useAuth as jest.Mock;
const mockUseSessions = useSessions as jest.Mock;

describe("ClientDashboard", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T12:00:00Z"));
    (StatsGrid as jest.Mock).mockImplementation(() => (
      <div data-testid="stats-grid" />
    ));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns null when user is not available", () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUseSessions.mockReturnValue({ data: [], isLoading: false });

    const { container } = render(<ClientDashboard />);

    expect(container.firstChild).toBeNull();
  });

  it("renders stats based on session data for a client user", () => {
    const mockUser = {
      ...baseMockUser,
      id: 42,
      first_name: "Casey",
      balance: "120.50",
    };

    const sessions = [
      createSession({
        id: 1,
        student_charged: false,
        start_time: "2024-12-15T15:00:00Z",
        end_time: "2024-12-15T16:00:00Z",
      }),
      createSession({
        id: 2,
        start_time: "2025-01-05T18:00:00Z",
        end_time: "2025-01-05T19:00:00Z",
        student_charged: true,
      }),
      createSession({
        id: 3,
        student_charged: true,
        start_time: "2024-11-10T18:00:00Z",
        end_time: "2024-11-10T19:00:00Z",
      }),
    ];

    mockUseAuth.mockReturnValue({ user: mockUser });
    mockUseSessions.mockReturnValue({ data: sessions, isLoading: false });

    render(<ClientDashboard />);

    expect(mockUseSessions).toHaveBeenCalledWith({ client_id: mockUser.id });
    expect(screen.getByText(/Welcome back, Casey!/i)).toBeInTheDocument();
    expect(
      screen.getByText(/\$120\.50 in account credits/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("stats-grid")).toBeInTheDocument();

    const statsArg = (StatsGrid as jest.Mock).mock.calls[0][0].stats;

    expect(statsArg).toEqual([
      expect.objectContaining({ title: "Account Credits", value: 120.5 }),
      expect.objectContaining({ title: "Sessions to Review", value: 1 }),
      expect.objectContaining({ title: "Upcoming Sessions", value: 1 }),
      expect.objectContaining({ title: "Total Sessions", value: 3 }),
    ]);
  });
});
