import { apiRequest } from "@/services/http";

export interface DashboardGoal {
  id: string;
  name: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  monthly_contribution: number;
  status: string;
}

export interface WealthDashboard {
  net_worth: number;
  liquid_assets: number;
  monthly_savings_rate: number;
  active_sips: number;
  sip_total_monthly: number;
  goals: DashboardGoal[];
  alerts: string[];
  top_recommendations: string[];
  wealth_protection_status: string;
}

export interface NetWorthBreakdownItem {
  asset_type: string;
  value: number;
}

export interface NetWorthResponse {
  total_net_worth: number;
  breakdown: NetWorthBreakdownItem[];
}

export const wealthService = {
  getDashboard: () => apiRequest<WealthDashboard>("/wealth/dashboard"),
  getNetWorth: () => apiRequest<NetWorthResponse>("/wealth/net-worth"),
};
