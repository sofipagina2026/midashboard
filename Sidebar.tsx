import React from 'react';
import { SecurityCertificate } from '../types';
import { X, Sparkles, ShieldCheck, Calendar, Building2 } from 'lucide-react';
import { analyzeServiceSheet } from '../services/geminiService';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  data: SecurityCertificate | null;
  type: 'cert';
  onClose: () => void;
}

export const ServiceSheetModal: React.FC<Props> = ({ data, type, onClose }) => {
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (data) {
      setAnalysis(null);
      handleAnalyze();
    }
  }, [data]);

  const handleAnalyze = async () => {
    if (!data) return;
    setLoading(false); // Reset
    setLoading(true);
    const result = await analyzeServiceSheet(data, type);
    setAnalysis(result);
    setLoading(false);
  };

  if (!data) return null;

  const cert = data as SecurityCertificate;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Análisis de Certificado de Seguridad
                </h2>
                <p className="text-sm text-slate-500">ID: {data.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Datos del Documento</h3>
                  
                    <>
                      <div className="flex items-start gap-3">
                        <Building2 className="w-4 h-4 text-slate-400 mt-1" />
                        <div>
                          <p className="text-xs text-slate-400">Entidad Emisora</p>
                          <p className="text-sm font-bold text-slate-700">{cert.entidad}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-slate-400 mt-1" />
                        <div>
                          <p className="text-xs text-slate-400">Vencimiento</p>
                          <p className="text-sm font-bold text-slate-700">{cert.vencimiento}</p>
                        </div>
                      </div>
                    </>

                  <div className="pt-4">
                    <p className="text-xs text-slate-400 mb-2">Estatus Actual</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      data.estatus === 'Vigente' ? 'bg-emerald-100 text-emerald-700' : 
                      data.estatus === 'Vencido' ? 'bg-rose-100 text-rose-700' : 
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {data.estatus}
                    </span>
                  </div>
                </div>

              </div>

              <div className="md:col-span-2">
                <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 min-h-[400px]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-indigo-900 font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      Análisis Inteligente de Hoja de Servicio
                    </h3>
                    {loading && <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
                  </div>

                  {analysis ? (
                    <div className="prose prose-indigo max-w-none">
                      <Markdown>{analysis}</Markdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-indigo-400 italic">
                      <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                      <p>Generando análisis detallado...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
