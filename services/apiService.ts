import { Transaction } from '../types';

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const res = await fetch('/api/transactions');
  if (!res.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return res.json();
};

export const createTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  });
  if (!res.ok) {
    throw new Error('Failed to create transaction');
  }
  return res.json();
};

export const updateTransaction = async (transaction: Transaction): Promise<Transaction> => {
  const res = await fetch(`/api/transactions/${transaction.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  });
  if (!res.ok) {
    throw new Error('Failed to update transaction');
  }
  return res.json();
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const res = await fetch(`/api/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete transaction');
  }
};

export const fetchAIReport = async (type: 'weekly' | 'monthly', date: string): Promise<{ report: string }> => {
  const res = await fetch('/api/ai/report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, date }),
  });
  if (!res.ok) {
    throw new Error('Failed to generate report');
  }
  return res.json();
};
