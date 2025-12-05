import { transport } from "@/services/transport";
import { AdminUser, ClientsResponse } from "@/types/admin_management";

export class ClientService {
  public async getClients(): Promise<AdminUser[]> {
    return transport.axios
      .get<ClientsResponse>("/admin/clients/")
      .then((res) => res.data.clients || []);
  }

  public async getClient(clientId: number): Promise<AdminUser> {
    return transport.axios
      .get<AdminUser>(`/admin/clients/${clientId}/`)
      .then((res) => res.data);
  }

  public async updateClient(
    clientId: number,
    data: Partial<AdminUser>
  ): Promise<AdminUser> {
    return transport.axios
      .put<AdminUser>(`/admin/clients/${clientId}/`, data)
      .then((res) => res.data);
  }

  public async patchClient(
    clientId: number,
    data: Partial<AdminUser>
  ): Promise<AdminUser> {
    return transport.axios
      .patch<AdminUser>(`/admin/clients/${clientId}/`, data)
      .then((res) => res.data);
  }

  public async deleteClient(clientId: number): Promise<void> {
    return transport.axios
      .delete(`/admin/clients/${clientId}/`)
      .then((res) => res.data);
  }
}

export const clientService = new ClientService();
