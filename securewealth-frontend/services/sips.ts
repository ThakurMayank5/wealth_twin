import api from './api';

export const sipService = {
  create: (data: {
    fund_id: string;
    fund_name: string;
    amount: number;
    frequency?: string;
    start_date: string;
    is_first_time_fund?: boolean;
  }) => api.post('/sips', data),

  update: (id: string, data: {
    amount: number;
    frequency?: string;
    next_due_date?: string;
  }) => api.put(`/sips/${id}`, data),

  delete: (id: string) => api.delete(`/sips/${id}`),

  confirm: (confirmationToken: string) =>
    api.post('/sips/confirm', { confirmation_token: confirmationToken }),
};
