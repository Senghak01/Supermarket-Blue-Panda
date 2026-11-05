import { apiClient } from './client';
import { InitiatePaymentRequest, PaymentResponse } from '../types';

export const paymentsApi = {
  initiatePayment: async (orderId: number, req: InitiatePaymentRequest): Promise<PaymentResponse> => {
    const res = await apiClient.post<PaymentResponse>(`/orders/${orderId}/payments`, req);
    return res.data;
  },

  checkPaymentStatus: async (paymentId: number): Promise<PaymentResponse> => {
    const res = await apiClient.post<PaymentResponse>(`/payments/${paymentId}/check`);
    return res.data;
  },

  sandboxConfirm: async (paymentId: number): Promise<PaymentResponse> => {
    const res = await apiClient.post<PaymentResponse>(`/payments/${paymentId}/sandbox-confirm`);
    return res.data;
  },
};
