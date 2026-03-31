import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, BrainCircuit, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

interface AnalysisModalProps {
  data: any[];
  title: string;
  onClose: () => void;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ data, title, onClose }) => {
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateAnalysis = async () => {
      if (!data || data.length === 0) {
        setAnalysis('No hay datos para analizar.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const model = 'gemini-3-flash-preview';
      const prompt = `
        Eres un asistente de inteligencia artificial especializado en análisis de datos de seguridad para un banco.
        A continuación, te proporciono un conjunto de datos en formato JSON extraído de una tabla titulada "${title}".

        Datos:
        ${JSON.stringify(data.slice(0, 50), null, 2)} 
        ${data.length > 50 ? `\n(y ${data.length - 50} registros más...)` : ''}

        Por favor, realiza un análisis conciso y perspicaz de estos datos. Tu análisis debe incluir:
        1.  Un resumen general de los datos presentados.
        2.  Identificación de 1 a 3 puntos clave, tendencias, riesgos potenciales o anomalías que destaquen.
        3.  Una recomendación o sugerencia de acción basada en tus hallazgos.

        Formatea tu respuesta en Markdown. Sé claro y directo.
      `;

      try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        setAnalysis(response.text);
      } catch (err) {
        console.error('Error generating analysis:', err);
        setError('Ocurrió un error al generar el análisis. Por favor, intente de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    generateAnalysis();
  }, [data, title]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-indigo-500" />
            <h2 className="text-lg font-bold">Análisis con IA: {title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Generando análisis, por favor espera...</p>
            </div>
          )}
          {error && <p className="text-rose-500">{error}</p>}
          {!isLoading && !error && (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
