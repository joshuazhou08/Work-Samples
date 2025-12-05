import { render, screen, fireEvent } from "@testing-library/react";
import QuickActions from "./QuickActions";
import { Users, BookOpen, Calendar } from "lucide-react";

describe("QuickActions", () => {
  const mockActions = [
    {
      icon: Users,
      label: "Manage Users",
      onClick: jest.fn(),
    },
    {
      icon: BookOpen,
      label: "Add Subject",
      onClick: jest.fn(),
    },
    {
      icon: Calendar,
      label: "View Sessions",
      onClick: jest.fn(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the component with title", () => {
    render(<QuickActions actions={mockActions} />);
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
  });

  it("renders all action buttons", () => {
    render(<QuickActions actions={mockActions} />);
    expect(screen.getByText("Manage Users")).toBeInTheDocument();
    expect(screen.getByText("Add Subject")).toBeInTheDocument();
    expect(screen.getByText("View Sessions")).toBeInTheDocument();
  });

  it("calls onClick handler when action button is clicked", () => {
    render(<QuickActions actions={mockActions} />);
    const manageUsersButton = screen.getByText("Manage Users");
    fireEvent.click(manageUsersButton);
    expect(mockActions[0].onClick).toHaveBeenCalledTimes(1);
  });

  it("renders correct number of action buttons", () => {
    render(<QuickActions actions={mockActions} />);
    const buttons = screen.getAllByRole("button");
    // +1 for the action buttons (Quick Actions title is not a button)
    expect(buttons).toHaveLength(3);
  });

  it("renders with empty actions array", () => {
    render(<QuickActions actions={[]} />);
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    const buttons = screen.queryAllByRole("button");
    expect(buttons).toHaveLength(0);
  });

  it("each button has correct soft variant styling", () => {
    render(<QuickActions actions={mockActions} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toHaveClass("w-full");
      expect(button).toHaveClass("justify-start");
    });
  });
});
