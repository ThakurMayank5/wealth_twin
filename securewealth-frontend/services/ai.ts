import api from './api';

export const aiService = {
  getRecommendations: () => api.get('/ai/recommendations'),

  chat: (message: string) => api.post('/ai/chat', { message }),
};
