import { render, screen, fireEvent } from "@testing-library/react";
import { ColumnDef } from "@tanstack/react-table";
import { FilterableDataTable } from "./FilterableDataTable";
import { FilterOption } from "@/components/ui/general";

interface TestUser {
  id: number;
  name: string;
  email: string;
  isActive?: boolean;
}

const columns: ColumnDef<TestUser>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
];

const mockData: TestUser[] = [
  { id: 1, name: "John Doe", email: "john@example.com", isActive: true },
  { id: 2, name: "Jane Smith", email: "jane@example.com", isActive: false },
];

describe("FilterableDataTable", () => {
  it("renders table with data", () => {
    render(<FilterableDataTable columns={columns} data={mockData} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("renders without filter when no options provided", () => {
    render(<FilterableDataTable columns={columns} data={mockData} />);
    expect(screen.queryByText("Filters")).not.toBeInTheDocument();
  });

  it("renders filter when options provided", () => {
    const filterOptions: FilterOption[] = [
      { id: "active", label: "Show active only", checked: false },
    ];
    const mockFilterChange = jest.fn();
    const mockFilterReset = jest.fn();

    render(
      <FilterableDataTable
        columns={columns}
        data={mockData}
        filterOptions={filterOptions}
        onFilterChange={mockFilterChange}
        onFilterReset={mockFilterReset}
      />
    );

    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByText("Show active only")).toBeInTheDocument();
  });

  it("calls onFilterChange when filter is changed", () => {
    const filterOptions: FilterOption[] = [
      { id: "active", label: "Show active only", checked: false },
    ];
    const mockFilterChange = jest.fn();
    const mockFilterReset = jest.fn();

    render(
      <FilterableDataTable
        columns={columns}
        data={mockData}
        filterOptions={filterOptions}
        onFilterChange={mockFilterChange}
        onFilterReset={mockFilterReset}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(mockFilterChange).toHaveBeenCalledWith("active", true);
  });

  it("calls onFilterReset when reset button is clicked", () => {
    const filterOptions: FilterOption[] = [
      { id: "active", label: "Show active only", checked: true },
    ];
    const mockFilterChange = jest.fn();
    const mockFilterReset = jest.fn();

    render(
      <FilterableDataTable
        columns={columns}
        data={mockData}
        filterOptions={filterOptions}
        onFilterChange={mockFilterChange}
        onFilterReset={mockFilterReset}
      />
    );

    const resetButton = screen.getByRole("button");
    fireEvent.click(resetButton);

    expect(mockFilterReset).toHaveBeenCalled();
  });

  it("calls onRowClick when row is clicked", () => {
    const mockRowClick = jest.fn();

    render(
      <FilterableDataTable
        columns={columns}
        data={mockData}
        onRowClick={mockRowClick}
      />
    );

    fireEvent.click(screen.getByText("John Doe"));
    expect(mockRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it("hides filter when showFilter is false", () => {
    const filterOptions: FilterOption[] = [
      { id: "active", label: "Show active only", checked: false },
    ];
    const mockFilterChange = jest.fn();
    const mockFilterReset = jest.fn();

    render(
      <FilterableDataTable
        columns={columns}
        data={mockData}
        filterOptions={filterOptions}
        onFilterChange={mockFilterChange}
        onFilterReset={mockFilterReset}
        showFilter={false}
      />
    );

    expect(screen.queryByText("Filters")).not.toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(<FilterableDataTable columns={columns} data={[]} />);
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("renders with multiple filter options", () => {
    const filterOptions: FilterOption[] = [
      { id: "option1", label: "Option One", checked: false },
      { id: "option2", label: "Option Two", checked: true },
    ];
    const mockFilterChange = jest.fn();
    const mockFilterReset = jest.fn();

    render(
      <FilterableDataTable
        columns={columns}
        data={mockData}
        filterOptions={filterOptions}
        onFilterChange={mockFilterChange}
        onFilterReset={mockFilterReset}
      />
    );

    expect(screen.getByText("Option One")).toBeInTheDocument();
    expect(screen.getByText("Option Two")).toBeInTheDocument();
  });

  it("shows CSV export button when enabled", () => {
    render(
      <FilterableDataTable
        columns={columns}
        data={mockData}
        exportToCSV
        csvFileName="test.csv"
      />
    );

    expect(screen.getByText("Export CSV")).toBeInTheDocument();
  });
});
