import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { ArrowLeft, Plus } from 'lucide-react';
import { TransactionList } from './TransactionList';

interface Props {
  date: string;
  transactions: Transaction[];
  onBack: () => void;
  onAddTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
}

export const DayDetailView: React.FC<Props> = ({
  date,
  transactions,
  onBack,
  onAddTransaction,
  onDeleteTransaction
}) => {
  const dayTransactions = useMemo(() => {
    return transactions.filter(t => t.date === date).sort((a, b) => b.createdAt - a.createdAt);
  }, [transactions, date]);

  const dailyStats = useMemo(() => {
    const income = dayTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
      count: dayTransactions.length
    };
  }, [dayTransactions]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="retro-btn bg-white p-2 rounded-full hover:bg-gray-100 text-black flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-800">
              {formatDate(date)}
            </h2>
            <p className="text-sm text-gray-600 font-medium">
              共 {dailyStats.count} 条记录
            </p>
          </div>
        </div>

      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="retro-card bg-green-50 border-green-800 p-4">
          <h3 className="text-sm font-bold text-green-800 mb-1">收入</h3>
          <p className="text-2xl font-black text-green-900">
            ¥{dailyStats.income.toFixed(2)}
          </p>
          {dailyStats.income > 0 && (
            <p className="text-xs text-green-700 mt-1">
              {dayTransactions.filter(t => t.type === 'INCOME').length} 笔
            </p>
          )}
        </div>

        <div className="retro-card bg-orange-50 border-orange-800 p-4">
          <h3 className="text-sm font-bold text-orange-800 mb-1">支出</h3>
          <p className="text-2xl font-black text-orange-900">
            ¥{dailyStats.expense.toFixed(2)}
          </p>
          {dailyStats.expense > 0 && (
            <p className="text-xs text-orange-700 mt-1">
              {dayTransactions.filter(t => t.type === 'EXPENSE').length} 笔
            </p>
          )}
        </div>

        <div className={`retro-card ${dailyStats.balance >= 0 ? 'bg-blue-50 border-blue-800' : 'bg-red-50 border-red-800'} p-4`}>
          <h3 className={`text-sm font-bold ${dailyStats.balance >= 0 ? 'text-blue-800' : 'text-red-800'} mb-1`}>
            结余
          </h3>
          <p className={`text-2xl font-black ${dailyStats.balance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
            ¥{dailyStats.balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Transaction List */}
      <div>
        {dayTransactions.length > 0 ? (
          <TransactionList
            transactions={dayTransactions}
            onDelete={onDeleteTransaction}
            enableSearch={false}
          />
        ) : (
          <div className="retro-card bg-gray-50 p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              当天没有记录
            </h3>
            <p className="text-gray-500 mb-4">
              点击上方加号按钮开始记账
            </p>
          </div>
        )}
      </div>
    </div>
  );
};