
import React, { useState, useRef } from 'react';
import { generateId, getTodayStr } from '../utils';
import { Transaction, TransactionType } from '../types';
import { ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';
import { Sparkles, Plus, Loader2, Image as ImageIcon, Upload, X } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { FixedDatePicker } from './FixedDatePicker';

interface Props {
  onAdd: (transaction: Transaction) => void;
  onCancel: () => void;
  defaultDate?: string;
}

export const AddTransaction: React.FC<Props> = ({ onAdd, onCancel, defaultDate }) => {
  const [mode, setMode] = useState<'AI_TEXT' | 'AI_IMAGE' | 'MANUAL'>('MANUAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Text State
  const [aiInput, setAiInput] = useState('');

  // AI Image State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Form State
  const [manualType, setManualType] = useState<TransactionType>('EXPENSE');
  const [manualAmount, setManualAmount] = useState('');
  const [manualCategory, setManualCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [manualDate, setManualDate] = useState(defaultDate || getTodayStr());
  const [manualDesc, setManualDesc] = useState('');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAmount || !manualCategory || !manualDate) return;

    const newTransaction: Transaction = {
      id: generateId(),
      amount: parseFloat(manualAmount),
      type: manualType,
      category: manualCategory,
      description: manualDesc || manualCategory,
      date: manualDate,
      createdAt: Date.now(),
    };
    onAdd(newTransaction);
  };

  const processTransaction = (parsed: any) => {
    // 如果是数组，处理每个交易记录
    if (Array.isArray(parsed)) {
      parsed.forEach((transaction) => {
        const newTransaction: Transaction = {
          id: generateId(),
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          description: transaction.description || '智能记账',
          date: transaction.date,
          createdAt: Date.now(),
        };
        onAdd(newTransaction);
      });
    } else {
      // 单个交易记录
      const newTransaction: Transaction = {
        id: generateId(),
        amount: parsed.amount,
        type: parsed.type,
        category: parsed.category,
        description: parsed.description || '智能记账',
        date: parsed.date,
        createdAt: Date.now(),
      };
      onAdd(newTransaction);
    }
  };

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'AI_TEXT' && !aiInput.trim()) return;
    if (mode === 'AI_IMAGE' && !selectedImage) return;

    setLoading(true);
    setError(null);

    try {
      let parsed;
      const payload: any = {};
      
      if (mode === 'AI_TEXT') {
        payload.input = aiInput;
      } else {
        payload.image = selectedImage;
        payload.mimeType = selectedImage!.split(';')[0].split(':')[1];
      }

      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('AI parsing failed');
      }

      parsed = await res.json();

      if (mode === 'AI_TEXT') {
        setAiInput('');
      } else {
        setSelectedImage(null);
        setImageFile(null);
      }
      processTransaction(parsed);
    } catch (err) {
      console.error(err);
      setError('AI 解析失败，请重试或尝试手动输入。');
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="retro-card overflow-hidden mb-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex border-b-2 border-black rounded-t-2xl overflow-hidden">
        <button
          className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${mode === 'AI_TEXT' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          onClick={() => setMode('AI_TEXT')}
        >
          <Sparkles className="w-4 h-4" />
          AI 文本
        </button>
        <div className="w-0.5 bg-black"></div>
        <button
          className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${mode === 'AI_IMAGE' ? 'bg-pink-100 text-pink-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          onClick={() => setMode('AI_IMAGE')}
        >
          <ImageIcon className="w-4 h-4" />
          AI 截图
        </button>
        <div className="w-0.5 bg-black"></div>
        <button
          className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${mode === 'MANUAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          onClick={() => setMode('MANUAL')}
        >
          <Plus className="w-4 h-4" />
          手动
        </button>
      </div>

      <div className="p-6 bg-white">
        {mode === 'AI_TEXT' && (
          <form onSubmit={handleAISubmit}>
            <div className="relative mb-4">
              <div className="absolute -top-3 left-4 bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 border border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
                告诉 AI
              </div>
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="例如：昨天晚上和朋友吃火锅花了328元..."
                className="w-full h-32 p-4 pt-6 border-2 border-black rounded-xl focus:shadow-[4px_4px_0px_0px_#8b5cf6] focus:outline-none focus:border-black resize-none transition-shadow bg-white text-black placeholder-gray-400 font-medium"
                disabled={loading}
              />
            </div>
            
            {error && <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 font-bold rounded-lg">{error}</div>}

            <div className="flex justify-end gap-3">
               <button type="button" onClick={onCancel} className="retro-btn px-4 py-2 text-sm font-bold text-gray-700 bg-white rounded-lg hover:bg-gray-100">取消</button>
              <button type="submit" disabled={loading || !aiInput.trim()} className="retro-btn flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none disabled:translate-y-1 relative z-[101]">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? '分析中...' : '开始记账'}
              </button>
            </div>
          </form>
        )}

        {mode === 'AI_IMAGE' && (
          <form onSubmit={handleAISubmit}>
            <div 
              className={`border-2 border-dashed border-black rounded-xl p-8 text-center cursor-pointer transition-all ${selectedImage ? 'bg-pink-50' : 'bg-white hover:bg-gray-50'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageSelect}
              />
              
              {selectedImage ? (
                <div className="relative inline-block">
                  <img src={selectedImage} alt="Preview" className="max-h-48 mx-auto rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
                  <button 
                     type="button"
                     className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 border-2 border-black shadow-[2px_2px_0px_0px_black] hover:scale-110 transition-transform"
                     onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="mt-4 text-sm text-pink-600 font-bold">点击更换</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto w-16 h-16 bg-pink-200 border-2 border-black rounded-full flex items-center justify-center text-pink-600 shadow-[2px_2px_0px_0px_black]">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">上传账单截图</h3>
                  <p className="text-xs text-gray-500 font-medium">支持 PNG, JPG, WEBP</p>
                </div>
              )}
            </div>

            {error && <div className="mt-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 font-bold rounded-lg">{error}</div>}

            <div className="mt-6 flex justify-end gap-3">
               <button type="button" onClick={onCancel} className="retro-btn px-4 py-2 text-sm font-bold text-gray-700 bg-white rounded-lg hover:bg-gray-100">取消</button>
              <button type="submit" disabled={loading || !selectedImage} className="retro-btn flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-pink-500 rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:shadow-none disabled:translate-y-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? '识别中...' : '开始识别'}
              </button>
            </div>
          </form>
        )}

        {mode === 'MANUAL' && (
          <form onSubmit={handleManualSubmit} className="space-y-5">
            <div className="flex bg-gray-100 p-1.5 rounded-lg border-2 border-black">
              <button
                type="button"
                onClick={() => {
                  setManualType('EXPENSE');
                  setManualCategory(EXPENSE_CATEGORIES[0]);
                }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all border-2 ${
                  manualType === 'EXPENSE'
                    ? 'bg-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >支出</button>
              <button
                type="button"
                onClick={() => {
                  setManualType('INCOME');
                  setManualCategory(INCOME_CATEGORIES[0]);
                }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all border-2 ${
                  manualType === 'INCOME'
                    ? 'bg-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >收入</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">金额</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-900 font-bold">¥</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="retro-input w-full pl-8 pr-3 py-2 rounded-lg font-bold text-lg bg-white text-black"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">日期</label>
                <FixedDatePicker
                  value={manualDate}
                  onChange={setManualDate}
                  placeholder="选择日期"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">分类</label>
              <CustomSelect
                value={manualCategory}
                onChange={setManualCategory}
                options={manualType === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES}
                placeholder="选择分类"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">备注 (选填)</label>
              <input
                type="text"
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                placeholder="买了什么..."
                className="retro-input w-full px-3 py-2 rounded-lg font-medium bg-white text-black"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="retro-btn px-4 py-2 text-sm font-bold text-gray-700 bg-white rounded-lg hover:bg-gray-100"
              >取消</button>
              <button
                type="submit"
                className="retro-btn px-6 py-2 text-sm font-bold text-white bg-yellow-500 rounded-lg hover:bg-yellow-400 text-black border-black"
              >保存</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
