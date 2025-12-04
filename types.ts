
export type TransactionType = 'EXPENSE' | 'INCOME';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string; // ISO 8601 YYYY-MM-DD
  createdAt: number;
}

export interface SummaryStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY',
  CALENDAR = 'CALENDAR',
  DAY_DETAIL = 'DAY_DETAIL',
  ADD = 'ADD',
  SETTINGS = 'SETTINGS',
  REPORT = 'REPORT'
}