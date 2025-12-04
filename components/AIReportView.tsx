import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, Sparkles, Loader2 } from 'lucide-react';
import { fetchAIReport } from '../services/apiService';

interface Props {
  onBack: () => void;
}

export const AIReportView: React.FC<Props> = ({ onBack }) => {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      // Adjust for local timezone offset when sending date string
      // Or simpler: just send YYYY-MM-DD of current date
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const data = await fetchAIReport(reportType, dateStr);
      if (data.report) {
          setReport(data.report);
      } else {
          setError('生成报告失败，未返回数据');
      }
    } catch (err) {
      console.error(err);
      setError('生成报告失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const adjustDate = (delta: number) => {
    const newDate = new Date(currentDate);
    if (reportType === 'weekly') {
      newDate.setDate(newDate.getDate() + delta * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + delta);
    }
    setCurrentDate(newDate);
    setReport(null); // Clear old report when date changes
  };

  const getDateDisplay = () => {
    if (reportType === 'weekly') {
      // Calculate start and end of week (Monday based)
      const d = new Date(currentDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(d);
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
    } else {
      return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
    }
  };

  return (
    <div className="pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-yellow-300 border-b-4 border-black p-6 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/50 rounded-lg border-2 border-transparent hover:border-black transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            AI 智能周报/月报
          </h1>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Controls */}
        <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          
          {/* Type Selector */}
          <div className="flex p-1 bg-gray-100 rounded-xl border-2 border-black mb-6">
            <button
              onClick={() => { setReportType('weekly'); setReport(null); }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${reportType === 'weekly' ? 'bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-gray-500 hover:text-black'}`}
            >
              周报
            </button>
            <button
              onClick={() => { setReportType('monthly'); setReport(null); }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${reportType === 'monthly' ? 'bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-gray-500 hover:text-black'}`}
            >
              月报
            </button>
          </div>

          {/* Date Selector */}
          <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border-2 border-black mb-6">
            <button onClick={() => adjustDate(-1)} className="p-2 hover:bg-white rounded-lg border-2 border-transparent hover:border-black transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg">{getDateDisplay()}</span>
            <button onClick={() => adjustDate(1)} className="p-2 hover:bg-white rounded-lg border-2 border-transparent hover:border-black transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`w-full py-4 rounded-xl border-2 border-black font-black text-lg flex items-center justify-center gap-2 transition-all
              ${loading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-green-400 hover:bg-green-500 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]'
              }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                正在分析...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                生成{reportType === 'weekly' ? '周报' : '月报'}
              </>
            )}
          </button>
        </div>

        {/* Report Content */}
        {error && (
          <div className="bg-red-100 border-2 border-black rounded-xl p-4 text-red-700 font-bold text-center">
            {error}
          </div>
        )}

        {report && (
          <div className="bg-white border-4 border-black rounded-xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-fade-in">
            <div className="prose prose-lg max-w-none font-medium text-gray-800">
               {/* Simple Markdown-like rendering for bolding */}
               <div className="whitespace-pre-wrap leading-relaxed">
                  {report.split('\n').map((line, i) => (
                    <p key={i} className={line.startsWith('#') ? 'font-black text-xl mb-2' : line.startsWith('**') ? 'font-bold mb-2' : 'mb-2'}>
                      {line.replace(/\*\*/g, '')}
                    </p>
                  ))}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
