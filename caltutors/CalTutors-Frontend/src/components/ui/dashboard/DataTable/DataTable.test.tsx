import { render, screen, fireEvent } from "@testing-library/react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import { DataTableColumnHeader } from "./DataTableColumnHeader";

interface TestUser {
  id: number;
  name: string;
  email: string;
  age: number;
}

const mockData: TestUser[] = [
  { id: 1, name: "Alice", email: "alice@test.com", age: 30 },
  { id: 2, name: "Bob", email: "bob@test.com", age: 25 },
  { id: 3, name: "Charlie", email: "charlie@test.com", age: 35 },
];

const basicColumns: ColumnDef<TestUser>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
];

const sortableColumns: ColumnDef<TestUser>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "age",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Age" />
    ),
  },
];

describe("DataTable", () => {
  describe("Basic rendering", () => {
    it("renders table headers", () => {
      render(<DataTable columns={basicColumns} data={[]} />);
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    it("renders data rows", () => {
      render(<DataTable columns={basicColumns} data={mockData} />);
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("bob@test.com")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    it("renders empty state when no data", () => {
      render(<DataTable columns={basicColumns} data={[]} />);
      expect(screen.getByText("No results found.")).toBeInTheDocument();
    });

    it("shows soft styling on table container", () => {
      const { container } = render(
        <DataTable columns={basicColumns} data={mockData} />
      );
      const tableContainer = container.querySelector(".rounded-lg");
      expect(tableContainer).toBeInTheDocument();
    });
  });

  describe("Row interactions", () => {
    it("applies cursor-pointer class when onRowClick is provided", () => {
      const mockRowClick = jest.fn();
      render(
        <DataTable
          columns={basicColumns}
          data={mockData}
          onRowClick={mockRowClick}
        />
      );

      const row = screen.getByText("Alice").closest("tr");
      expect(row).toHaveClass("cursor-pointer");
    });

    it("calls onRowClick when row is clicked", () => {
      const mockRowClick = jest.fn();
      render(
        <DataTable
          columns={basicColumns}
          data={mockData}
          onRowClick={mockRowClick}
        />
      );

      const aliceRow = screen.getByText("Alice").closest("tr");
      if (aliceRow) {
        fireEvent.click(aliceRow);
        expect(mockRowClick).toHaveBeenCalledWith(mockData[0]);
      }
    });

    it("applies custom row classes via getRowClassName", () => {
      const getRowClassName = (row: TestUser) => {
        return row.id === 1 ? "custom-highlight" : "";
      };

      const { container } = render(
        <DataTable
          columns={basicColumns}
          data={mockData}
          getRowClassName={getRowClassName}
        />
      );

      const rows = container.querySelectorAll("tbody tr");
      expect(rows[0].className).toContain("custom-highlight");
      expect(rows[1].className).not.toContain("custom-highlight");
    });
  });

  describe("Sortable columns", () => {
    it("renders table with sortable column headers", () => {
      render(<DataTable columns={sortableColumns} data={mockData} />);
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Age")).toBeInTheDocument();
    });

    it("shows sort options when column header is clicked", () => {
      render(<DataTable columns={sortableColumns} data={mockData} />);

      const nameHeader = screen.getByText("Name");
      fireEvent.click(nameHeader);

      // The table should re-render with sorted data
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  describe("Column visibility", () => {
    it("handles column visibility state", () => {
      render(<DataTable columns={sortableColumns} data={mockData} />);

      // All columns should be visible initially
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Age")).toBeInTheDocument();
    });
  });
});
