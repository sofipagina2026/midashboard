import React from 'react';
import { Upload, CheckCircle2, AlertCircle, RefreshCw, PenLine, Sparkles, ShieldCheck, Table as TableIcon, Download, FileSpreadsheet, Layers, ArrowRight, Database } from 'lucide-react';
import { classifyAndProcessData } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';

interface Props {
  onUploadSuccess: () => void;
}

// Enhanced SECTIONS config with Supabase table names and column mappings
const SECTIONS = {
  cases: {
    id: 'cases',
    label: 'Investigaciones',
    tableName: 'INVESTIGACIONES',
    templateHeaders: ['ID_Caso', 'FechaReclamo', 'NumExpediente', 'NumReclamo', 'Investigador', 'AgenciaReporta', 'TipoHecho', 'AgenciaOrigen', 'Vicepresidencia', 'FechaHecho', 'Descripcion', 'MontoExpuesto', 'MontoAfectado', 'MontoRecuperado', 'CanalTransaccional', 'Conclusion', 'ClienteReceptor', 'Estatus'],
    columnMap: {
      'ID_Caso': 'ID_Caso',
      'FechaReclamo': 'FechaReclamo',
      'NumExpediente': 'NumExpediente',
      'NumReclamo': 'NumReclamo',
      'Investigador': 'Investigador',
      'AgenciaReporta': 'AgenciaReporta',
      'TipoHecho': 'TipoHecho',
      'AgenciaOrigen': 'AgenciaOrigen',
      'Vicepresidencia': 'Vicepresidencia',
      'FechaHecho': 'FechaHecho',
      'Descripcion': 'Descripcion',
      'MontoExpuesto': 'MontoExpuesto',
      'MontoAfectado': 'MontoAfectado',
      'MontoRecuperado': 'MontoRecuperado',
      'CanalTransaccional': 'CanalTransaccional',
      'Conclusion': 'Conclusion',
      'ClienteReceptor': 'ClienteReceptor',
      'Estatus': 'Estatus'
    }
  },
  reports: {
    id: 'reports',
    label: 'Servicio Técnico',
    tableName: 'SERVICIO TECNICO',
    templateHeaders: ['Solicitud', 'Nro', 'Agencia _Pto_De_Serv _Depto', 'F_Solicitud', 'Reportado', 'Tipo_De_Solicitud', 'Proveedor', 'Observacion', 'Fecha_De_Atencion'],
    columnMap: {
      'Solicitud': 'Solicitud',
      'Nro': 'Nro',
      'Agencia _Pto_De_Serv _Depto': 'Agencia _Pto_De_Serv _Depto',
      'F_Solicitud': 'F_Solicitud',
      'Reportado': 'Reportado',
      'Tipo_De_Solicitud': 'Tipo_De_Solicitud',
      'Proveedor': 'Proveedor',
      'Observacion': 'Observacion',
      'Fecha_De_Atencion': 'Fecha_De_Atencion'
    }
  },
  seguridad: {
    id: 'seguridad',
    label: 'Cert. Seguridad',
    tableName: 'CERTIFICADOS DE SEGURIDAD',
    templateHeaders: ['N', 'ESTADO', 'FECHA_DE_VENCIMIENTO', 'FECHA_DE_EXPEDICION', 'NDECERTIFICACION', 'OFICINA', 'FECHA_ACTUAL'],
    columnMap: { 
      'N': 'N', 
      'ESTADO': 'ESTADO',
      'FECHA_DE_VENCIMIENTO': 'FECHA_DE_VENCIMIENTO',
      'FECHA_DE_EXPEDICION': 'FECHA_DE_EXPEDICION',
      'NDECERTIFICACION': 'NDECERTIFICACION',
      'OFICINA': 'OFICINA',
      'FECHA_ACTUAL': 'FECHA_ACTUAL'
    }
  },
  bomberos: {
    id: 'bomberos',
    label: 'Cert. Bomberos',
    tableName: 'CERTIFICADOS DE BOMBEROS',
    templateHeaders: ['N', 'ESTADO', 'FECHA_DE_VENCIMIENTO', 'FECHA_DE_EXPEDICION', 'NDECERTIFICACION', 'OFICINA', 'FECHA_ACTUAL'],
    columnMap: { 
      'N': 'N', 
      'ESTADO': 'ESTADO',
      'FECHA_DE_VENCIMIENTO': 'FECHA_DE_VENCIMIENTO',
      'FECHA_DE_EXPEDICION': 'FECHA_DE_EXPEDICION',
      'NDECERTIFICACION': 'NDECERTIFICACION',
      'OFICINA': 'OFICINA',
      'FECHA_ACTUAL': 'FECHA_ACTUAL'
    }
  },
  cctv: {
    id: 'cctv',
    label: 'Presupuestos',
    tableName: 'PRESUPUESTOS',
    templateHeaders: ['Item_Descripcion', 'Empresa_1_Nombre', 'Empresa_1_Monto', 'Empresa_2_Nombre', 'Empresa_2_Monto', 'Empresa_3_Nombre', 'Empresa_3_Monto', 'Empresa_4_Nombre', 'Empresa_4_Monto'],
    columnMap: { 
      'Item_Descripcion': 'Item_Descripcion', 
      'Empresa_1_Nombre': 'Empresa_1_Nombre', 
      'Empresa_1_Monto': 'Empresa_1_Monto', 
      'Empresa_2_Nombre': 'Empresa_2_Nombre', 
      'Empresa_2_Monto': 'Empresa_2_Monto', 
      'Empresa_3_Nombre': 'Empresa_3_Nombre', 
      'Empresa_3_Monto': 'Empresa_3_Monto', 
      'Empresa_4_Nombre': 'Empresa_4_Nombre', 
      'Empresa_4_Monto': 'Empresa_4_Monto'
    }
  },
  retiros: {
    id: 'retiros',
    label: 'Retiros Voluntarios',
    tableName: 'RETIROS VOLUNTARIOS',
    templateHeaders: ['Nro', 'EMPLEADO', 'CEDULA', 'CARGO', 'ADSCRITOA', 'EXPEDIENTE'],
    columnMap: { 
      'Nro': 'Nro', 
      'EMPLEADO': 'EMPLEADO', 
      'CEDULA': 'CEDULA', 
      'CARGO': 'CARGO', 
      'ADSCRITOA': 'ADSCRITOA', 
      'EXPEDIENTE': 'EXPEDIENTE'
    }
  }
};

