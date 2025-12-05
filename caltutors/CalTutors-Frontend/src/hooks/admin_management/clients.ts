import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientService } from "@/services/admin_management";
import { AdminUser } from "@/types/admin_management";
import { adminKeys } from "./keys";

export function useAdminClients() {
  return useQuery({
    queryKey: adminKeys.clients(),
    queryFn: () => clientService.getClients(),
  });
}

export function useAdminClient(
  clientId: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: adminKeys.client(clientId),
    queryFn: () => clientService.getClient(clientId),
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateAdminClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: number;
      data: Partial<AdminUser>;
    }) => clientService.updateClient(clientId, data),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.clients() });
      queryClient.invalidateQueries({ queryKey: adminKeys.client(clientId) });
    },
  });
}

export function usePatchAdminClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: number;
      data: Partial<AdminUser>;
    }) => clientService.patchClient(clientId, data),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.clients() });
      queryClient.invalidateQueries({ queryKey: adminKeys.client(clientId) });
    },
  });
}

export function useDeleteAdminClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: number) => clientService.deleteClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.clients() });
    },
  });
}
