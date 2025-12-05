import { render, screen, fireEvent } from "@testing-library/react";
import { Column } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./DataTableColumnHeader";

const mockColumn = {
  getCanSort: jest.fn(() => true),
  getIsSorted: jest.fn(() => false),
  toggleSorting: jest.fn(),
} as unknown as Column<any, any>;

describe("DataTableColumnHeader", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders title when column cannot be sorted", () => {
    const nonSortableColumn = {
      ...mockColumn,
      getCanSort: jest.fn(() => false),
    } as unknown as Column<any, any>;

    render(<DataTableColumnHeader column={nonSortableColumn} title="Name" />);
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("renders sortable header button", () => {
    render(<DataTableColumnHeader column={mockColumn} title="Email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows ascending sort icon when sorted asc", () => {
    const ascColumn = {
      ...mockColumn,
      getIsSorted: jest.fn(() => "asc"),
    } as unknown as Column<any, any>;

    render(<DataTableColumnHeader column={ascColumn} title="Name" />);
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("shows descending sort icon when sorted desc", () => {
    const descColumn = {
      ...mockColumn,
      getIsSorted: jest.fn(() => "desc"),
    } as unknown as Column<any, any>;

    render(<DataTableColumnHeader column={descColumn} title="Name" />);
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("calls toggleSorting when header is clicked", () => {
    render(<DataTableColumnHeader column={mockColumn} title="Name" />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockColumn.toggleSorting).toHaveBeenCalledWith(false);
  });

  it("toggles between sort states on click", () => {
    const ascColumn = {
      ...mockColumn,
      getIsSorted: jest.fn(() => "asc"),
    } as unknown as Column<any, any>;

    render(<DataTableColumnHeader column={ascColumn} title="Name" />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(ascColumn.toggleSorting).toHaveBeenCalledWith(true);
  });
});
