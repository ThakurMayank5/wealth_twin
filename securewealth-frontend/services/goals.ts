import api from './api';

export const goalService = {
  list: () => api.get('/goals'),

  create: (data: {
    name: string;
    goal_type: string;
    target_amount: number;
    target_date: string;
    monthly_contribution: number;
  }) => api.post('/goals', data),

  getProjection: (goalId: string) =>
    api.get(`/goals/${goalId}/projection`),
};
