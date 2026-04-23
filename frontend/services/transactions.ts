import { apiRequest } from "@/services/http";

export interface TransactionItem {
  id: string;
  amount: number;
  type: string;
  category: string;
  merchant: string;
  description: string;
  timestamp: string;
  running_balance: number;
  source: string;
}

export interface ListTransactionsResponse {
  items: TransactionItem[];
  page: number;
  limit: number;
  total: number;
}

export interface TransactionsSummary {
  current_month: {
    month: string;
    spend: number;
  };
  by_category: Array<{ category: string; amount: number }>;
  monthly_trend: Array<{ month: string; amount: number }>;
  spending_patterns: string[];
}

interface ListParams {
  page?: number;
  limit?: number;
  category?: string;
  type?: string;
  from_date?: string;
  to_date?: string;
}

const toQuery = (params: ListParams): string => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== "");
  if (entries.length === 0) {
    return "";
  }

  const query = new URLSearchParams();
  for (const [key, value] of entries) {
    query.append(key, String(value));
  }

  return `?${query.toString()}`;
};

export const transactionsService = {
  list: (params: ListParams = {}) =>
    apiRequest<ListTransactionsResponse>(`/transactions${toQuery(params)}`),

  summary: () => apiRequest<TransactionsSummary>("/transactions/summary"),
};
