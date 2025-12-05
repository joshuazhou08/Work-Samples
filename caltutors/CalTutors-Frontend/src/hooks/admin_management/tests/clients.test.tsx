import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  useAdminClients,
  useAdminClient,
  useUpdateAdminClient,
  usePatchAdminClient,
  useDeleteAdminClient,
} from "../clients";
import { clientService } from "@/services/admin_management";
import { adminKeys } from "../keys";

// Mock the service
jest.mock("@/services/admin_management");

const mockClientService = clientService as jest.Mocked<typeof clientService>;

describe("clients hooks", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useAdminClients", () => {
    it("calls the correct service method", async () => {
      const mockClients = [{ id: 1, email: "client@test.com" }];
      mockClientService.getClients.mockResolvedValue(mockClients as any);

      renderHook(() => useAdminClients(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockClientService.getClients).toHaveBeenCalled();
      });
    });
  });

  describe("useAdminClient", () => {
    it("calls the correct service method", async () => {
      const mockClient = { id: 10, email: "client@test.com" };
      mockClientService.getClient.mockResolvedValue(mockClient as any);

      renderHook(() => useAdminClient(10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockClientService.getClient).toHaveBeenCalledWith(10);
      });
    });

    it("respects enabled option when false", () => {
      mockClientService.getClient.mockResolvedValue({} as any);

      const { result } = renderHook(
        () => useAdminClient(10, { enabled: false }),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(false);
      expect(mockClientService.getClient).not.toHaveBeenCalled();
    });

    it("is enabled by default", async () => {
      const mockClient = { id: 10, email: "client@test.com" };
      mockClientService.getClient.mockResolvedValue(mockClient as any);

      renderHook(() => useAdminClient(10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockClientService.getClient).toHaveBeenCalledWith(10);
      });
    });
  });

  describe("useUpdateAdminClient", () => {
    it("invalidates both clients list and specific client query keys on success", async () => {
      const mockUpdatedClient = { id: 2, email: "updated@test.com" };
      mockClientService.updateClient.mockResolvedValue(
        mockUpdatedClient as any
      );

      const wrapper = createWrapper();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateAdminClient(), { wrapper });

      await result.current.mutateAsync({
        clientId: 2,
        data: { email: "updated@test.com" },
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: adminKeys.clients(),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: adminKeys.client(2),
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it("calls the correct service method", async () => {
      const mockUpdatedClient = { id: 2, email: "updated@test.com" };
      mockClientService.updateClient.mockResolvedValue(
        mockUpdatedClient as any
      );

      const { result } = renderHook(() => useUpdateAdminClient(), {
        wrapper: createWrapper(),
      });

      const updateData = { email: "updated@test.com" };

      await result.current.mutateAsync({
        clientId: 2,
        data: updateData,
      });

      expect(mockClientService.updateClient).toHaveBeenCalledWith(
        2,
        updateData
      );
    });
  });

  describe("usePatchAdminClient", () => {
    it("invalidates both clients list and specific client query keys on success", async () => {
      const mockPatchedClient = { id: 4, email: "patched@test.com" };
      mockClientService.patchClient.mockResolvedValue(mockPatchedClient as any);

      const wrapper = createWrapper();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => usePatchAdminClient(), { wrapper });

      await result.current.mutateAsync({
        clientId: 4,
        data: { first_name: "Patched" },
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: adminKeys.clients(),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: adminKeys.client(4),
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it("calls the correct service method", async () => {
      const mockPatchedClient = { id: 4, email: "patched@test.com" };
      mockClientService.patchClient.mockResolvedValue(mockPatchedClient as any);

      const { result } = renderHook(() => usePatchAdminClient(), {
        wrapper: createWrapper(),
      });

      const patchData = { first_name: "Patched" };

      await result.current.mutateAsync({
        clientId: 4,
        data: patchData,
      });

      expect(mockClientService.patchClient).toHaveBeenCalledWith(4, patchData);
    });
  });

  describe("useDeleteAdminClient", () => {
    it("invalidates only the clients list query key on success", async () => {
      mockClientService.deleteClient.mockResolvedValue(undefined as any);

      const wrapper = createWrapper();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteAdminClient(), { wrapper });

      await result.current.mutateAsync(8);

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: adminKeys.clients(),
        });
      });

      // Should only invalidate the clients list, not individual client queries
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(1);
    });

    it("calls the correct service method", async () => {
      mockClientService.deleteClient.mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useDeleteAdminClient(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(8);

      expect(mockClientService.deleteClient).toHaveBeenCalledWith(8);
    });
  });
});
