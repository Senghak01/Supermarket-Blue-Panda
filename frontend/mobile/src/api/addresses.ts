import { apiClient } from './client';
import { AddressResponse, CreateAddressRequest, UpdateAddressRequest } from '../types';

export const addressApi = {
  getAddresses: async (): Promise<AddressResponse[]> => {
    const res = await apiClient.get<AddressResponse[]>('/addresses');
    return res.data;
  },

  createAddress: async (req: CreateAddressRequest): Promise<AddressResponse> => {
    const res = await apiClient.post<AddressResponse>('/addresses', req);
    return res.data;
  },

  updateAddress: async (addressId: number, req: UpdateAddressRequest): Promise<AddressResponse> => {
    const res = await apiClient.put<AddressResponse>(`/addresses/${addressId}`, req);
    return res.data;
  },

  setDefaultAddress: async (addressId: number): Promise<void> => {
    await apiClient.put(`/addresses/${addressId}/default`);
  },

  deleteAddress: async (addressId: number): Promise<void> => {
    await apiClient.delete(`/addresses/${addressId}`);
  },
};

