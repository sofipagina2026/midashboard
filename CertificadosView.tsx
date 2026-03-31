import React from 'react';
import { Case } from '../types';
import { Search, ChevronRight, AlertCircle, CheckCircle2, Filter, ArrowUpDown, Trash2, BrainCircuit } from 'lucide-react';

interface Props {
  cases: Case[];
  onSelectCase: (c: Case) => void;
  onDeleteCase: (id: string) => void;
  onAnalyze: (data: any[], title: string) => void;
}

type SortField = 'FechaReclamo' | 'MontoAfectado' | 'ID_Caso';
type SortOrder = 'asc' | 'desc';

export const CaseList: React.FC<Props> = ({ cases, onSelectCase, onDeleteCase, onAnalyze }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterType, setFilterType] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [sortField, setSortField] = React.useState<SortField>('FechaReclamo');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc');

  const types = Array.from(new Set(cases.map(c => c.TipoHecho)));

  const parseAmount = (amountStr: string) => {
    const val = parseFloat(amountStr.replace(/[^0-9,]/g, '').replace(',', '.'));
    return isNaN(val) ? 0 : val;
  };

  const parseDate = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
    }
    return 0;
  };

  const filteredCases = cases
    .filter(c => {
      const search = searchTerm.toLowerCase();
      const id = (c.ID_Caso || '').toLowerCase();
      const desc = (c.Descripcion || '').toLowerCase();
      const agency = (c.AgenciaReporta || '').toLowerCase();
      const conclusion = (c.Conclusion || '').toUpperCase();
      
      const matchesSearch = id.includes(search) || desc.includes(search) || agency.includes(search);
      const matchesType = filterType === 'all' || c.TipoHecho === filterType;
      
      const isProcedente = conclusion.includes('ES PROCEDENTE') || conclusion.includes('PROCEDENTE');
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'procedente' && isProcedente) ||
        (filterStatus === 'no_procedente' && !isProcedente);
        
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'MontoAfectado') {
        comparison = parseAmount(a.MontoAfectado) - parseAmount(b.MontoAfectado);
      } else if (sortField === 'FechaReclamo') {
        comparison = parseDate(a.FechaReclamo) - parseDate(b.FechaReclamo);
      } else {
        comparison = a.ID_Caso.localeCompare(b.ID_Caso);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="mt-8 bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
      <div className="p-6 border-b border-slate-200/80 dark:border-slate-700/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Listado de Investigaciones</h3>
            <button 
              onClick={() => onAnalyze(filteredCases, 'Investigaciones')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-colors"
            >
              <BrainCircuit className="w-4 h-4" />
              Análisis con IA
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por ID, descripción o agencia..." 
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Todos los Tipos</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <select 
            className="text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos los Estatus</option>
            <option value="procedente">Procedente</option>
            <option value="no_procedente">No Procedente</option>
          </select>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ordenar por:</span>
            <button 
              onClick={() => toggleSort('FechaReclamo')}
              className={`text-xs px-3 py-2 rounded-lg font-bold transition-colors flex items-center gap-1 ${sortField === 'FechaReclamo' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              Fecha {sortField === 'FechaReclamo' && <ArrowUpDown className="w-3 h-3" />}
            </button>
            <button 
              onClick={() => toggleSort('MontoAfectado')}
              className={`text-xs px-3 py-2 rounded-lg font-bold transition-colors flex items-center gap-1 ${sortField === 'MontoAfectado' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              Monto {sortField === 'MontoAfectado' && <ArrowUpDown className="w-3 h-3" />}
            </button>
          </div>

          {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
              }}
              className="text-xs text-rose-600 font-bold hover:underline"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">ID Caso</th>
              <th className="px-6 py-4 font-semibold">Fecha</th>
              <th className="px-6 py-4 font-semibold">Tipo</th>
              <th className="px-6 py-4 font-semibold">Monto Afectado</th>
              <th className="px-6 py-4 font-semibold">Resultado</th>
              <th className="px-6 py-4 font-semibold">Avance</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700/80">
            {filteredCases.length > 0 ? filteredCases.map((c) => {
              const conclusion = (c.Conclusion || '').toUpperCase();
              const isProcedente = conclusion.includes('ES PROCEDENTE') || conclusion.includes('PROCEDENTE');
              return (
                <tr key={c.ID_Caso} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group" onClick={() => onSelectCase(c)}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">{c.ID_Caso}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{c.FechaReclamo}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{c.TipoHecho}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-mono">{c.MontoAfectado}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isProcedente ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {isProcedente ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                      {isProcedente ? 'Procedente' : 'No Procedente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                      {c.Estatus || 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCase(c.ID_Caso);
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Eliminar caso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="text-slate-400 group-hover:text-indigo-600 transition-colors p-1">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                  No se encontraron casos con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
