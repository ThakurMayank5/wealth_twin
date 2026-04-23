import { apiRequest } from "@/services/http";

export interface UserProfile {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  kyc_status: string;
  risk_appetite: string;
  avg_monthly_income: number;
  avg_monthly_spend: number;
  account_balance: number;
  consent_given: boolean;
  created_at: string;
  updated_at: string;
}

export interface RiskEvent {
  id: string;
  action_type: string;
  risk_score: number;
  decision: string;
  created_at: string;
}

interface RiskEventsResponse {
  items: RiskEvent[];
  page: number;
  limit: number;
  total: number;
}

export const userService = {
  getProfile: () => apiRequest<{ profile: UserProfile }>("/user/profile"),

  updateRiskProfile: (payload: {
    risk_appetite: string;
    monthly_income: number;
    monthly_expenses: number;
  }) =>
    apiRequest<{ success: boolean }>("/user/risk-profile", {
      method: "PUT",
      body: payload,
    }),

  getSecurityEvents: (params?: { page?: number; limit?: number }) => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    return apiRequest<RiskEventsResponse>(`/security/events?page=${page}&limit=${limit}`);
  },
};
