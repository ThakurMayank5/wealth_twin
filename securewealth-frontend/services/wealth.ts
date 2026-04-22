import api from './api';

export const wealthService = {
  getDashboard: () => api.get('/wealth/dashboard'),
  getNetWorth: () => api.get('/wealth/net-worth'),
  addAsset: (data: {
    asset_type: string;
    name: string;
    current_value: number;
    purchase_value?: number;
    purchase_date?: string;
    metadata?: Record<string, any>;
  }) => api.post('/wealth/assets', data),
};
