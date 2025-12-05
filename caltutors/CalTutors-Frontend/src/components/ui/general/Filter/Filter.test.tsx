import { render, screen, fireEvent } from "@testing-library/react";
import { Filter, FilterOption } from "./Filter";

const mockOptions: FilterOption[] = [
  {
    id: "option1",
    label: "Option One",
    checked: false,
  },
  {
    id: "option2",
    label: "Option Two",
    checked: false,
  },
];

describe("Filter", () => {
  const mockOnOptionChange = jest.fn();
  const mockOnReset = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders filter with all options", () => {
    render(
      <Filter
        options={mockOptions}
        onOptionChange={mockOnOptionChange}
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByText("Option One")).toBeInTheDocument();
    expect(screen.getByText("Option Two")).toBeInTheDocument();
  });

  it("calls onOptionChange when checkbox is clicked", () => {
    render(
      <Filter
        options={mockOptions}
        onOptionChange={mockOnOptionChange}
        onReset={mockOnReset}
      />
    );

    const checkbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(checkbox);

    expect(mockOnOptionChange).toHaveBeenCalledWith("option1", true);
  });

  it("shows reset button when filters are active", () => {
    const activeOptions: FilterOption[] = [
      {
        id: "option1",
        label: "Option One",
        checked: true,
      },
    ];

    render(
      <Filter
        options={activeOptions}
        onOptionChange={mockOnOptionChange}
        onReset={mockOnReset}
      />
    );

    const resetButton = screen.getByRole("button");
    expect(resetButton).toBeInTheDocument();
  });

  it("does not show reset button when no filters are active", () => {
    render(
      <Filter
        options={mockOptions}
        onOptionChange={mockOnOptionChange}
        onReset={mockOnReset}
      />
    );

    const resetButton = screen.queryByRole("button");
    expect(resetButton).not.toBeInTheDocument();
  });

  it("calls onReset when reset button is clicked", () => {
    const activeOptions: FilterOption[] = [
      {
        id: "option1",
        label: "Option One",
        checked: true,
      },
    ];

    render(
      <Filter
        options={activeOptions}
        onOptionChange={mockOnOptionChange}
        onReset={mockOnReset}
      />
    );

    const resetButton = screen.getByRole("button");
    fireEvent.click(resetButton);

    expect(mockOnReset).toHaveBeenCalled();
  });

  it("hides reset button when showReset is false", () => {
    const activeOptions: FilterOption[] = [
      {
        id: "option1",
        label: "Option One",
        checked: true,
      },
    ];

    render(
      <Filter
        options={activeOptions}
        onOptionChange={mockOnOptionChange}
        onReset={mockOnReset}
        showReset={false}
      />
    );

    const resetButton = screen.queryByRole("button");
    expect(resetButton).not.toBeInTheDocument();
  });

  it("renders checked checkboxes correctly", () => {
    const checkedOptions: FilterOption[] = [
      {
        id: "option1",
        label: "Option One",
        checked: true,
      },
      {
        id: "option2",
        label: "Option Two",
        checked: false,
      },
    ];

    render(
      <Filter
        options={checkedOptions}
        onOptionChange={mockOnOptionChange}
        onReset={mockOnReset}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it("renders with multiple options", () => {
    const multipleOptions: FilterOption[] = [
      { id: "opt1", label: "First", checked: false },
      { id: "opt2", label: "Second", checked: false },
      { id: "opt3", label: "Third", checked: false },
    ];

    render(
      <Filter
        options={multipleOptions}
        onOptionChange={mockOnOptionChange}
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });
});
