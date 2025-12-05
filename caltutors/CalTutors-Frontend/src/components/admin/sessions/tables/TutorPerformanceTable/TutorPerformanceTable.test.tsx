import { render, screen } from "@testing-library/react";
import TutorPerformanceTable from "./TutorPerformanceTable";

describe("TutorPerformanceTable", () => {
  const mockTutors = [
    {
      info: { id: 1, first_name: "John", last_name: "Smith" },
      count: 10,
    },
    {
      info: { id: 2, first_name: "Sarah", last_name: "Johnson" },
      count: 8,
    },
  ];

  it("renders table with tutors", () => {
    render(
      <TutorPerformanceTable tutors={mockTutors} title="Most Active Tutors" />
    );

    expect(screen.getByText("Most Active Tutors")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(screen.getByText("Sarah Johnson")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("displays empty state when no tutors", () => {
    render(
      <TutorPerformanceTable
        tutors={[]}
        title="Most Active Tutors"
        emptyMessage="No data available"
      />
    );

    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("displays loading state", () => {
    render(
      <TutorPerformanceTable
        tutors={mockTutors}
        title="Most Active Tutors"
        isLoading={true}
      />
    );

    const loadingElements = screen
      .getAllByRole("generic")
      .filter((element) => element.className.includes("animate-pulse"));
    expect(loadingElements.length).toBeGreaterThan(0);
  });
});
