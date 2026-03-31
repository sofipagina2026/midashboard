import React, { useState, useMemo } from 'react';
import { Search, FileDown, BrainCircuit } from 'lucide-react';

interface DataTableViewProps {
  title: string;
  data: any[];
  columns: { key: string; label: string }[];
  onAnalyze: (data: any[], title: string) => void;
}

export const DataTableView: React.FC<DataTableViewProps> = ({ title, data, columns, onAnalyze }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  return (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-100 dark:bg-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
            <FileDown className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onAnalyze(filteredData, title)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600"
          >
            <BrainCircuit className="w-4 h-4" />
            Análisis con IA
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-100 dark:bg-slate-700">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-6 py-3">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr key={index} className="border-b border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                {columns.map(col => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap">{row[col.key] || '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
