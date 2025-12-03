
import React, { useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Database, LogOut } from 'lucide-react';
import { Transaction } from '../types';
import { exportTransactionsToExcel, parseExcelFile } from '../services/excelService';

interface Props {
  transactions: Transaction[];
  onImport: (newTransactions: Transaction[]) => void;
  onLogout?: () => void;
}

export const DataManagement: React.FC<Props> = ({ transactions, onImport, onLogout }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('');

  const handleExport = () => {
    const success = exportTransactionsToExcel(transactions);
    if (success) {
      setMessage(`成功导出 ${transactions.length} 条记录！`);
      setImportStatus('SUCCESS');
      setTimeout(() => setImportStatus('IDLE'), 3000);
    } else {
      setMessage('导出失败，请稍后重试。');
      setImportStatus('ERROR');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('PROCESSING');
    try {
      const newTransactions = await parseExcelFile(file);
      if (newTransactions.length === 0) {
        setImportStatus('ERROR');
        setMessage('未能在文件中找到有效数据，请检查格式。');
        return;
      }
      onImport(newTransactions);
      setImportStatus('SUCCESS');
      setMessage(`成功导入 ${newTransactions.length} 条记录！`);
      
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error(error);
      setImportStatus('ERROR');
      setMessage('解析文件失败，请确保文件格式正确 (Excel .xlsx)。');
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
       <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center">
         <div className="bg-emerald-400 p-2 border-2 border-black rounded-lg mr-3 shadow-[2px_2px_0px_0px_black]">
           <Database className="w-6 h-6 text-white" />
         </div>
         数据管理
       </h2>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Card */}
          <div className="retro-card p-6 bg-white flex flex-col items-center text-center space-y-4">
             <div className="w-16 h-16 bg-blue-100 rounded-full border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Download className="w-8 h-8 text-blue-600" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-gray-900">导出数据</h3>
               <p className="text-gray-500 text-sm mt-2">将所有记账记录导出为 Excel 文件，方便备份或在其他软件中查看。</p>
             </div>
             <button 
               onClick={handleExport}
               className="retro-btn mt-auto w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-600 flex items-center justify-center gap-2"
             >
               <FileSpreadsheet className="w-5 h-5" />
               导出 Excel
             </button>
          </div>

          {/* Import Card */}
          <div className="retro-card p-6 bg-white flex flex-col items-center text-center space-y-4">
             <div className="w-16 h-16 bg-green-100 rounded-full border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Upload className="w-8 h-8 text-green-600" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-gray-900">导入数据</h3>
               <p className="text-gray-500 text-sm mt-2">支持导入 Excel 文件。请确保包含：日期、金额、分类、类型(收入/支出)。</p>
             </div>
             <div className="w-full mt-auto">
               <input 
                 type="file" 
                 accept=".xlsx, .xls, .csv" 
                 ref={fileInputRef} 
                 className="hidden" 
                 onChange={handleFileChange}
               />
               <button 
               onClick={() => fileInputRef.current?.click()}
               className="retro-btn w-full bg-green-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-600 flex items-center justify-center gap-2"
             >
               <FileSpreadsheet className="w-5 h-5" />
               选择文件导入
             </button>
             </div>
          </div>

          {/* Logout Card */}
          {onLogout && (
            <div className="retro-card p-6 bg-white flex flex-col items-center text-center space-y-4 md:col-span-2 border-red-200">
               <div className="w-16 h-16 bg-red-100 rounded-full border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <LogOut className="w-8 h-8 text-red-600" />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-gray-900">账号管理</h3>
                 <p className="text-gray-500 text-sm mt-2">安全地退出您的账户。</p>
               </div>
               <button 
                 onClick={onLogout}
                 className="retro-btn w-full md:w-64 bg-red-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-600 flex items-center justify-center gap-2"
               >
                 <LogOut className="w-5 h-5" />
                 退出登录
               </button>
            </div>
          )}
       </div>

       {/* Status Message */}
       {importStatus !== 'IDLE' && message && (
         <div className={`retro-card p-4 border-2 flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${
            importStatus === 'SUCCESS' ? 'bg-green-50 border-green-600 text-green-800' : 
            importStatus === 'ERROR' ? 'bg-red-50 border-red-600 text-red-800' : 'bg-blue-50 border-blue-600 text-blue-800'
         }`}>
           {importStatus === 'SUCCESS' && <CheckCircle className="w-6 h-6 flex-shrink-0" />}
           {importStatus === 'ERROR' && <AlertCircle className="w-6 h-6 flex-shrink-0" />}
           {importStatus === 'PROCESSING' && <Database className="w-6 h-6 animate-bounce flex-shrink-0" />}
           <p className="font-bold">{message}</p>
         </div>
       )}
       
       <div className="mt-8 p-6 bg-yellow-50 border-2 border-black rounded-xl border-dashed">
         <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
           <AlertCircle className="w-5 h-5" />
           导入说明
         </h4>
         <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 font-medium">
           <li>文件格式支持 <strong>.xlsx</strong></li>
           <li>表头建议包含：<strong>日期</strong>, <strong>分类</strong>, <strong>金额</strong>, <strong>类型</strong>, <strong>备注</strong></li>
           <li>类型列请填写“收入”或“支出”，如未填写默认为支出</li>
           <li>日期格式建议为 YYYY-MM-DD</li>
         </ul>
       </div>
    </div>
  );
};
