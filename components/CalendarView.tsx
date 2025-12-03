
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onDateClick?: (date: string) => void;
}

export const CalendarView: React.FC<Props> = ({ transactions, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Group transactions by date string YYYY-MM-DD
  const dailyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    transactions.forEach(t => {
      if (!map[t.date]) map[t.date] = { income: 0, expense: 0 };
      if (t.type === 'INCOME') map[t.date].income += t.amount;
      else map[t.date].expense += t.amount;
    });
    return map;
  }, [transactions]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const renderDays = () => {
    const days = [];
    const totalSlots = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;

    for (let i = 0; i < totalSlots; i++) {
      const dayNum = i - firstDayOfMonth + 1;
      
      if (dayNum > 0 && dayNum <= daysInMonth) {
        // Construct YYYY-MM-DD
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const data = dailyData[dateStr];
        const isToday = new Date().toDateString() === new Date(year, month, dayNum).toDateString();
        
        const handleDateClick = () => {
          if (onDateClick) {
            onDateClick(dateStr);
          }
        };

        days.push(
          <div
            key={i}
            onClick={handleDateClick}
            className={`min-h-[90px] md:min-h-[110px] border-r-2 border-b-2 border-black bg-white p-2 flex flex-col items-start justify-start relative hover:bg-yellow-50 transition-colors group ${onDateClick && (data?.income > 0 || data?.expense > 0) ? 'cursor-pointer hover:shadow-lg' : ''}`}>
            <span className={`text-sm font-bold z-10 ${isToday ? 'bg-black text-white w-7 h-7 flex items-center justify-center rounded-full shadow-[2px_2px_0px_0px_rgba(200,200,200,1)]' : 'text-gray-700'}`}>
              {dayNum}
            </span>
            {isToday && <Star className="absolute top-2 right-2 w-4 h-4 text-yellow-400 fill-current animate-pulse" />}
            
            <div className="mt-auto w-full flex flex-col items-end gap-1 text-xs font-bold">
              {data?.income > 0 && (
                <span className="bg-cyan-100 text-cyan-800 px-1 rounded border border-black transform group-hover:scale-105 transition-transform">+{Math.round(data.income)}</span>
              )}
              {data?.expense > 0 && (
                <span className="bg-orange-100 text-orange-800 px-1 rounded border border-black transform group-hover:scale-105 transition-transform">-{Math.round(data.expense)}</span>
              )}
            </div>
          </div>
        );
      } else {
        days.push(<div key={i} className="min-h-[100px] border-r-2 border-b-2 border-black bg-gray-100/50 pattern-diagonal-lines"></div>);
      }
    }
    return days;
  };

  return (
    <div className="retro-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b-2 border-black bg-yellow-50">
        <h2 className="text-xl font-black text-gray-900">
          {year}年 {month + 1}月
        </h2>
        <div className="flex items-center space-x-3">
          <button onClick={prevMonth} className="retro-btn p-2 bg-white rounded-full hover:bg-gray-100 text-black">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="text-sm font-bold text-black border-2 border-black bg-white hover:bg-gray-100 px-4 py-1.5 rounded-full shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none transition-all">
            今天
          </button>
          <button onClick={nextMonth} className="retro-btn p-2 bg-white rounded-full hover:bg-gray-100 text-black">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 border-b-2 border-black bg-black text-white">
        {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(d => (
          <div key={d} className="py-3 text-center text-sm font-black border-r border-gray-700 last:border-r-0">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 border-l-2 border-t-0 border-black">
        {renderDays()}
      </div>
      
      <div className="p-4 bg-white border-t-2 border-black flex items-center justify-end gap-6 text-xs font-bold text-gray-600">
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-sm bg-cyan-100 border border-black"></div> 收入
         </div>
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-sm bg-orange-100 border border-black"></div> 支出
         </div>
      </div>
    </div>
  );
};