export const SecurityUpload: React.FC<Props> = ({ onUploadSuccess }) => {
  const [step, setStep] = React.useState(1);
  const [file, setFile] = React.useState<File | null>(null);
  const [sheetNames, setSheetNames] = React.useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = React.useState('');
  const [targetSection, setTargetSection] = React.useState<keyof typeof SECTIONS>('cases');
  const [processing, setProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [progressMsg, setProgressMsg] = React.useState('');
  const [status, setStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);

  const downloadTemplate = async () => {
    try {
      setProcessing(true);
      setProgressMsg('Sincronizando con Supabase...');
      toast.loading('Sincronizando con Supabase...', { id: 'template' });
      
      const wb = XLSX.utils.book_new();
      
      for (const section of Object.values(SECTIONS)) {
        // Escaneo Dinámico de Columnas: SELECT *
        const { data, error } = await supabase.from(section.tableName).select('*').limit(1);
        
        if (error) {
          throw new Error(`Error de conexión con la tabla ${section.tableName}: ${error.message}`);
        }

        let columns: string[] = [];
        if (data && data.length > 0) {
          columns = Object.keys(data[0]);
        } else {
          // Reglas de Integridad: Si una tabla está vacía, la pestaña debe quedar solo con sus encabezados reales de la DB
          // Como la API REST no devuelve columnas si está vacía, usamos los headers predefinidos que coinciden con la DB
          columns = section.templateHeaders;
        }

        // NO AGREGUES LA COLUMNA id ya que debe permanecer oculta
        columns = columns.filter(col => col.toLowerCase() !== 'id');

        const ws = XLSX.utils.aoa_to_sheet([columns]);
        XLSX.utils.book_append_sheet(wb, ws, section.label.substring(0, 31));
      }

      XLSX.writeFile(wb, 'Plantilla_Sincronizada_Supabase.xlsx');
      toast.success('Plantilla generada y sincronizada con Supabase', { id: 'template' });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error de conexión con Supabase', { id: 'template' });
    } finally {
      setProcessing(false);
      setProgressMsg('');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setStatus(null);
      setStep(2);
      setProcessing(true);
      setProgressMsg('Analizando archivo...');
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', bookSheets: true });
          setSheetNames(workbook.SheetNames);
          if (workbook.SheetNames.length > 0) setSelectedSheet(workbook.SheetNames[0]);
          setProcessing(false);
        };
        reader.readAsArrayBuffer(selectedFile);
      } catch (error) {
        setStatus({ type: 'error', message: 'Error al leer el archivo.' });
        setProcessing(false);
        setStep(1);
      }
    }
  };

  const resetUpload = () => {
    setFile(null);
    setStep(1);
    setSheetNames([]);
    setSelectedSheet('');
    setStatus(null);
    setProgress(0);
  };

  const handleProcess = async () => {
    if (!file || !selectedSheet) return;
    setProcessing(true);
    setProgress(0);
    setProgressMsg('Iniciando lectura...');
    setStatus(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', sheets: [selectedSheet] });
        const worksheet = workbook.Sheets[selectedSheet];
        if (!worksheet) throw new Error(`La hoja "${selectedSheet}" no se pudo leer.`);

        setProgressMsg('Convirtiendo datos...');
        
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        const sectionConfig = SECTIONS[targetSection];
        const dbColumns = Object.values(sectionConfig.columnMap);

        // Buscar fila de encabezados
        let headerRowIndex = -1;
        let maxMatches = 0;
        for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
          const row = rawRows[i];
          if (!Array.isArray(row)) continue;
          const matches = row.filter(cell => 
            typeof cell === 'string' && 
            Object.keys(sectionConfig.columnMap).some(h => h.toLowerCase().replace(/[^a-z0-9]/g, '') === cell.toLowerCase().replace(/[^a-z0-9]/g, ''))
          ).length;
          if (matches > maxMatches) {
            maxMatches = matches;
            headerRowIndex = i;
          }
        }

        if (headerRowIndex === -1) headerRowIndex = 0;

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex }) as any[];

        setProgressMsg('Mapeando columnas para base de datos...');
        
        const mappedData = jsonData.map((row: any) => {
          const newRow: { [key: string]: any } = {};
          
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach(k => {
            normalizedRow[k.trim().toLowerCase().replace(/[^a-z0-9]/g, '')] = row[k];
          });

          for (const excelCol in sectionConfig.columnMap) {
            const normalizedExcelCol = excelCol.toLowerCase().replace(/[^a-z0-9]/g, '');
            let value = normalizedRow[normalizedExcelCol];

            // Fuzzy match
            if (value === undefined) {
              const excelKey = Object.keys(normalizedRow).find(k => 
                normalizedExcelCol.includes(k) || k.includes(normalizedExcelCol)
              );
              if (excelKey) value = normalizedRow[excelKey];
            }

            if (value === undefined) value = row[excelCol];

            const dbCol = (sectionConfig.columnMap as Record<string, string>)[excelCol];
            
            // Handle nulls
            if (value === undefined || value === null || (typeof value === 'string' && (value.trim() === "" || value.toLowerCase() === "null"))) {
              value = null;
            }

            if (dbCol === 'id' && (value === null || value === undefined)) continue;

            newRow[dbCol] = value;
          }
          return newRow;
        }).filter(row => Object.values(row).some(v => v !== null));

        if (mappedData.length === 0) {
          throw new Error("No se encontraron datos válidos que coincidan con la plantilla.");
        }

        setProgressMsg(`Subiendo ${mappedData.length} registros a Supabase...`);
        setProgress(50);

        const { error } = await supabase
          .from(sectionConfig.tableName)
          .upsert(mappedData, { onConflict: 'id' });
 // Assumes 'id' is the primary key for conflict

        if (error) {
          throw new Error(`Error de Supabase: ${error.message}`);
        }

        setProgress(100);
        setProgressMsg('¡Sincronización completa!');
        setStatus({ type: 'success', message: `Se sincronizaron ${mappedData.length} registros en ${sectionConfig.label}.` });
        onUploadSuccess();
        setProcessing(false);
        setStep(3);
      };
      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      setStatus({ type: 'error', message: `Error al procesar: ${errorMessage}` });
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-indigo-100 dark:bg-indigo-500/10 p-3 rounded-2xl">
          <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sincronización con Supabase</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Actualiza los datos masivamente desde un archivo Excel.</p>
        </div>
        <button 
          onClick={downloadTemplate}
          className="ml-auto flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"
        >
          <Download className="w-4 h-4" />
          Plantilla
        </button>
      </div>

      {/* Wizard UI remains largely the same, logic is updated */}
      <div className="space-y-6">
          <div className="flex items-center justify-between px-4 mb-8">
             {/* Step indicators */}
          </div>
          <AnimatePresence mode='wait'>
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                 <div className="relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center">
                    <Upload className="w-12 h-12 mb-4 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">{file ? file.name : 'Arrastra tu archivo Excel'}</p>
                    <div className="relative">
                      <button className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm">Seleccionar Archivo</button>
                      <input type="file" accept=".xlsx, .xls" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileSelect} />
                    </div>
                 </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sheet Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Selecciona la Hoja</label>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      {sheetNames.map(sheet => (
                        <button key={sheet} onClick={() => setSelectedSheet(sheet)} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedSheet === sheet ? 'bg-white dark:bg-slate-700 text-indigo-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}>
                          <FileSpreadsheet className="w-4 h-4" /> {sheet}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Section Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Tipo de Información</label>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      {Object.values(SECTIONS).map(section => (
                        <button key={section.id} onClick={() => setTargetSection(section.id as keyof typeof SECTIONS)} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${targetSection === section.id ? 'bg-white dark:bg-slate-700 text-indigo-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}>
                          <Layers className="w-4 h-4" /> {section.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={resetUpload} className="flex-1 px-6 py-4 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50">Cancelar</button>
                  <button onClick={handleProcess} disabled={processing} className="flex-[2] bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />} {processing ? 'Sincronizando...' : 'Iniciar Sincronización'}
                  </button>
                </div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¡Sincronización Exitosa!</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Los datos se han guardado correctamente en Supabase.</p>
                <button onClick={resetUpload} className="bg-slate-900 dark:bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm">Subir Otro Archivo</button>
              </motion.div>
            )}
          </AnimatePresence>
          {processing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>{progressMsg}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {status && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p>{status.message}</p>
            </div>
          )}
      </div>
    </div>
  );
};
