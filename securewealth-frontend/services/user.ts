import api from './api';

export const userService = {
  getProfile: () => api.get('/user/profile'),

  updateRiskProfile: (data: {
    risk_appetite: string;
    monthly_income: number;
    monthly_expenses: number;
  }) => api.put('/user/risk-profile', data),
};

export const securityService = {
  getEvents: (params?: { page?: number; limit?: number }) =>
    api.get('/security/events', { params }),

  evaluateAction: (data: {
    action_type: string;
    amount?: number;
    metadata?: Record<string, any>;
  }) => api.post('/security/evaluate-action', data),
};
