import { render, screen } from "@testing-library/react";
import ActivityFeed from "./ActivityFeed";
import { Users, Calendar, BookOpen } from "lucide-react";

describe("ActivityFeed", () => {
  const mockActivities = [
    {
      icon: Users,
      text: "New student registration: John Doe",
      time: "2 hours ago",
    },
    {
      icon: Calendar,
      text: "Session completed: Math Tutoring",
      time: "4 hours ago",
    },
    {
      icon: BookOpen,
      text: "New tutor approved: Sarah Smith",
      time: "1 day ago",
    },
  ];

  it("renders the component with title", () => {
    render(<ActivityFeed activities={mockActivities} isLoading={false} />);
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
  });

  it("renders all activity items", () => {
    render(<ActivityFeed activities={mockActivities} isLoading={false} />);
    expect(
      screen.getByText("New student registration: John Doe")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Session completed: Math Tutoring")
    ).toBeInTheDocument();
    expect(
      screen.getByText("New tutor approved: Sarah Smith")
    ).toBeInTheDocument();
  });

  it("renders activity timestamps", () => {
    render(<ActivityFeed activities={mockActivities} isLoading={false} />);
    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
    expect(screen.getByText("4 hours ago")).toBeInTheDocument();
    expect(screen.getByText("1 day ago")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<ActivityFeed activities={[]} isLoading={true} />);
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText("Loading activities...")).toBeInTheDocument();
  });

  it("renders with empty activities array", () => {
    render(<ActivityFeed activities={[]} isLoading={false} />);
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.queryByText("Loading activities...")).not.toBeInTheDocument();
  });

  it("renders correct number of activity items", () => {
    render(<ActivityFeed activities={mockActivities} isLoading={false} />);
    const activityTexts = [
      "New student registration: John Doe",
      "Session completed: Math Tutoring",
      "New tutor approved: Sarah Smith",
    ];
    activityTexts.forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  it("does not render activities when loading", () => {
    render(<ActivityFeed activities={mockActivities} isLoading={true} />);
    expect(
      screen.queryByText("New student registration: John Doe")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Loading activities...")).toBeInTheDocument();
  });
});
