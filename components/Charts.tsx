import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Transaction } from '../types';
import { CHART_COLORS } from '../constants';

interface Props {
  transactions: Transaction[];
}

export const Charts: React.FC<Props> = ({ transactions }) => {
  // Filter for expenses only for the pie chart
  const expenses = transactions.filter(t => t.type === 'EXPENSE');
  
  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value);

  // Group by date (last 7 days active or not)
  // Simplified: Group by last 5 transaction dates for this demo
  const dates: string[] = Array.from(new Set(transactions.map(t => t.date))).sort();
  const recentDates = dates.slice(-7); // Last 7 days with data
  
  const barData = recentDates.map((date: string) => {
    const dayTrans = transactions.filter(t => t.date === date);
    const income = dayTrans.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTrans.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    return {
      date: date.substring(5), // MM-DD
      income,
      expense
    };
  });

  if (transactions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Category Distribution */}
      <div className="retro-card p-6">
        <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center">
          <span className="bg-pink-400 w-4 h-4 inline-block border-2 border-black mr-2"></span>
          支出构成
        </h3>
        {pieData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="#000"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `¥${value.toFixed(2)}`}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '2px solid black', 
                    boxShadow: '4px 4px 0px 0px black',
                    fontWeight: 'bold'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {pieData.slice(0, 5).map((entry, index) => (
                <div key={entry.name} className="flex items-center text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md border border-black">
                  <span className="w-3 h-3 rounded-full mr-2 border border-black" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-400 font-bold">暂无支出数据</p>
          </div>
        )}
      </div>

      {/* Weekly Trend */}
      <div className="retro-card p-6">
        <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center">
           <span className="bg-indigo-400 w-4 h-4 inline-block border-2 border-black mr-2"></span>
           近期趋势
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{fontSize: 12, fontWeight: 'bold'}} axisLine={{stroke: '#000', strokeWidth: 2}} tickLine={false} />
              <YAxis tick={{fontSize: 12, fontWeight: 'bold'}} axisLine={{stroke: '#000', strokeWidth: 2}} tickLine={false} />
              <Tooltip 
                 formatter={(value: number) => `¥${value.toFixed(2)}`}
                 contentStyle={{ 
                    borderRadius: '8px', 
                    border: '2px solid black', 
                    boxShadow: '4px 4px 0px 0px black',
                    fontWeight: 'bold'
                  }}
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
              />
              <Bar dataKey="income" name="收入" fill="#22d3ee" radius={[4, 4, 0, 0]} stroke="#000" strokeWidth={2} />
              <Bar dataKey="expense" name="支出" fill="#fb923c" radius={[4, 4, 0, 0]} stroke="#000" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};