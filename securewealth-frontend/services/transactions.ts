import api from './api';

export const transactionService = {
  list: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
    from_date?: string;
    to_date?: string;
  }) => api.get('/transactions', { params }),

  summary: () => api.get('/transactions/summary'),
};
