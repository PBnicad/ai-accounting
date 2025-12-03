
import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Trash2, ShoppingCart, Coffee, Car, Home, Stethoscope, Briefcase, DollarSign, CreditCard, Search, Tag, Edit } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  enableSearch?: boolean;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case '餐饮': return <Coffee className="w-5 h-5" />;
    case '购物': return <ShoppingCart className="w-5 h-5" />;
    case '交通': return <Car className="w-5 h-5" />;
    case '居住': return <Home className="w-5 h-5" />;
    case '医疗': return <Stethoscope className="w-5 h-5" />;
    case '工资': return <Briefcase className="w-5 h-5" />;
    case '奖金': return <DollarSign className="w-5 h-5" />;
    default: return <CreditCard className="w-5 h-5" />;
  }
};

export const TransactionList: React.FC<Props> = ({ transactions, onDelete, onEdit, enableSearch = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter transactions based on search term (fuzzy-ish)
  const filteredTransactions = transactions.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.description.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term) ||
      formatCurrency(t.amount).includes(term) ||
      t.date.includes(term)
    );
  });

  // Group by date
  const grouped = filteredTransactions.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Sort dates descending
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-6">
      {enableSearch && (
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 border-2 border-black rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow sm:text-sm font-medium"
            placeholder="搜索类别、备注或金额..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 retro-card border-dashed border-gray-400 bg-gray-50">
          <div className="bg-gray-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-black">
             <Search className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-500 font-medium">{searchTerm ? '哎呀，没找到相关记录' : '还没有记账哦，快去记一笔吧！'}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(date => (
            <div key={date} className="relative">
              <div className="sticky top-0 z-0 flex items-center mb-3">
                 <div className="bg-black text-white px-3 py-1 rounded-md text-xs font-bold shadow-[2px_2px_0px_0px_rgba(100,100,100,1)] transform -rotate-2">
                    {formatDate(date)}
                 </div>
                 <div className="h-0.5 bg-gray-300 flex-1 ml-2 rounded-full"></div>
              </div>
              
              <div className="space-y-3">
                {grouped[date].map(t => (
                  <div key={t.id} className="group relative bg-white border-2 border-black rounded-xl p-4 shadow-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                          t.type === 'INCOME' ? 'bg-cyan-100 text-cyan-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                        {getCategoryIcon(t.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{t.category}</p>
                          {t.type === 'INCOME' ? (
                             <span className="text-[10px] bg-cyan-100 border border-black px-1 rounded text-cyan-800 font-bold">收入</span>
                          ) : null}
                        </div>
                        <p className="text-sm text-gray-500 font-medium max-w-[150px] md:max-w-xs truncate flex items-center">
                          <Tag className="w-3 h-3 mr-1 opacity-50"/> {t.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-black text-lg ${t.type === 'INCOME' ? 'text-cyan-600' : 'text-gray-900'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                      <button
                        onClick={() => onEdit(t)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-black bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-all"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(t.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-black bg-white text-gray-700 hover:bg-red-100 hover:text-red-700 transition-all"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
