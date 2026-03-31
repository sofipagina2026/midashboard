import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trash2,
  Moon,
  Sun,
} from 'lucide-react';
import { 
  LayoutDashboard, 
  Database, 
  ShieldCheck, 
  FileText, 
  TrendingUp, 
  LogOut, 
  RefreshCw,
  Search,
  BrainCircuit,
  AlertCircle,
  Flame,
  UserMinus,
  Inbox,
  History,

  Calendar,
  PieChart as PieChartIcon,
  Bell,
  Plus,
  Download,
  Upload,
  X,
  ChevronRight,
  DollarSign,
  User as UserIcon,
  MapPin,
  Settings,
  Menu
} from 'lucide-react';
import * as XLSX from 'xlsx';
import pRetry from 'p-retry';
import toast from 'react-hot-toast';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Funnel,
  FunnelChart,
  LabelList
} from 'recharts';
import { supabase } from '../services/supabaseClient';
import { analyzeData, analyzeGlobalData, parseTextToData } from '../services/AIEngine';
import { introspectTables, formatHeader, TableSchema, parseDate } from '../services/SchemaService';
import SkeletonTable from './SkeletonTable';
import EmptyState from './EmptyState';

/**
 * Dashboard.tsx
 * Componente principal del tablero con introspección dinámica de Supabase y Gemini 3
 */

interface DashboardProps {
  session: any;
}

