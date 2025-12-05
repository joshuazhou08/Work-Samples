import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { EditRateForm } from "./EditRateForm";
import { adminKeys } from "@/hooks/admin_management";

// Setup MSW server
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("EditRateForm", () => {
  const mockRate = {
    id: 1,
    student_rate: "60.00",
    tutor_pay_rate: "40.00",
    student: 5,
    tutor: 3,
  };

  const mockOnClose = jest.fn();
  const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
  const mockOnDelete = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering and Interactions", () => {
    it("renders form with rate data and allows editing", () => {
      render(
        <EditRateForm
          isOpen={true}
          onClose={mockOnClose}
          rate={mockRate}
          userName="John Doe"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          isUpdating={false}
          isDeleting={false}
        />
      );

      expect(screen.getByText("Edit Rate - John Doe")).toBeInTheDocument();
      expect(screen.getByLabelText("Student Rate ($/hr)")).toHaveValue(60);
      expect(screen.getByLabelText("Tutor Pay Rate ($/hr)")).toHaveValue(40);
      expect(screen.getByText("Update")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();

      // Test editing
      const studentRateInput = screen.getByLabelText("Student Rate ($/hr)");
      fireEvent.change(studentRateInput, { target: { value: "70.00" } });
      expect(studentRateInput).toHaveValue(70);
    });

    it("does not render when isOpen is false", () => {
      render(
        <EditRateForm
          isOpen={false}
          onClose={mockOnClose}
          rate={mockRate}
          userName="John Doe"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          isUpdating={false}
          isDeleting={false}
        />
      );

      expect(
        screen.queryByText("Edit Rate - John Doe")
      ).not.toBeInTheDocument();
    });

    it("updates form when rate prop changes", () => {
      const { rerender } = render(
        <EditRateForm
          isOpen={true}
          onClose={mockOnClose}
          rate={mockRate}
          userName="John Doe"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          isUpdating={false}
          isDeleting={false}
        />
      );

      const updatedRate = {
        ...mockRate,
        student_rate: "80.00",
        tutor_pay_rate: "55.00",
      };

      rerender(
        <EditRateForm
          isOpen={true}
          onClose={mockOnClose}
          rate={updatedRate}
          userName="John Doe"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          isUpdating={false}
          isDeleting={false}
        />
      );

      expect(screen.getByLabelText("Student Rate ($/hr)")).toHaveValue(80);
      expect(screen.getByLabelText("Tutor Pay Rate ($/hr)")).toHaveValue(55);
    });
  });

  describe("Update Functionality", () => {
    it("calls onUpdate with new values and closes", async () => {
      render(
        <EditRateForm
          isOpen={true}
          onClose={mockOnClose}
          rate={mockRate}
          userName="John Doe"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          isUpdating={false}
          isDeleting={false}
        />
      );

      const studentRateInput = screen.getByLabelText("Student Rate ($/hr)");
      fireEvent.change(studentRateInput, { target: { value: "70.00" } });
      fireEvent.click(screen.getByText("Update"));

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith({
          studentRate: "70.00",
          tutorPayRate: "40.00",
        });
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("shows loading state and disables buttons when updating", () => {
      render(
        <EditRateForm
          isOpen={true}
          onClose={mockOnClose}
          rate={mockRate}
          userName="John Doe"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          isUpdating={true}
          isDeleting={false}
        />
      );

      expect(screen.getByText("Updating...")).toBeInTheDocument();
      expect(screen.getByText("Updating...")).toBeDisabled();
      expect(screen.getByText("Cancel")).toBeDisabled();
      expect(screen.getByText("Delete")).toBeDisabled();
    });
  });

  describe("Delete Functionality", () => {
    it("shows confirmation dialog and calls onDelete when confirmed", async () => {
      render(
        <EditRateForm
          isOpen={true}
          onClose={mockOnClose}
          rate={mockRate}
          userName="John Doe"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          isUpdating={false}
          isDeleting={false}
        />
      );

      fireEvent.click(screen.getByText("Delete"));
      expect(
        screen.getByText(/Are you sure you want to delete/)
      ).toBeInTheDocument();

      const confirmButton = screen.getAllByText("Delete")[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("disables buttons when deleting", () => {
      render(
        <EditRateForm
          isOpen={true}
          onClose={mockOnClose}
          rate={mockRate}
          userName="John Doe"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          isUpdating={false}
          isDeleting={true}
        />
      );

      expect(screen.getByText("Update")).toBeDisabled();
      expect(screen.getByText("Cancel")).toBeDisabled();
      expect(screen.getByText("Delete")).toBeDisabled();
    });
  });

  describe("Integration Tests with MSW", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
    });

    it("invalidates correct query keys on rate update", async () => {
      server.use(
        rest.patch("*/api/admin/rates/:id", (req, res, ctx) => {
          return res(ctx.json({ ...mockRate, student_rate: "70.00" }));
        })
      );

      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const mockOnUpdateWithInvalidation = jest.fn(async (data) => {
        await fetch("/api/admin/rates/1", {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        queryClient.invalidateQueries({ queryKey: adminKeys.rates() });
        queryClient.invalidateQueries({
          queryKey: adminKeys.studentRates(mockRate.student),
        });
        queryClient.invalidateQueries({
          queryKey: adminKeys.tutorRates(mockRate.tutor),
        });
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EditRateForm
            isOpen={true}
            onClose={mockOnClose}
            rate={mockRate}
            userName="John Doe"
            onUpdate={mockOnUpdateWithInvalidation}
            onDelete={mockOnDelete}
            isUpdating={false}
            isDeleting={false}
          />
        </QueryClientProvider>
      );

      const studentRateInput = screen.getByLabelText("Student Rate ($/hr)");
      fireEvent.change(studentRateInput, { target: { value: "70.00" } });
      fireEvent.click(screen.getByText("Update"));

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith(
          expect.objectContaining({ queryKey: adminKeys.rates() })
        );
        expect(invalidateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: adminKeys.studentRates(mockRate.student),
          })
        );
        expect(invalidateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: adminKeys.tutorRates(mockRate.tutor),
          })
        );
        expect(invalidateSpy).toHaveBeenCalledTimes(3);
      });
    });

    it("invalidates only rates list on delete", async () => {
      server.use(
        rest.delete("*/api/admin/rates/:id", (req, res, ctx) => {
          return res(ctx.status(204));
        })
      );

      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const mockOnDeleteWithInvalidation = jest.fn(async () => {
        await fetch("/api/admin/rates/1", { method: "DELETE" });
        queryClient.invalidateQueries({ queryKey: adminKeys.rates() });
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EditRateForm
            isOpen={true}
            onClose={mockOnClose}
            rate={mockRate}
            userName="John Doe"
            onUpdate={mockOnUpdate}
            onDelete={mockOnDeleteWithInvalidation}
            isUpdating={false}
            isDeleting={false}
          />
        </QueryClientProvider>
      );

      fireEvent.click(screen.getByText("Delete"));
      const confirmButton = await screen.findAllByText("Delete");
      fireEvent.click(confirmButton[1]);

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith(
          expect.objectContaining({ queryKey: adminKeys.rates() })
        );
        expect(invalidateSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
