import React from 'react';
import { SummaryStats } from '../types';
import { formatCurrency } from '../utils';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface Props {
  stats: SummaryStats;
}

export const SummaryCards: React.FC<Props> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Balance */}
      <div className="retro-card p-6 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200 rounded-full translate-x-8 -translate-y-8 opacity-50 group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-4 z-10">
          <div className="bg-yellow-400 border-2 border-black p-3 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform">
            <Wallet className="w-6 h-6 text-black" />
          </div>
          <span className="text-sm font-bold bg-black text-white px-3 py-1 rounded-full">净资产</span>
        </div>
        <div>
           <h3 className="text-3xl font-black text-gray-900 tracking-tight">{formatCurrency(stats.balance)}</h3>
           <p className="text-gray-500 font-medium text-sm mt-1">总余额</p>
        </div>
      </div>

      {/* Income */}
      <div className="retro-card p-6 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-200 rounded-full translate-x-8 -translate-y-8 opacity-50 group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-4 z-10">
          <div className="bg-cyan-400 border-2 border-black p-3 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:-rotate-12 transition-transform">
            <TrendingUp className="w-6 h-6 text-black" />
          </div>
           <span className="text-sm font-bold bg-cyan-100 text-cyan-800 border-2 border-black px-3 py-1 rounded-full">收入</span>
        </div>
        <div>
           <h3 className="text-3xl font-black text-gray-900 tracking-tight">{formatCurrency(stats.totalIncome)}</h3>
           <p className="text-gray-500 font-medium text-sm mt-1">本月入账</p>
        </div>
      </div>

      {/* Expense */}
      <div className="retro-card p-6 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200 rounded-full translate-x-8 -translate-y-8 opacity-50 group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-4 z-10">
          <div className="bg-orange-400 border-2 border-black p-3 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform">
            <TrendingDown className="w-6 h-6 text-black" />
          </div>
          <span className="text-sm font-bold bg-orange-100 text-orange-800 border-2 border-black px-3 py-1 rounded-full">支出</span>
        </div>
        <div>
           <h3 className="text-3xl font-black text-gray-900 tracking-tight">{formatCurrency(stats.totalExpense)}</h3>
           <p className="text-gray-500 font-medium text-sm mt-1">本月花销</p>
        </div>
      </div>
    </div>
  );
};