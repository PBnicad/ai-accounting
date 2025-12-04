import React, { useState, useEffect, useMemo } from 'react';
import { fetchTransactions, createTransaction, updateTransaction, deleteTransaction } from '../services/apiService';
import { Transaction, SummaryStats, AppView } from '../types';
import { SummaryCards } from '../components/SummaryCards';
import { TransactionList } from '../components/TransactionList';
import { AddTransaction } from '../components/AddTransaction';
import { EditTransaction } from '../components/EditTransaction';
import { Charts } from '../components/Charts';
import { CalendarView } from '../components/CalendarView';
import { DayDetailView } from '../components/DayDetailView';
import { DataManagement } from '../components/DataManagement';
import { AIReportView } from '../components/AIReportView';
import { Plus, LayoutDashboard, History, CalendarDays, Wallet, Settings, X, LogOut, Sparkles, ChevronRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTransactions();
        setTransactions(data);
      } catch (e) {
        console.error('Failed to load transactions', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const stats: SummaryStats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  }, [transactions]);

  const handleAddTransaction = async (transaction: Transaction) => {
    try {
      // Remove the client-side generated ID
      const { id, ...data } = transaction;
      const newTransaction = await createTransaction(data);
      setTransactions(prev => [newTransaction, ...prev]);
      setShowAddModal(false);
    } catch (e) {
      console.error('Failed to create transaction', e);
      alert('添加失败，请重试');
    }
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setView(AppView.DAY_DETAIL);
  };

  const handleBackToCalendar = () => {
    setView(AppView.CALENDAR);
    setSelectedDate('');
  };
  
  const handleImportTransactions = async (newTransactions: Transaction[]) => {
    // Simple implementation: create one by one
    // In a real app, you'd want a bulk create endpoint
    try {
      const createdTransactions = [];
      for (const t of newTransactions) {
        const { id, ...data } = t;
        const created = await createTransaction(data);
        createdTransactions.push(created);
      }
      setTransactions(prev => [...createdTransactions, ...prev]);
      alert(`成功导入 ${createdTransactions.length} 条记录`);
    } catch (e) {
      console.error('Import failed', e);
      alert('部分导入失败');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      try {
        await deleteTransaction(id);
        setTransactions(prev => prev.filter(t => t.id !== id));
      } catch (e) {
        console.error('Failed to delete transaction', e);
        alert('删除失败');
      }
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const handleSaveTransaction = async (updatedTransaction: Transaction) => {
    try {
      const saved = await updateTransaction(updatedTransaction);
      setTransactions(prev =>
        prev.map(t => t.id === saved.id ? saved : t)
      );
      setShowEditModal(false);
      setEditingTransaction(null);
    } catch (e) {
      console.error('Failed to update transaction', e);
      alert('更新失败');
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingTransaction(null);
  };

  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
      } catch (e) {
        console.error('Logout failed', e);
        alert('退出失败');
      }
    }
  };

  const NavButton = ({ active, label, icon: Icon, onClick, colorClass }: any) => (
    <button
      onClick={onClick}
      className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold border-2 transition-all ${
        active 
          ? `bg-${colorClass}-100 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]` 
          : 'border-transparent text-gray-500 hover:bg-white hover:border-gray-200'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-black' : 'text-gray-400'}`} strokeWidth={active ? 2.5 : 2} />
      <span>{label}</span>
    </button>
  );

  const MobileNavItem = ({ active, label, icon: Icon, onClick, colorClass }: any) => {
    const getBgColorClass = () => {
      switch(colorClass) {
        case 'purple': return active ? 'bg-purple-200' : '';
        case 'pink': return active ? 'bg-pink-200' : '';
        case 'cyan': return active ? 'bg-cyan-200' : '';
        case 'emerald': return active ? 'bg-emerald-200' : '';
        default: return '';
      }
    };

    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all w-16 ${
          active ? 'text-black transform -translate-y-1' : 'text-gray-400'
        }`}
      >
        <div className={`p-1.5 rounded-lg border-2 transition-all ${
          active ? `${getBgColorClass()} border-black shadow-[2px_2px_0px_0px_black]` : 'border-transparent'
        }`}>
          <Icon className={`w-5 h-5`} strokeWidth={active ? 3 : 2} />
        </div>
        <span className={`text-[10px] mt-1 font-bold ${active ? 'opacity-100' : 'opacity-0 scale-0'} transition-all duration-200`}>
          {label}
        </span>
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffdf5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fffdf5]">
      {/* Retro Header */}
      <header className="pt-6 pb-2 px-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto hidden md:block">
          <div className="bg-white border-2 border-black  rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between ">
            <div className="flex items-center ">
              <div className="w-10 h-10 bg-yellow-400 border-2 border-black rounded-lg flex items-center justify-center mr-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-3">
                <Wallet className="text-black w-6 h-6" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-black text-black tracking-tight italic">AI 记账本</h1>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-1">
              <NavButton 
                active={view === AppView.DASHBOARD} 
                label="概览" 
                icon={LayoutDashboard} 
                onClick={() => setView(AppView.DASHBOARD)} 
                colorClass="purple"
              />
              <NavButton 
                active={view === AppView.CALENDAR} 
                label="日历" 
                icon={CalendarDays} 
                onClick={() => setView(AppView.CALENDAR)} 
                colorClass="pink"
              />
              <NavButton 
                active={view === AppView.HISTORY} 
                label="明细" 
                icon={History} 
                onClick={() => setView(AppView.HISTORY)} 
                colorClass="cyan"
              />
              <NavButton 
                active={view === AppView.REPORT} 
                label="AI周报" 
                icon={Sparkles} 
                onClick={() => setView(AppView.REPORT)} 
                colorClass="yellow"
              />
              <NavButton 
                active={view === AppView.SETTINGS} 
                label="设置" 
                icon={Settings} 
                onClick={() => setView(AppView.SETTINGS)} 
                colorClass="emerald"
              />
              <div className="w-px h-8 bg-gray-200 mx-2"></div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="retro-btn bg-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-gray-900 active:translate-y-1 active:shadow-none transition-all"
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
            
            {/* Mobile Header Right (can be empty or profile later) */}
            <div className="md:hidden">
              {/* Removed Logout button from mobile header */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-10">
        
        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-yellow-200/90 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="w-full max-w-lg relative animate-in zoom-in-95 duration-300">
               <button
                 onClick={() => setShowAddModal(false)}
                 className="absolute -top-12 right-0 md:-right-12 w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_black] hover:scale-110 transition-transform cursor-pointer z-50 text-black"
                 aria-label="Close modal"
               >
                 <X className="w-6 h-6" strokeWidth={2.5} />
               </button>
               <AddTransaction
                 onAdd={handleAddTransaction}
                 onCancel={() => setShowAddModal(false)}
                 defaultDate={view === AppView.DAY_DETAIL ? selectedDate : undefined}
               />
             </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingTransaction && (
          <EditTransaction
            transaction={editingTransaction}
            onSave={handleSaveTransaction}
            onCancel={handleCancelEdit}
          />
        )}

        {/* Dashboard View */}
        {view === AppView.DASHBOARD && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <SummaryCards stats={stats} />
            
            {/* AI Report Card */}
            <div 
              className="bg-gradient-to-r from-yellow-200 to-orange-200 border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_black] flex items-center justify-between cursor-pointer hover:translate-y-[-2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_black] transition-all" 
              onClick={() => setView(AppView.REPORT)}
            >
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_black]">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">AI 智能分析周报</h3>
                  <p className="text-sm font-medium text-gray-700">让 AI 帮你总结消费习惯，提供省钱建议</p>
                </div>
              </div>
              <div className="bg-white/50 p-2 rounded-full border-2 border-black">
                <ChevronRight className="w-5 h-5 text-black" />
              </div>
            </div>

            <Charts transactions={transactions} />
            <div>
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xl font-black text-gray-800 italic transform -skew-x-12 inline-block bg-yellow-300 px-2 border-2 border-black shadow-[2px_2px_0px_0px_black]">最近记录</h3>
                <button 
                  onClick={() => setView(AppView.HISTORY)}
                  className="text-gray-900 text-sm font-bold hover:underline decoration-2 underline-offset-4 decoration-purple-500"
                >
                  查看全部 &rarr;
                </button>
              </div>
              <TransactionList
                transactions={transactions.slice(0, 5)}
                onDelete={handleDeleteTransaction}
                onEdit={handleEditTransaction}
                enableSearch={false}
              />
            </div>
          </div>
        )}

        {/* Calendar View */}
        {view === AppView.CALENDAR && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-gray-800 mb-2 flex items-center">
               <div className="bg-pink-400 p-2 border-2 border-black rounded-lg mr-3 shadow-[2px_2px_0px_0px_black]">
                 <CalendarDays className="w-6 h-6 text-white" />
               </div>
               收支日历
             </h2>
            <CalendarView
              transactions={transactions}
              onDateClick={handleDateClick}
            />
          </div>
        )}

        {/* Day Detail View */}
        {view === AppView.DAY_DETAIL && (
          <DayDetailView
            date={selectedDate}
            transactions={transactions}
            onBack={handleBackToCalendar}
            onAddTransaction={() => setShowAddModal(true)}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* History View */}
        {view === AppView.HISTORY && (
          <div className="animate-in slide-in-from-right-8 duration-300">
             <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center">
               <div className="bg-cyan-400 p-2 border-2 border-black rounded-lg mr-3 shadow-[2px_2px_0px_0px_black]">
                 <History className="w-6 h-6 text-white" />
               </div>
               交易明细
             </h2>
             <TransactionList
              transactions={transactions}
              onDelete={handleDeleteTransaction}
              onEdit={handleEditTransaction}
              enableSearch={true}
            />
          </div>
        )}

        {/* AI Report View */}
        {view === AppView.REPORT && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <AIReportView onBack={() => setView(AppView.DASHBOARD)} />
          </div>
        )}

        {/* Settings View */}
        {view === AppView.SETTINGS && (
           <DataManagement 
             transactions={transactions} 
             onImport={handleImportTransactions}
             onLogout={handleLogout} 
           />
        )}

      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black px-4 pt-2 pb-2 z-40 flex justify-between items-end shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.05)]">
        <MobileNavItem 
          active={view === AppView.DASHBOARD} 
          label="概览" 
          icon={LayoutDashboard} 
          onClick={() => setView(AppView.DASHBOARD)} 
          colorClass="purple"
        />
        
        <MobileNavItem 
          active={view === AppView.CALENDAR} 
          label="日历" 
          icon={CalendarDays} 
          onClick={() => setView(AppView.CALENDAR)} 
          colorClass="pink"
        />

              {/* Floating Add Button */}
        <div className="relative -top-5">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-14 h-14 bg-black rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(251,191,36,1)] flex items-center justify-center text-white transform transition-transform hover:scale-105 active:scale-95 active:shadow-none active:translate-y-1"
          >
            <Plus className="w-8 h-8" strokeWidth={3} />
          </button>
        </div>

        <MobileNavItem 
          active={view === AppView.HISTORY} 
          label="明细" 
          icon={History} 
          onClick={() => setView(AppView.HISTORY)} 
          colorClass="cyan"
        />

        <MobileNavItem 
          active={view === AppView.SETTINGS} 
          label="设置" 
          icon={Settings} 
          onClick={() => setView(AppView.SETTINGS)} 
          colorClass="emerald"
        />
      </nav>
    </div>
  );
};

export default Dashboard;