const SOFITASA_COLORS = ['#004a99', '#e30613', '#f9b233', '#00a19a', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const VIRTUAL_COLUMNS = ['Dias_por_Vencer', 'Status', 'Modulo_Destino', 'Estado_Solicitud', 'Vigencia_Total'];

export const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSyncing, setIsSyncing] = useState(false);
  const [schemas, setSchemas] = useState<Record<string, TableSchema>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const aiResultRef = useRef<HTMLDivElement>(null);
  const [aiTone, setAiTone] = useState('Ejecutivo/Formal');
  const [timeFilter, setTimeFilter] = useState<'month' | 'year' | 'all'>('all');
  const [editData, setEditData] = useState<Record<string, any> | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isAddModalOpen) {
      setEditData(null);
      setFormData({});
    }
  }, [isAddModalOpen]);

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    }
  }, [editData]);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMasterImportModalOpen, setIsMasterImportModalOpen] = useState(false);
  const [masterImportTarget, setMasterImportTarget] = useState<string>('');
  const [masterImportFile, setMasterImportFile] = useState<File | null>(null);
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    throw new Error('Dashboard must be used within a ThemeContext.Provider');
  }
  const { darkMode, toggleDarkMode } = themeContext;

  // Función de Sincronización con p-retry e introspección

  const syncData = async () => {
    setIsSyncing(true);
    try {
      await pRetry(async () => {
        const tableSchemas = await introspectTables();
        setSchemas(tableSchemas);
      }, {
        retries: 2,
        onFailedAttempt: error => {
          console.log(`Intento de sincronización fallido ${error.attemptNumber}.`);
        }
      });
    } catch (error) {
      console.error("Error fatal en sincronización:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncData();
    // Verificar si la API Key está configurada (solo para diagnóstico en desarrollo/despliegue)
    if (!process.env.GEMINI_API_KEY) {
      console.warn("ADVERTENCIA: GEMINI_API_KEY no detectada. Los informes de IA podrían fallar.");
    }
  }, []);

  const handleAiAnalysis = async (tabToAnalyze?: string) => {
    const targetTab = tabToAnalyze || activeTab;
    const currentData = schemas[targetTab]?.data || [];
    if (currentData.length === 0) {
      alert("No hay datos suficientes en esta pestaña para realizar un análisis.");
      return;
    }
    
    setIsAnalyzing(true);
    setAiResult(null);
    
    try {
      const result = await analyzeData(currentData, targetTab, aiTone);
      console.log("Resultado de IA recibido:", result);
      setAiResult(result);
      // Scroll suave al resultado después de un breve delay para que el DOM se actualice
      setTimeout(() => {
        aiResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error: any) {
      console.error("Error analizando datos:", error);
      toast.error(`Error de IA: ${error.message || 'No se pudo generar el informe.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGlobalAiAnalysis = async () => {
    const allData: Record<string, any[]> = {};
    let hasData = false;
    
    Object.keys(schemas).forEach(tab => {
      const data = schemas[tab]?.data || [];
      if (data.length > 0) {
        allData[tab] = data;
        hasData = true;
      }
    });

    if (!hasData) {
      alert("No hay datos en ninguna pestaña para realizar un análisis global.");
      return;
    }

    setIsAnalyzing(true);
    setAiResult(null);
    
    try {
      const result = await analyzeGlobalData(allData, aiTone);
      console.log("Resultado de IA Global recibido:", result);
      setAiResult(result);
      setTimeout(() => {
        aiResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error: any) {
      console.error("Error analizando datos globales:", error);
      toast.error(`Error de IA Global: ${error.message || 'No se pudo generar el informe integral.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateExcelTemplate = async (tableName: string, schema: TableSchema) => {
    try {
      toast.loading(`Generando plantilla para ${tableName}...`, { id: 'template' });
      
      // Escaneo Dinámico de Columnas: SELECT *
      const { data, error } = await supabase.from(tableName).select('*').limit(1);
      
      if (error) {
        throw new Error(`Error de conexión con la tabla ${tableName}: ${error.message}`);
      }

      let columnsToExport: string[] = [];
      
      if (data && data.length > 0) {
        columnsToExport = Object.keys(data[0]);
      } else {
        // Reglas de Integridad: Si una tabla está vacía, la pestaña debe quedar solo con sus encabezados reales de la DB
        // Como la API REST no devuelve columnas si está vacía, usamos los headers predefinidos que coinciden con la DB
        const fallbacks: Record<string, string[]> = {
          'INVESTIGACIONES': [
            'ID_Caso', 'FechaReclamo', 'NumExpediente', 'NumReclamo', 'Investigador',
            'AgenciaReporta', 'TipoHecho', 'AgenciaOrigen', 'Vicepresidencia', 'FechaHecho',
            'Descripcion', 'MontoExpuesto', 'MontoAfectado', 'MontoRecuperado',
            'CanalTransaccional', 'Conclusion', 'ClienteReceptor', 'Estatus'
          ],
          'SERVICIO TECNICO': [
            'Solicitud', 'Nro', 'Agencia _Pto_De_Serv _Depto', 'F_Solicitud', 
            'Reportado', 'Tipo_De_Solicitud', 'Proveedor', 'Observacion', 'Fecha_De_Atencion'
          ],
          'CERTIFICADOS DE SEGURIDAD': ['N', 'ESTADO', 'FECHA_DE_VENCIMIENTO', 'FECHA_DE_EXPEDICION', 'NDECERTIFICACION', 'OFICINA', 'FECHA_ACTUAL'],
          'CERTIFICADOS DE BOMBEROS': ['N', 'ESTADO', 'FECHA_DE_VENCIMIENTO', 'FECHA_DE_EXPEDICION', 'NDECERTIFICACION', 'OFICINA', 'FECHA_ACTUAL'],
          'PRESUPUESTOS': ['Item_Descripcion', 'Empresa_1_Nombre', 'Empresa_1_Monto', 'Empresa_2_Nombre', 'Empresa_2_Monto', 'Empresa_3_Nombre', 'Empresa_3_Monto', 'Empresa_4_Nombre', 'Empresa_4_Monto'],
          'RETIROS VOLUNTARIOS': ['Nro', 'EMPLEADO', 'CEDULA', 'CARGO', 'ADSCRITOA', 'EXPEDIENTE']
        };
        columnsToExport = fallbacks[tableName] || [];
      }

      // Filtrar columnas virtuales
      const hiddenColumns = [...VIRTUAL_COLUMNS].map(c => c.toLowerCase());
      columnsToExport = columnsToExport.filter(col => !hiddenColumns.includes(col.toLowerCase()));

      // Regla estricta: NO AGREGAR LA COLUMNA id ya que debe permanecer oculta
      columnsToExport = columnsToExport.filter(col => col.toLowerCase() !== 'id');

      // Crear una fila de ejemplo vacía con las columnas correctas
      const templateData = [Object.fromEntries(columnsToExport.map(col => [col, '']))];

      const ws = XLSX.utils.json_to_sheet(templateData, { header: columnsToExport });
      const wb = XLSX.utils.book_new();
      
      // Mapeo inverso para el nombre de la pestaña
      const tabNames: Record<string, string> = {
        'INVESTIGACIONES': 'Investigaciones',
        'CERTIFICADOS DE SEGURIDAD': 'Cert. Seguridad',
        'CERTIFICADOS DE BOMBEROS': 'Cert. Bomberos',
        'PRESUPUESTOS': 'Presupuestos',
        'RETIROS VOLUNTARIOS': 'Retiros Voluntarios',
        'SERVICIO TECNICO': 'Servicio Técnico'
      };
      
      const sheetName = tabNames[tableName] || tableName.slice(0, 30);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `Plantilla_${sheetName.replace(/ /g, '_')}.xlsx`);
      
      toast.success('Plantilla generada exitosamente', { id: 'template' });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error de conexión con Supabase', { id: 'template' });
    }
  };

  const handleExportExcel = () => {
    const schema = schemas[activeTab];
    if (!schema) return;
    generateExcelTemplate(activeTab, schema);
  };

  const handleTabImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSyncing(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Obtener todas las filas como arrays para buscar el encabezado
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      if (rawRows.length === 0) {
        toast.error("El archivo está vacío.");
        return;
      }

      const schema = schemas[activeTab];
      const dbColumns = schema?.columns || [];
      const pk = schema?.primaryKey || 'id';

      // Buscar la fila de encabezados
      let headerRowIndex = -1;
      let maxMatches = 0;

      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        const row = rawRows[i];
        if (!Array.isArray(row)) continue;
        
        const matches = row.filter(cell => 
          typeof cell === 'string' && 
          dbColumns.some(col => col.toLowerCase().replace(/[^a-z0-9]/g, '') === cell.toLowerCase().replace(/[^a-z0-9]/g, ''))
        ).length;

        if (matches > maxMatches) {
          maxMatches = matches;
          headerRowIndex = i;
        }
      }

      // Si no encontramos una fila clara de encabezados, usamos la primera fila con datos
      if (headerRowIndex === -1) headerRowIndex = 0;

      console.log(`Fila de encabezados detectada en índice: ${headerRowIndex}`);

      // Convertir a JSON usando la fila de encabezados detectada
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex }) as any[];

      if (jsonData.length > 0) {
        console.log(`Iniciando importación en "${activeTab}". Columnas DB:`, dbColumns);

        // Limpiar datos para Supabase
        const cleanData = jsonData.map((row: any) => {
          const cleanedRow: any = {};
          
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach(k => {
            normalizedRow[k.trim().toLowerCase().replace(/[^a-z0-9]/g, '')] = row[k];
          });

          dbColumns.forEach(col => {
            if (VIRTUAL_COLUMNS.includes(col)) return;
            
            const normalizedCol = col.toLowerCase().replace(/[^a-z0-9]/g, '');
            let value = normalizedRow[normalizedCol];
            
            // Intentar match difuso si no hay match exacto normalizado
            if (value === undefined) {
              const excelKey = Object.keys(normalizedRow).find(k => 
                normalizedCol.includes(k) || k.includes(normalizedCol)
              );
              if (excelKey) value = normalizedRow[excelKey];
            }

            if (value === undefined) {
              value = row[col];
            }

            if (value === undefined || value === null || (typeof value === 'string' && (value.trim() === "" || value.toLowerCase() === "null"))) {
              value = null;
            }
            
            if (schema?.businessLogic.amountColumns.includes(col) && value !== null) {
               const num = typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : Number(value);
               value = isNaN(num) ? null : num;
            }

            if (schema?.businessLogic.dateColumns.includes(col) && value !== null) {
              const date = parseDate(String(value));
              value = date ? date.toISOString().split('T')[0] : null;
            }

            if (col === pk && (value === null || value === undefined)) return;

            cleanedRow[col] = value;
          });
          return cleanedRow;
        }).filter(row => Object.values(row).some(v => v !== null));

        if (cleanData.length === 0) {
          toast.error("No se encontraron datos válidos que coincidan con las columnas.");
          setIsSyncing(false);
          return;
        }

        console.log(`Payload final para "${activeTab}":`, cleanData);
        console.log(`Enviando ${cleanData.length} registros a Supabase...`);
        
        const { error } = await supabase.from(activeTab).upsert(cleanData, { onConflict: pk });
        if (error) {
          console.error(`Error detallado de Supabase (Import ${activeTab}):`, error);
          toast.error(`Error al importar: ${error.message}${error.details ? ' - ' + error.details : ''}`);
        } else {
          toast.success(`Importación a ${activeTab} completada.`);
        }
      } else {
        toast.error("No se encontraron datos en el archivo.");
      }
      
      await syncData();
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Error al procesar el archivo.");
    } finally {
      setIsSyncing(false);
      e.target.value = '';
    }
  };

  const handleMasterImport = async () => {
    if (!masterImportFile || !masterImportTarget) {
      toast.error("Seleccione archivo y destino.");
      return;
    }

    try {
      setIsSyncing(true);
      const data = await masterImportFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      const moduleMap: Record<string, string> = {
        'Investigaciones': 'INVESTIGACIONES',
        'Cert. Seguridad': 'CERTIFICADOS DE SEGURIDAD',
        'Cert. Bomberos': 'CERTIFICADOS DE BOMBEROS',
        'Presupuestos': 'PRESUPUESTOS',
        'Retiros Voluntarios': 'RETIROS VOLUNTARIOS',
        'Servicio Técnico': 'SERVICIO TECNICO'
      };

      const tableName = moduleMap[masterImportTarget];
      const schema = schemas[tableName];
      let dbColumns = schema?.columns || [];
      
      if (dbColumns.length === 0) {
        const fallbacks: Record<string, string[]> = {
          'INVESTIGACIONES': ['ID_Caso', 'FechaReclamo', 'NumExpediente', 'NumReclamo', 'Investigador', 'AgenciaReporta', 'TipoHecho', 'AgenciaOrigen', 'Vicepresidencia', 'FechaHecho', 'Descripcion', 'MontoExpuesto', 'MontoAfectado', 'MontoRecuperado', 'CanalTransaccional', 'Conclusion', 'ClienteReceptor', 'Estatus'],
          'SERVICIO TECNICO': ['Solicitud', 'Nro', 'Agencia _Pto_De_Serv _Depto', 'F_Solicitud', 'Reportado', 'Tipo_De_Solicitud', 'Proveedor', 'Observacion', 'Fecha_De_Atencion'],
          'CERTIFICADOS DE SEGURIDAD': ['N', 'ESTADO', 'FECHA_DE_VENCIMIENTO', 'FECHA_DE_EXPEDICION', 'NDECERTIFICACION', 'OFICINA', 'FECHA_ACTUAL'],
          'CERTIFICADOS DE BOMBEROS': ['N', 'ESTADO', 'FECHA_DE_VENCIMIENTO', 'FECHA_DE_EXPEDICION', 'NDECERTIFICACION', 'OFICINA', 'FECHA_ACTUAL'],
          'PRESUPUESTOS': ['Item_Descripcion', 'Empresa_1_Nombre', 'Empresa_1_Monto', 'Empresa_2_Nombre', 'Empresa_2_Monto', 'Empresa_3_Nombre', 'Empresa_3_Monto', 'Empresa_4_Nombre', 'Empresa_4_Monto'],
          'RETIROS VOLUNTARIOS': ['Nro', 'EMPLEADO', 'CEDULA', 'CARGO', 'ADSCRITOA', 'EXPEDIENTE']
        };
        dbColumns = fallbacks[tableName] || [];
      }

      const pk = schema?.primaryKey || 'id';

      let headerRowIndex = -1;
      let maxMatches = 0;

      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        const row = rawRows[i];
        if (!Array.isArray(row)) continue;
        const matches = row.filter(cell => 
          typeof cell === 'string' && 
          dbColumns.some(col => col.toLowerCase().replace(/[^a-z0-9]/g, '') === cell.toLowerCase().replace(/[^a-z0-9]/g, ''))
        ).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          headerRowIndex = i;
        }
      }

      if (headerRowIndex === -1) headerRowIndex = 0;

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex }) as any[];

      if (jsonData.length > 0) {
        const rowsToInsert = jsonData.map((row: any) => {
          const cleanedRow: any = {};
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach(k => {
            normalizedRow[k.trim().toLowerCase().replace(/[^a-z0-9]/g, '')] = row[k];
          });

          dbColumns.forEach(col => {
            if (VIRTUAL_COLUMNS.includes(col)) return;
            const normalizedCol = col.toLowerCase().replace(/[^a-z0-9]/g, '');
            let value = normalizedRow[normalizedCol];

            // Fuzzy match
            if (value === undefined) {
              const excelKey = Object.keys(normalizedRow).find(k => 
                normalizedCol.includes(k) || k.includes(normalizedCol)
              );
              if (excelKey) value = normalizedRow[excelKey];
            }

            if (value === undefined) value = row[col];

            if (value === undefined || value === null || (typeof value === 'string' && (value.trim() === "" || value.toLowerCase() === "null"))) {
              value = null;
            }
            
            if (schema?.businessLogic.amountColumns.includes(col) && value !== null) {
               const num = typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : Number(value);
               value = isNaN(num) ? null : num;
            }

            if (schema?.businessLogic.dateColumns.includes(col) && value !== null) {
              const date = parseDate(String(value));
              value = date ? date.toISOString().split('T')[0] : null;
            }

            if (col === pk && (value === null || value === undefined)) return;
            cleanedRow[col] = value;
          });
          return cleanedRow;
        }).filter(row => Object.values(row).some(v => v !== null));

        if (rowsToInsert.length > 0) {
          console.log(`Iniciando importación maestra en "${tableName}" usando PK: "${pk}"`);
          const { error } = await supabase.from(tableName).upsert(rowsToInsert, { onConflict: pk });
          if (error) {
            console.error(`Error detallado de Supabase (Master Import ${tableName}):`, error);
            toast.error(`Error: ${error.message}${error.details ? ' - ' + error.details : ''}`);
          } else {
            toast.success("Importación maestra completada.");
            setIsMasterImportModalOpen(false);
            setMasterImportFile(null);
            setMasterImportTarget('');
          }
        } else {
          toast.error("No se encontraron datos válidos.");
        }
      } else {
        toast.error("Archivo vacío.");
      }
      await syncData();
    } catch (error) {
      toast.error("Error al procesar archivo.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveData = async (newData: any) => {
    setIsSaving(true);
    const schema = schemas[activeTab];
    const pk = schema?.primaryKey || 'id';
    
    try {
      // Limpiar datos virtuales y manejar strings vacíos
      const dataToSave: any = {};
      Object.keys(newData).forEach(key => {
        if (VIRTUAL_COLUMNS.includes(key)) return;
        
        let value = newData[key];
        if (value === undefined || value === null || (typeof value === 'string' && (value.trim() === "" || value.toLowerCase() === "null"))) {
          value = null;
        }

        if (schema?.businessLogic.amountColumns.includes(key) && value !== null) {
          const num = typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : Number(value);
          value = isNaN(num) ? null : num;
        }

        dataToSave[key] = value;
      });
      
      console.log(`Iniciando guardado en tabla: "${activeTab}" usando PK: "${pk}"`, dataToSave);
      
      // Si el registro tiene la PK, es una actualización (UPSERT)
      const { error } = await supabase
        .from(activeTab)
        .upsert([dataToSave], { onConflict: pk });
      
      if (error) {
        console.error(`Error crítico de Supabase en tabla "${activeTab}":`, error);
        throw error;
      }
      
      await syncData();
      setIsAddModalOpen(false);
      setEditData(null);
      setFormData({});
    } catch (error: any) {
      console.error(`Fallo en handleSaveData para "${activeTab}":`, error);
      toast.error(`Error al guardar: ${error.message || 'Verifique los permisos RLS'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderSettingsView = () => (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
            <Settings size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight">Centro de Configuración</h3>
            <p className="text-sm font-medium text-slate-400">Personaliza tu experiencia en el dashboard</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Theme Switch */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Preferencia de Tema</h4>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] flex items-center justify-between border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700 text-amber-400' : 'bg-white text-indigo-600 shadow-sm'}`}>
                  {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <p className="text-sm font-black">{darkMode ? 'Modo Oscuro' : 'Modo Claro'}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Interfaz Visual</p>
                </div>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={`w-14 h-8 rounded-full transition-all relative ${darkMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* AI Tone Selector */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Personalización de IA</h4>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-slate-700 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <p className="text-sm font-black">Tono de la IA</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Configuración Global</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['Ejecutivo/Formal', 'Técnico/Detallado', 'Cercano/Informativo'].map(tone => (
                  <button
                    key={tone}
                    onClick={() => setAiTone(tone)}
                    className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border ${
                      aiTone === tone 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' 
                        : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {tone.split('/')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-indigo-50 dark:bg-indigo-500/10 p-6 rounded-[2rem] flex items-center gap-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-indigo-900 dark:text-indigo-100">Seguridad de Datos</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">Tus preferencias se guardan localmente para garantizar la privacidad y rapidez del sistema.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedAnalytics = () => {
    const invSchema = schemas['INVESTIGACIONES'];
    const certSegSchema = schemas['CERTIFICADOS DE SEGURIDAD'];
    const certBomSchema = schemas['CERTIFICADOS DE BOMBEROS'];

    const filterByTime = (data: any[], schema: TableSchema | undefined) => {
      if (!schema || !data.length) return [];
      const dateCol = schema.businessLogic.dateColumns[0];
      if (!dateCol) return data;
      return filterDataByTime(data, dateCol);
    };

    const invData = filterByTime(invSchema?.data || [], invSchema);
    const certSegData = filterByTime(certSegSchema?.data || [], certSegSchema);
    const certBomData = filterByTime(certBomSchema?.data || [], certBomSchema);
    
    // 1. Distribución de Certificados de Seguridad (Pie Chart)
    const certSegStats = [
      { name: 'Vencidos', value: certSegData.filter(i => i.Dias_por_Vencer <= 0).length, fill: SOFITASA_COLORS[1] },
      { name: 'Activos', value: certSegData.filter(i => i.Dias_por_Vencer > 0).length, fill: SOFITASA_COLORS[0] },
    ].filter(s => s.value > 0);

    // 1b. Distribución de Certificados de Bomberos (Pie Chart)
    const certBomStats = [
      { name: 'Vencidos', value: certBomData.filter(i => i.Dias_por_Vencer <= 0).length, fill: SOFITASA_COLORS[1] },
      { name: 'Activos', value: certBomData.filter(i => i.Dias_por_Vencer > 0).length, fill: SOFITASA_COLORS[2] },
    ].filter(s => s.value > 0);

    // 2. Riesgo por Agencia (Bar Chart)
    const agencyRisk = invData.reduce((acc: any, item: any) => {
      const agency = item.AgenciaReporta || 'Desconocida';
      acc[agency] = (acc[agency] || 0) + 1;
      return acc;
    }, {});
    const barData = Object.entries(agencyRisk)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // 3. Tipos de Hechos (Pie Chart)
    const hechosStats = invData.reduce((acc: any, item: any) => {
      const tipo = item.TipoHecho || 'Otros';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});
    const pieHechosData = Object.entries(hechosStats)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 4. Métricas de Impacto (Pie Chart para mejor comprensión)
    const totalExpuesto = invData.reduce((a, b) => a + (Number(b.MontoExpuesto) || 0), 0);
    const totalRecuperado = invData.reduce((a, b) => a + (Number(b.MontoRecuperado) || 0), 0);
    const totalAfectado = invData.reduce((a, b) => a + (Number(b.MontoAfectado) || 0), 0);
    
    const impactData = [
      { name: 'Recuperado', value: totalRecuperado, fill: '#10b981' }, // Esmeralda
      { name: 'Pérdida (Afectado)', value: totalAfectado, fill: '#ef4444' }, // Rojo
      { name: 'En Riesgo/Otros', value: Math.max(0, totalExpuesto - totalRecuperado - totalAfectado), fill: '#6366f1' } // Indigo
    ].filter(d => d.value > 0);

    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
      <div className="space-y-8">
        {/* Global Intelligence Action Card */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-white/20 transition-all" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h4 className="text-2xl font-black tracking-tight mb-2">Informe de Inteligencia Integral</h4>
              <p className="text-indigo-100 text-sm font-medium max-w-xl">
                Gemini 3 analizará todas las tablas (Investigaciones, Presupuestos, Certificados y Servicio Técnico) para generar una visión estratégica global de la institución.
              </p>
            </div>
            <button 
              onClick={handleGlobalAiAnalysis}
              disabled={isAnalyzing}
              className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {isAnalyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
              Generar Informe Global
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribución de Certificados de Seguridad */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Certificados de Seguridad</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={certSegStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {certSegStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} 
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución de Certificados de Bomberos */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Certificados de Bomberos</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={certBomStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {certBomStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} 
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Riesgo por Agencia */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Top Agencias con Riesgo</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SOFITASA_COLORS[index % SOFITASA_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tipos de Hechos */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Distribución de Hechos</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieHechosData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  stroke="none"
                >
                  {pieHechosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SOFITASA_COLORS[(index + 2) % SOFITASA_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Métricas de Impacto (Pie Chart con efecto 3D visual) */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-indigo-500/10 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all" />
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Efectividad de Recuperación</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={impactData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {impactData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend verticalAlign="bottom" height={36} iconType="diamond" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between items-center px-4">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">Tasa Recuperación</p>
              <p className="text-lg font-black text-emerald-600">
                {totalExpuesto > 0 ? ((totalRecuperado / totalExpuesto) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">Total Expuesto</p>
              <p className="text-lg font-black text-indigo-600">
                ${!isNaN(totalExpuesto) ? (totalExpuesto / 1000).toFixed(1) : '0.0'}k
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const [locationFilter, setLocationFilter] = useState<string>('all');

  const renderPresupuestosTable = (schema: TableSchema) => {
    const data = schema.data;

    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[#004a99] dark:text-blue-400">Gestión de Licitaciones</h2>
            <p className="text-sm text-slate-500">Comparativa de presupuestos y selección de proveedores</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleAiAnalysis('PRESUPUESTOS')}
              disabled={isAnalyzing || !data.length}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              <BrainCircuit size={14} />
              Analizar con IA
            </button>
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#004a99] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-xl transition-colors border border-[#004a99]/20 dark:border-blue-400/20"
            >
              <Download size={14} />
              Descargar Planilla
            </button>
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors cursor-pointer">
              <Upload size={14} />
              Subir Planilla
              <input 
                type="file" 
                className="hidden" 
                accept=".xlsx,.xls,.csv" 
                onChange={handleTabImport} 
                disabled={isSyncing}
              />
            </label>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#004a99] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#003875] transition-all shadow-md shadow-blue-900/20"
            >
              <Plus size={14} />
              Agregar Manual
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-[#004a99] text-white text-[10px] uppercase tracking-[0.15em] font-black">
                  <th className="px-6 py-4 whitespace-nowrap">Item / Descripción</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Empresa 1</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Empresa 2</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Empresa 3</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Empresa 4</th>
                  <th className="px-6 py-4 whitespace-nowrap bg-[#003875]">Empresa Seleccionada</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((item, idx) => {
                  const montos = [
                    { nombre: item.Empresa_1_Nombre, monto: Number(item.Empresa_1_Monto) || Infinity },
                    { nombre: item.Empresa_2_Nombre, monto: Number(item.Empresa_2_Monto) || Infinity },
                    { nombre: item.Empresa_3_Nombre, monto: Number(item.Empresa_3_Monto) || Infinity },
                    { nombre: item.Empresa_4_Nombre, monto: Number(item.Empresa_4_Monto) || Infinity },
                  ].filter(e => e.monto !== Infinity && e.nombre);

                  const minMonto = montos.length > 0 ? Math.min(...montos.map(m => m.monto)) : null;
                  const empresaSeleccionada = montos.find(m => m.monto === minMonto)?.nombre || 'N/A';

                  const isSelected = selectedItem === item;

                  return (
                    <tr 
                      key={idx} 
                      className={`
                        hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer
                        ${isSelected ? 'bg-blue-50 dark:bg-slate-800' : ''}
                      `}
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white max-w-[300px] truncate">
                        {item.Item_Descripcion || `Item ${idx + 1}`}
                      </td>
                      
                      {[1, 2, 3, 4].map(num => {
                        const nombre = item[`Empresa_${num}_Nombre`];
                        const monto = Number(item[`Empresa_${num}_Monto`]);
                        const isMin = monto === minMonto && monto !== Infinity;
                        
                        return (
                          <td key={num} className="px-6 py-4 text-sm text-center">
                            {nombre ? (
                              <div className={`flex flex-col items-center justify-center p-2 rounded-lg ${isMin ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50' : ''}`}>
                                <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">{nombre}</span>
                                <span className={`font-black ${isMin ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                  ${monto.toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            )}
                          </td>
                        );
                      })}
                      
                      <td className="px-6 py-4 text-sm font-black text-[#004a99] dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">
                        {empresaSeleccionada}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setEditData(item); 
                              setIsAddModalOpen(true); 
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Settings size={14} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-l-4 border-[#004a99] shadow-lg shadow-blue-900/5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[#004a99] dark:text-blue-400">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Justificación Técnica y Económica para Banco Sofitasa</h3>
                    <p className="text-sm text-slate-500">Análisis de Compliance y Selección</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const content = `REPORTE DE LICITACIÓN\n\nÍtem: ${selectedItem.Item_Descripcion}\n\nJustificación Técnica y Económica:\n${selectedItem.Justificacion_Apreciacion || 'N/A'}\n\nGenerado el: ${new Date().toLocaleDateString()}`;
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Reporte_${selectedItem.Item_Descripcion?.replace(/[^a-z0-9]/gi, '_') || 'Licitacion'}.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-[#004a99] text-white hover:bg-[#003875] px-4 py-2 rounded-xl transition-colors"
                >
                  <Download size={14} />
                  Exportar Reporte
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-slate-700 dark:text-slate-300 text-sm leading-relaxed border border-slate-100 dark:border-slate-800">
                {selectedItem.Justificacion_Apreciacion || "No se ha proporcionado justificación para este ítem."}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderTableContent = () => {
    if (isSyncing) return <SkeletonTable />;
    
    const schema = schemas[activeTab];
    
    if (!schema) return null;

    if (schema.status === 'loading') {
      return <SkeletonTable />;
    }

    if (activeTab === 'PRESUPUESTOS') {
      return renderPresupuestosTable(schema);
    }

    if (schema.status === 'error') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-rose-400">
          <AlertCircle className="w-16 h-16 mb-4" />
          <p className="text-xl font-black uppercase tracking-widest">Error de Conexión</p>
          <p className="text-sm mt-2">No se pudo acceder a la tabla "{activeTab}". Verifique los permisos en Supabase.</p>
        </div>
      );
    }

    const locationCol = schema.businessLogic.locationColumn;
    const locations = locationCol 
      ? Array.from(new Set(schema.data.map(item => item[locationCol]).filter(Boolean)))
      : [];

    const filteredData = locationCol && locationFilter !== 'all'
      ? schema.data.filter(item => item[locationCol] === locationFilter)
      : schema.data;

    const dateCol = schema.businessLogic.dateColumns[0];
    const finalData = dateCol ? filterDataByTime(filteredData, dateCol) : filteredData;

    // Vista simplificada para INVESTIGACIONES
    const isInvestigations = activeTab === 'INVESTIGACIONES';
    
    // Buscar la columna real de ID de Caso (puede variar en mayúsculas/minúsculas o guiones)
    const realIdCasoCol = schema.columns.find(c => 
      c.toLowerCase() === 'idcaso' || 
      c.toLowerCase() === 'id_caso' || 
      c.toLowerCase() === 'id caso' ||
      c.toLowerCase() === 'numexpediente'
    ) || 'IdCaso';

    const displayColumns = (isInvestigations 
      ? [realIdCasoCol, 'FechaReclamo', 'AgenciaReporta', 'MontoExpuesto']
      : schema.columns).filter(col => col.toLowerCase() !== 'id');

    const isCertificados = activeTab.includes('CERTIFICADOS');

    let stats = null;
    if (isCertificados && finalData.length > 0) {
      const expired = finalData.filter(item => item.Dias_por_Vencer < 0).length;
      const warning = finalData.filter(item => item.Dias_por_Vencer >= 0 && item.Dias_por_Vencer <= 30).length;
      const active = finalData.length - expired - warning;
      stats = { expired, warning, active, total: finalData.length };
    }

    return (
      <div className="space-y-4">
        {isCertificados && stats && (
          <div className="px-8 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-400">Total</p>
                <p className="text-3xl font-black text-indigo-500">{stats.total}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-xl">
                <p className="text-sm font-bold text-emerald-500">Activos</p>
                <p className="text-3xl font-black text-emerald-600">{stats.active}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-xl">
                <p className="text-sm font-bold text-amber-500">Por Vencer</p>
                <p className="text-3xl font-black text-amber-600">{stats.warning}</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950 p-4 rounded-xl">
                <p className="text-sm font-bold text-rose-500">Vencidos</p>
                <p className="text-3xl font-black text-rose-600">{stats.expired}</p>
              </div>
            </div>
          </div>
        )}

        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/30 border-y border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6">
            {locationCol && locations.length > 0 && (
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-400" />
                <select 
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                >
                  <option value="all">Todas las Ubicaciones</option>
                  {locations.map((loc: any) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#004a99] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-xl transition-colors border border-[#004a99]/20 dark:border-blue-400/20"
            >
              <Download size={14} />
              Descargar Planilla
            </button>
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 px-4 py-2 rounded-xl transition-colors border border-emerald-600/20 cursor-pointer">
              <Upload size={14} />
              Subir Planilla
              <input 
                type="file" 
                className="hidden" 
                accept=".xlsx,.xls,.csv" 
                onChange={handleTabImport} 
                disabled={isSyncing}
              />
            </label>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#004a99] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#003875] transition-all shadow-md shadow-blue-900/20"
            >
              <Plus size={14} />
              Agregar Información
            </button>
          </div>
        </div>

        {schema.status === 'empty' || schema.data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">
                  {displayColumns.map(col => (
                    <th key={col} className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      {formatHeader(col)}
                    </th>
                  ))}
                  <th className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {finalData.map((item, idx) => {
                  const isExpired = item.Dias_por_Vencer !== undefined && item.Dias_por_Vencer < 0;
                  const isToday = item.Dias_por_Vencer !== undefined && item.Dias_por_Vencer === 0;
                  const isWarning = item.Dias_por_Vencer !== undefined && item.Dias_por_Vencer > 0 && item.Dias_por_Vencer <= 30;

                  return (
                    <tr key={idx} className={`
                      hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-0.5 hover:scale-[1.01] relative z-0 hover:z-10 transition-all duration-300 group cursor-pointer
                      ${isExpired ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}
                      ${isToday || isWarning ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}
                    `} onClick={() => { setSelectedItem(item); setIsDetailDrawerOpen(true); }}>
                      {displayColumns.map(col => {
                        const isDate = schema.businessLogic.dateColumns.includes(col);
                        const isAmount = schema.businessLogic.amountColumns.includes(col);
                        const isLocation = schema.businessLogic.locationColumn === col;
                        const isRemainingDays = col === 'Dias_por_Vencer';
                        const isVigencia = col === 'Vigencia_Total';
                        const isReportStatus = col === 'Estado_Solicitud' && activeTab === 'SERVICIO TECNICO';
                        
                        return (
                          <td key={col} className="px-6 py-4 text-sm whitespace-nowrap">
                            {isReportStatus ? (
                              <select
                                value={item[col] || 'Pendiente'}
                                onClick={(e) => e.stopPropagation()}
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  const pk = schema.primaryKey;
                                  
                                  try {
                                    const { error } = await supabase
                                      .from(activeTab)
                                      .update({ [col]: newStatus })
                                      .eq(pk, item[pk]);
                                    
                                    if (error) throw error;
                                    toast.success("Estado actualizado");
                                    syncData();
                                  } catch (err: any) {
                                    console.error("Error al actualizar estado:", err);
                                    toast.error("No se pudo guardar el estado. ¿Existe la columna 'Estado_Solicitud' en Supabase?");
                                  }
                                }}
                                className={`
                                  px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest outline-none border-none cursor-pointer
                                  ${item[col] === 'Atendida' ? 'bg-emerald-100 text-emerald-600' : 
                                    item[col] === 'En Proceso' ? 'bg-amber-100 text-amber-600' : 
                                    item[col] === 'Denegada' ? 'bg-rose-100 text-rose-600' : 
                                    'bg-slate-100 text-slate-600'}
                                `}
                              >
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Proceso">En Proceso</option>
                                <option value="Atendida">Atendida</option>
                                <option value="Denegada">Denegada</option>
                              </select>
                            ) : (
                              <span className={`
                                ${isDate ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}
                                ${isAmount ? 'font-black text-slate-900 dark:text-white' : ''}
                                ${isVigencia ? 'font-mono font-bold text-slate-600 dark:text-slate-400' : ''}
                                ${isLocation ? 'text-emerald-600 dark:text-emerald-400 italic' : ''}
                                ${isRemainingDays ? (isExpired ? 'text-rose-600 font-black' : (isWarning || isToday) ? 'text-amber-600 font-black' : 'text-slate-400 font-bold') : ''}
                                ${!isDate && !isAmount && !isLocation && !isRemainingDays && !isVigencia ? 'text-slate-600 dark:text-slate-400' : ''}
                              `}>
                                {isAmount && typeof item[col] === 'number' ? (
                                   (col.toLowerCase().includes('solicitud') || col.toLowerCase().includes('nro')) ? 
                                   item[col].toString() : 
                                   `$${item[col].toLocaleString()}`
                                 ) : 
                                 isRemainingDays ? (item[col] < 0 ? 'VENCIDO' : item[col] === 0 ? 'VENCE HOY' : `${item[col]} días`) :
                                 isVigencia ? `${item[col]} días` :
                                 String(item[col] ?? '-')}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setEditData(item); 
                              setIsAddModalOpen(true); 
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Settings size={14} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation();
                              handleDelete(item[schema.primaryKey]);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const handleDelete = async (pkValue: any) => {
    const schema = schemas[activeTab];
    const pk = schema?.primaryKey || 'id';

    if (window.confirm(`¿Estás seguro de que quieres eliminar este registro de "${activeTab}"?`)) {
      try {
        console.log(`Iniciando eliminación en tabla: "${activeTab}" donde ${pk} =`, pkValue);
        
        const { error } = await supabase
          .from(activeTab)
          .delete()
          .eq(pk, pkValue);

        if (error) {
          console.error(`Error crítico de Supabase al eliminar en "${activeTab}":`, error);
          alert(`Error al eliminar: ${error.message}`);
        } else {
          alert('Registro eliminado exitosamente.');
          syncData();
        }
      } catch (error) {
        console.error(`Excepción al eliminar en "${activeTab}":`, error);
      }
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setLocationFilter('all');
    setAiResult(null);
  };

  const getAlerts = () => {
    const alerts: any[] = [];
    ['CERTIFICADOS DE BOMBEROS', 'CERTIFICADOS DE SEGURIDAD'].forEach(table => {
      const schema = schemas[table];
      if (schema && schema.data) {
        schema.data.forEach(item => {
          if (item.Dias_por_Vencer !== undefined) {
            if (item.Dias_por_Vencer <= 0) {
              alerts.push({ table, item, type: 'expired' });
            } else if (item.Dias_por_Vencer <= 30) {
              alerts.push({ table, item, type: 'warning' });
            }
          }
        });
      }
    });
    return alerts;
  };

  const filterDataByTime = (data: any[], dateCol: string) => {
    if (timeFilter === 'all') return data;
    const now = new Date();
    return data.filter(item => {
      const date = parseDate(String(item[dateCol]));
      if (!date || isNaN(date.getTime())) return false;
      if (timeFilter === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'year') {
        return date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const renderHistoryView = () => {
    const invSchema = schemas['INVESTIGACIONES'];
    const preSchema = schemas['PRESUPUESTOS'];
    
    const combinedData: any[] = [];
    if (invSchema) invSchema.data.forEach(d => combinedData.push({ ...d, _source: 'INVESTIGACIONES' }));
    if (preSchema) preSchema.data.forEach(d => combinedData.push({ ...d, _source: 'PRESUPUESTOS' }));

    if (combinedData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <History className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-xl font-black uppercase tracking-widest opacity-40">Sin Historial</p>
          <p className="text-sm mt-2">Sincroniza los datos para ver el historial.</p>
        </div>
      );
    }

    // Agrupar por Mes y Año
    const grouped = combinedData.reduce((acc: any, item: any) => {
      const dateCol = item._source === 'INVESTIGACIONES' 
        ? (invSchema?.businessLogic.dateColumns[0] || 'FechaReclamo')
        : (preSchema?.businessLogic.dateColumns[0] || 'Fecha');
      
      const dateStr = item[dateCol];
      if (!dateStr) return acc;
      
      const date = parseDate(String(dateStr));
      if (!date || isNaN(date.getTime())) return acc;

      const monthYear = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(item);
      return acc;
    }, {});

    return (
      <div className="space-y-12">
        {Object.keys(grouped).sort((a, b) => {
          const dateA = new Date(grouped[a][0].FechaReclamo || grouped[a][0].Fecha);
          const dateB = new Date(grouped[b][0].FechaReclamo || grouped[b][0].Fecha);
          return dateB.getTime() - dateA.getTime();
        }).map(period => {
          const periodData = grouped[period];
          const invCount = periodData.filter((d: any) => d._source === 'INVESTIGACIONES').length;
          const preCount = periodData.filter((d: any) => d._source === 'PRESUPUESTOS').length;
          
          const chartData = [
            { name: 'Investigaciones', value: invCount },
            { name: 'Presupuesto', value: preCount }
          ].filter(d => d.value > 0);

          const COLORS = ['#6366f1', '#10b981'];

          return (
            <div key={period} className="relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
                  <Calendar size={20} />
                </div>
                <h3 className="text-2xl font-black capitalize tracking-tight">{period}</h3>
                <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Distribución Mensual</h4>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          paddingAngle={5}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {periodData.slice(0, 4).map((item: any, idx: number) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ y: -5 }}
                      className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                          item._source === 'INVESTIGACIONES' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                        }`}>
                          {item._source}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {item.FechaReclamo || item.Fecha}
                        </span>
                      </div>
                      <h4 className="font-black text-lg mb-2 line-clamp-1">{item.TipoHecho || item.Concepto || 'Sin Título'}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                        {item.Descripcion || item.Observaciones || 'Registro de actividad mensual.'}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="font-black text-slate-900 dark:text-white">
                          ${item.MontoAfectado || item.Monto || 0}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-500">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all duration-300
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'md:w-20' : 'md:w-72 w-72'}
      `}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 shadow-md z-40 text-slate-400 hover:text-indigo-600 hover:scale-110 transition-all hidden md:flex"
        >
          <ChevronRight size={14} className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
        </button>
        <div className={`p-8 pb-4 ${isCollapsed ? 'px-4' : ''}`}>
          <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/40 rotate-3">
              <ShieldCheck className="text-white w-7 h-7" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-black text-xl tracking-tighter leading-none">SOFITASA</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Security Intel</p>
              </div>
            )}
          </div>
        </div>
        
        <div className={`flex-1 overflow-y-auto px-8 pb-8 space-y-2 scrollbar-hide ${isCollapsed ? 'px-4' : ''}`}>
          <nav className="space-y-2">
            <SidebarItem 
              icon={<LayoutDashboard size={18} />} 
              label="Vista General" 
              active={activeTab === 'overview'} 
              onClick={() => handleTabChange('overview')} 
              isCollapsed={isCollapsed}
            />
            <SidebarItem 
              icon={<History size={18} />} 
              label="Historial de Avance" 
              active={activeTab === 'history'} 
              onClick={() => handleTabChange('history')} 
              isCollapsed={isCollapsed}
            />
            <SidebarItem 
              icon={<Settings size={18} />} 
              label="Configuración" 
              active={activeTab === 'settings'} 
              onClick={() => handleTabChange('settings')} 
              isCollapsed={isCollapsed}
            />
            <div className={`pt-4 pb-2 ${isCollapsed ? 'hidden' : ''}`}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">Módulos de Datos</p>
            </div>
            <div className="space-y-1">
              <SidebarItem 
                icon={<Database size={18} />} 
                label="Investigaciones" 
                active={activeTab === 'INVESTIGACIONES'} 
                onClick={() => handleTabChange('INVESTIGACIONES')} 
                isCollapsed={isCollapsed}
              />
              <SidebarItem 
                icon={<ShieldCheck size={18} />} 
                label="Cert. Seguridad" 
                active={activeTab === 'CERTIFICADOS DE SEGURIDAD'} 
                onClick={() => handleTabChange('CERTIFICADOS DE SEGURIDAD')} 
                isCollapsed={isCollapsed}
              />
              <SidebarItem 
                icon={<Flame size={18} />} 
                label="Cert. Bomberos" 
                active={activeTab === 'CERTIFICADOS DE BOMBEROS'} 
                onClick={() => handleTabChange('CERTIFICADOS DE BOMBEROS')} 
                isCollapsed={isCollapsed}
              />
              <SidebarItem 
                icon={<TrendingUp size={18} />} 
                label="Presupuestos" 
                active={activeTab === 'PRESUPUESTOS'} 
                onClick={() => handleTabChange('PRESUPUESTOS')} 
                isCollapsed={isCollapsed}
              />
              <SidebarItem 
                icon={<UserMinus size={18} />} 
                label="Retiros Voluntarios" 
                active={activeTab === 'RETIROS VOLUNTARIOS'} 
                onClick={() => handleTabChange('RETIROS VOLUNTARIOS')} 
                isCollapsed={isCollapsed}
              />
              <SidebarItem 
                icon={<FileText size={18} />} 
                label="Servicio Técnico" 
                active={activeTab === 'SERVICIO TECNICO'} 
                onClick={() => handleTabChange('SERVICIO TECNICO')} 
                isCollapsed={isCollapsed}
              />
            </div>
          </nav>
        </div>
        
        <div className={`mt-auto p-8 border-t border-slate-100 dark:border-slate-800 space-y-4 shrink-0 ${isCollapsed ? 'px-4 flex justify-center' : ''}`}>
          <button 
            onClick={() => supabase.auth.signOut()}
            className={`flex items-center gap-3 text-slate-400 hover:text-rose-500 transition-all font-bold text-sm group ${isCollapsed ? 'justify-center' : 'w-full'}`}
            title={isCollapsed ? "Cerrar Sesión" : undefined}
          >
            <div className="p-2 rounded-lg group-hover:bg-rose-50 dark:group-hover:bg-rose-500/10 transition-colors">
              <LogOut size={18} />
            </div>
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:px-10 z-10 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">
                {activeTab === 'overview' ? 'Panel de Control' : 
                 activeTab === 'history' ? 'Historial de Avance' : 
                 activeTab === 'settings' ? 'Configuración' : formatHeader(activeTab)}
              </h2>
              <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1 hidden sm:block">
                {activeTab === 'overview' ? 'Resumen ejecutivo de seguridad' : 
                 activeTab === 'history' ? 'Cronología de investigaciones agrupadas' : 
                 activeTab === 'settings' ? 'Preferencias del sistema y personalización' : `Gestión y monitoreo de ${activeTab.toLowerCase()}`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeFilter === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Este Mes
              </button>
              <button
                onClick={() => setTimeFilter('year')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeFilter === 'year' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Este Año
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeFilter === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Histórico
              </button>
            </div>
            
            <button 
              onClick={() => setIsMasterImportModalOpen(true)}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl text-sm font-black transition-all hover:bg-emerald-700 hover:scale-105 active:scale-95 shadow-xl shadow-emerald-600/20 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Importación Maestra</span>
            </button>

            <button 
              onClick={syncData}
              disabled={isSyncing}
              className="flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/20 dark:shadow-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-[1600px] mx-auto space-y-10">
            {activeTab === 'overview' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard title="Investigaciones" value={schemas['INVESTIGACIONES']?.data.length || 0} icon={<ShieldCheck className="text-indigo-600" />} />
                  <StatCard title="Reportes Activos" value={schemas['SERVICIO TECNICO']?.data.length || 0} icon={<FileText className="text-emerald-600" />} />
                  <StatCard title="Presupuestos" value={schemas['PRESUPUESTOS']?.data.length || 0} icon={<TrendingUp className="text-amber-600" />} />
                  <StatCard title="Alertas" value={getAlerts().length} icon={<AlertCircle className="text-rose-600" />} />
                </div>

                {/* Análisis Avanzado */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="text-indigo-600 w-6 h-6" />
                    <h3 className="text-xl font-black tracking-tight">Análisis Inteligente de Datos</h3>
                  </div>
                  {renderAdvancedAnalytics()}
                </div>

                {getAlerts().length > 0 && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-6 rounded-[2rem] flex items-center gap-6">
                    <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                      <Bell className="animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-black text-rose-900 dark:text-rose-100">Motor de Alertas Activo</h4>
                      <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">
                        Tienes {getAlerts().filter(a => a.table === 'CERTIFICADOS DE BOMBEROS' && a.type === 'warning').length} Certificados de Bomberos y {getAlerts().filter(a => a.table === 'CERTIFICADOS DE SEGURIDAD' && a.type === 'warning').length} de Seguridad próximos a vencer. 
                        Además, {getAlerts().filter(a => a.type === 'expired').length} ya han vencido.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-black mb-6">Actividad Reciente</h3>
                    <div className="space-y-4">
                      {schemas['INVESTIGACIONES']?.data.slice(0, 5).map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <ShieldCheck size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold">{item.TipoHecho || 'Investigación'}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.FechaReclamo || 'Reciente'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black">${item.MontoAfectado || 0}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/40">
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-3">
                        <BrainCircuit className="w-8 h-8" />
                        <h3 className="text-xl font-black">Asistente Gemini 3</h3>
                      </div>
                      <p className="text-indigo-100 text-sm leading-relaxed font-medium">
                        El sistema ha detectado una correlación inusual entre los reportes de la zona norte y los certificados de bomberos próximos a vencer. ¿Deseas un análisis detallado?
                      </p>
                      <button 
                        onClick={() => {
                          handleTabChange('INVESTIGACIONES');
                          setTimeout(() => handleAiAnalysis('INVESTIGACIONES'), 500);
                        }}
                        className="bg-white text-indigo-600 px-6 py-3 rounded-xl text-sm font-black hover:bg-indigo-50 transition-colors"
                      >
                        Generar Reporte IA
                      </button>
                    </div>
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                  </div>
                </div>
              </>
            ) : activeTab === 'history' ? (
              renderHistoryView()
            ) : activeTab === 'settings' ? (
              renderSettingsView()
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {activeTab !== 'PRESUPUESTOS' && (
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-xl tracking-tight">Explorador de Datos</h3>
                      <p className="text-xs font-medium text-slate-400 mt-1">Visualización técnica de la tabla {activeTab}</p>
                    </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                          <Settings size={14} className="text-slate-400 ml-2" />
                          <select 
                            value={aiTone}
                            onChange={(e) => setAiTone(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer pr-2"
                          >
                            <option value="Ejecutivo/Formal">Ejecutivo</option>
                            <option value="Técnico/Detallado">Técnico</option>
                            <option value="Cercano/Informativo">Cercano</option>
                          </select>
                        </div>
                        <button 
                          onClick={() => handleAiAnalysis()}
                          disabled={isAnalyzing || !schemas[activeTab]?.data.length}
                          className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-black text-sm hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
                        >
                          <BrainCircuit className="w-5 h-5" />
                          Analizar con Gemini 3
                        </button>
                      </div>
                  </div>
                )}
                
                {renderTableContent()}
              </div>
            )}

            {/* AI Analysis Result */}
            <AnimatePresence>
              {aiResult && (
                <motion.div 
                  ref={aiResultRef}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-900 dark:bg-indigo-950/40 border border-slate-800 dark:border-indigo-500/20 rounded-[3rem] p-10 text-white shadow-2xl"
                >
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
                      <BrainCircuit className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">Análisis Inteligente: {formatHeader(activeTab)}</h3>
                      <p className="text-indigo-300/60 text-xs font-bold uppercase tracking-widest mt-1">Gemini 3 Engine</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="space-y-4">
                      <h4 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-400">Resumen Ejecutivo</h4>
                      <p className="text-sm leading-relaxed text-slate-300 font-medium">{aiResult.summary}</p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-400">Correlaciones</h4>
                      <ul className="space-y-3">
                        {aiResult.correlations?.map((c: string, i: number) => (
                          <li key={i} className="flex gap-3 text-sm text-slate-300 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-400">Predicciones</h4>
                      <ul className="space-y-3">
                        {aiResult.predictions?.map((p: string, i: number) => (
                          <li key={i} className="flex gap-3 text-sm text-slate-300 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-10 pt-10 border-t border-slate-800 flex justify-end">
                    <button 
                      onClick={() => setAiResult(null)}
                      className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                    >
                      Cerrar Informe
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* AI Loading Overlay */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white"
            >
              <div className="relative">
                <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <BrainCircuit className="w-10 h-10 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="mt-8 text-2xl font-black tracking-tight">Gemini 3 está analizando...</h3>
              <p className="mt-2 text-indigo-300/60 font-bold uppercase tracking-widest text-xs">Procesando inteligencia de datos</p>
              
              <div className="mt-12 flex gap-2">
                {[0, 1, 2].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                    className="w-2 h-2 bg-indigo-500 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Master Import Modal */}
      <AnimatePresence>
        {isMasterImportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight">Importación Maestra</h3>
                <button onClick={() => setIsMasterImportModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Módulo Destino</label>
                  <select 
                    value={masterImportTarget}
                    onChange={(e) => setMasterImportTarget(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Seleccione un destino...</option>
                    <option value="Investigaciones">Investigaciones</option>
                    <option value="Cert. Seguridad">Cert. Seguridad</option>
                    <option value="Cert. Bomberos">Cert. Bomberos</option>
                    <option value="Presupuestos">Presupuestos</option>
                    <option value="Retiros Voluntarios">Retiros Voluntarios</option>
                    <option value="Servicio de Reportes">Servicio de Reportes</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Archivo de Datos</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {masterImportFile ? masterImportFile.name : "Click para subir archivo"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">.xlsx, .xls, .csv</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".xlsx,.xls,.csv" 
                      onChange={(e) => setMasterImportFile(e.target.files?.[0] || null)} 
                    />
                  </label>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <button 
                  onClick={handleMasterImport}
                  disabled={isSyncing || !masterImportFile || !masterImportTarget}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:hover:scale-100 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  {isSyncing ? 'Procesando...' : 'Iniciar Importación'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Data Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-2xl font-black tracking-tight">{editData ? 'Editar Registro' : `Agregar a ${formatHeader(activeTab)}`}</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="bg-indigo-50 dark:bg-indigo-500/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/20">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BrainCircuit size={14} />
                    Ingreso Automatizado (IA)
                  </h4>
                  <textarea 
                    placeholder="Pega aquí un párrafo con la información. La IA identificará los campos automáticamente..."
                    className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 min-h-[120px] outline-none"
                    onBlur={async (e) => {
                      const text = e.target.value;
                      if (text.length > 20) {
                        const parsed = await parseTextToData(text, schemas[activeTab]?.columns || []);
                        if (parsed) {
                          setFormData(prev => ({ ...prev, ...parsed }));
                          alert("IA ha identificado los campos. Revise el formulario manual.");
                        }
                      }
                    }}
                  />
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Ingreso Manual / Edición</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {schemas[activeTab]?.columns.filter(c => c !== 'id' && !VIRTUAL_COLUMNS.includes(c)).map(col => (
                      <div key={col} className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{formatHeader(col)}</label>
                        <input 
                          type={schemas[activeTab]?.businessLogic.dateColumns.includes(col) ? 'date' :
                            schemas[activeTab]?.businessLogic.amountColumns.includes(col) ? 'number' : 'text'}
                          value={formData[col] || ''}
                          onChange={(e) => {
                            const { value, type } = e.target;
                            setFormData(prev => ({ 
                              ...prev, 
                              [col]: type === 'date' ? new Date(value).toISOString().split('T')[0] : value 
                            }))
                          }}
                          placeholder={`Ingrese ${formatHeader(col)}`}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          disabled={col === 'id' || VIRTUAL_COLUMNS.includes(col)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-4">
                <button 
                  onClick={() => { setIsAddModalOpen(false); setFormData({}); }}
                  className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleSaveData(formData)}
                  disabled={isSaving}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Registro'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Drawer */}
      <AnimatePresence>
        {isDetailDrawerOpen && selectedItem && activeTab !== 'PRESUPUESTOS' && (
          <div className="fixed inset-0 z-[110] flex justify-end bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col"
            >
              <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Expediente Detallado</h3>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">{activeTab}</p>
                </div>
                <button onClick={() => setIsDetailDrawerOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                {Object.entries(selectedItem).filter(([key]) => key !== 'id').map(([key, value]) => {
                  const isRemainingDays = key === 'Dias_por_Vencer';
                  const isExpired = isRemainingDays && (value as number) <= 0;
                  const isWarning = isRemainingDays && (value as number) > 0 && (value as number) < 30;

                  return (
                    <div key={key} className="space-y-2 pb-4 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatHeader(key)}</p>
                      <p className={`text-lg font-bold ${
                        isRemainingDays ? (isExpired ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600') : 'text-slate-900 dark:text-white'
                      }`}>
                        {isRemainingDays ? (isExpired ? 'VENCIDO' : `${value} días`) : String(value ?? 'N/A')}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <button 
                  onClick={() => setIsDetailDrawerOpen(false)}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-sm shadow-xl transition-all hover:scale-[1.02]"
                >
                  Cerrar Expediente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailItem = ({ label, value, icon, fullWidth }: any) => (
  <div className={`${fullWidth ? 'col-span-2' : ''} space-y-1`}>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
      {icon}
      {label}
    </p>
    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
      {String(value || 'N/A')}
    </p>
  </div>
);

const SidebarItem = ({ icon, label, active, onClick, isCollapsed }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-5'} py-3.5 rounded-2xl font-black text-sm transition-all duration-300 ${
      active 
        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 scale-[1.02]' 
        : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
    }`}
    title={isCollapsed ? label : undefined}
  >
    <div className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`}>
      {icon}
    </div>
    {!isCollapsed && <span className="truncate">{label}</span>}
  </button>
);

const StatCard = ({ title, value, icon, colorIndex = 0 }: any) => (
  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6 group hover:border-indigo-500/50 transition-all">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: `${SOFITASA_COLORS[colorIndex]}15`, color: SOFITASA_COLORS[colorIndex] }}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
      <p className="text-3xl font-black mt-1 tracking-tight text-slate-900 dark:text-white">{value}</p>
    </div>
  </div>
);

