import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';
import { Save, X, Tag } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils';
import { CustomSelect } from './CustomSelect';
import { FixedDatePicker } from './FixedDatePicker';

interface Props {
  transaction: Transaction;
  onSave: (transaction: Transaction) => void;
  onCancel: () => void;
}

export const EditTransaction: React.FC<Props> = ({ transaction, onSave, onCancel }) => {
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description);

  // Update category when type changes
  useEffect(() => {
    if (type === 'EXPENSE' && !EXPENSE_CATEGORIES.includes(category)) {
      setCategory(EXPENSE_CATEGORIES[0]);
    } else if (type === 'INCOME' && !INCOME_CATEGORIES.includes(category)) {
      setCategory(INCOME_CATEGORIES[0]);
    }
  }, [type, category]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !category || !date) return;

    const updatedTransaction: Transaction = {
      ...transaction,
      type,
      amount: parseFloat(amount),
      category,
      date,
      description: description || category,
      updatedAt: Date.now(),
    };

    onSave(updatedTransaction);
  };

  const availableCategories = type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-[9997] flex items-center justify-center p-4 bg-yellow-200/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg relative animate-in zoom-in-95 duration-300">
        <button
          onClick={onCancel}
          className="absolute -top-12 right-0 md:-right-12 w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_black] hover:scale-110 transition-transform cursor-pointer z-50 text-black"
          aria-label="关闭编辑"
        >
          <X className="w-6 h-6" strokeWidth={2.5} />
        </button>

        <div className="retro-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-200 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_black]">
              <Tag className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-lg font-black text-gray-800">编辑交易记录</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex bg-gray-100 p-1 rounded-lg border-2 border-black">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all border-2 ${
                  type === 'EXPENSE'
                    ? 'bg-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all border-2 ${
                  type === 'INCOME'
                    ? 'bg-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                收入
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">金额</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-900 font-bold text-sm">¥</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border-2 border-black rounded-md text-sm font-bold bg-white text-black focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">日期</label>
                <FixedDatePicker
                  value={date}
                  onChange={setDate}
                  placeholder="选择日期"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">分类</label>
              <CustomSelect
                value={category}
                onChange={setCategory}
                options={availableCategories}
                placeholder="选择分类"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">备注 (选填)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="买了什么..."
                className="w-full px-2 py-1.5 border-2 border-black rounded-md text-sm bg-white text-black focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border-2 border-black rounded-md hover:bg-gray-50 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none transition-all"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-purple-600 border-2 border-black rounded-md hover:bg-purple-700 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none transition-all"
              >
                <Save className="w-3 h-3" />
                保存修改
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};