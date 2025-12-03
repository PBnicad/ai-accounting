import * as XLSX from 'xlsx';
import { Transaction, TransactionType } from '../types';
import { generateId } from '../utils';

// Mapping for Excel headers
const HEADER_MAP = {
  date: '日期',
  category: '分类',
  type: '类型', // 收入/支出
  amount: '金额',
  description: '备注',
};

// Reverse map for import
const REVERSE_HEADER_MAP: Record<string, string> = Object.entries(HEADER_MAP).reduce(
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);

export const exportTransactionsToExcel = (transactions: Transaction[]) => {
  try {
    // 1. Format data for Excel
    const data = transactions.map(t => ({
      [HEADER_MAP.date]: t.date,
      [HEADER_MAP.type]: t.type === 'INCOME' ? '收入' : '支出',
      [HEADER_MAP.category]: t.category,
      [HEADER_MAP.amount]: t.amount,
      [HEADER_MAP.description]: t.description,
    }));

    // 2. Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // 3. Create workbook and append sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "收支明细");

    // 4. Generate filename with current date
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `AI记账本_导出_${dateStr}.xlsx`;

    // 5. Write file
    XLSX.writeFile(wb, filename);
    return true;
  } catch (error) {
    console.error("Export failed:", error);
    return false;
  }
};

export const parseExcelFile = async (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assume data is in the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parse to JSON
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        const parsedTransactions: Transaction[] = [];

        rawData.forEach((row: any) => {
          // Normalize keys using REVERSE_HEADER_MAP
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            const mappedKey = REVERSE_HEADER_MAP[key] || key.toLowerCase();
            normalizedRow[mappedKey] = row[key];
          });

          // Validate essential fields
          if (!normalizedRow['date'] || !normalizedRow['amount']) {
             return; // Skip invalid rows
          }

          // Determine type
          let type: TransactionType = 'EXPENSE';
          const typeStr = String(normalizedRow['type'] || '').trim();
          if (typeStr === '收入' || typeStr === 'INCOME') {
            type = 'INCOME';
          }
          // Note: If amount is negative, user might mean expense, but we keep absolute amount and use Type
          
          parsedTransactions.push({
            id: generateId(),
            date: String(normalizedRow['date']).trim(),
            amount: Math.abs(parseFloat(normalizedRow['amount'])),
            type: type,
            category: String(normalizedRow['category'] || '其他').trim(),
            description: String(normalizedRow['description'] || '').trim(),
            createdAt: Date.now(),
          });
        });

        resolve(parsedTransactions);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};