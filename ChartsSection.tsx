import React from 'react';
import { Case, Feedback } from '../types';
import { X, MessageSquare, Send, User, Calendar, Info } from 'lucide-react';
import { analyzeCase } from '../services/geminiService';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  caseData: Case | null;
  onClose: () => void;
}

export const CaseModal: React.FC<Props> = ({ caseData, onClose }) => {
  const [feedback, setFeedback] = React.useState<Feedback[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [userName, setUserName] = React.useState('');
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = React.useState(false);

  React.useEffect(() => {
    if (caseData) {
      loadFeedback();
      setAnalysis(null);
    }
  }, [caseData]);

  const loadFeedback = async () => {
    if (!caseData) return;
    const res = await fetch(`/api/feedback/${caseData.ID_Caso}`);
    const data = await res.json();
    setFeedback(data);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !newComment.trim()) return;

    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_id: caseData.ID_Caso,
        user_name: userName,
        comment: newComment
      })
    });

    setNewComment('');
    loadFeedback();
  };

  const handleAnalyze = async () => {
    if (!caseData) return;
    setLoadingAnalysis(true);
    const result = await analyzeCase(caseData);
    setAnalysis(result);
    setLoadingAnalysis(false);
  };

  if (!caseData) return null;

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
            <div>
              <h2 className="text-xl font-bold text-slate-900">Detalle de Investigación: {caseData.ID_Caso}</h2>
              <p className="text-sm text-slate-500">{caseData.NumExpediente}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center">
                    <Info className="w-4 h-4 mr-2" /> Descripción del Hecho
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-xl text-slate-700 leading-relaxed border border-slate-100">
                    {caseData.Descripcion}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Conclusión de la Investigación</h3>
                  <div className={`p-4 rounded-xl border ${
                    caseData.Conclusion.includes('ES PROCEDENTE') 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                      : 'bg-rose-50 border-rose-100 text-rose-800'
                  }`}>
                    {caseData.Conclusion}
                  </div>
                </section>

                <section className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-indigo-900 font-bold flex items-center">
                      <span className="bg-indigo-600 text-white p-1 rounded mr-2">AI</span> Análisis Automatizado
                    </h3>
                    {!analysis && (
                      <button 
                        onClick={handleAnalyze}
                        disabled={loadingAnalysis}
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {loadingAnalysis ? 'Analizando...' : 'Generar Análisis'}
                      </button>
                    )}
                  </div>
                  {analysis ? (
                    <div className="prose prose-sm max-w-none text-indigo-800">
                      <Markdown>{analysis}</Markdown>
                    </div>
                  ) : (
                    <p className="text-sm text-indigo-600/70 italic">
                      Haz clic en el botón para obtener una explicación automatizada de este caso basada en inteligencia artificial.
                    </p>
                  )}
                </section>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Monto Afectado</p>
                    <p className="text-lg font-bold text-slate-900">{caseData.MontoAfectado}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Avance / Estatus</p>
                    <p className="text-sm font-bold text-indigo-600">{caseData.Estatus || 'Pendiente'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Agencia</p>
                    <p className="text-sm font-medium text-slate-700">{caseData.AgenciaReporta}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Investigador</p>
                    <p className="text-sm font-medium text-slate-700">{caseData.Investigador}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" /> Retroalimentación
                  </h3>
                  
                  <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                    {feedback.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4 italic">No hay comentarios aún.</p>
                    ) : (
                      feedback.map((f) => (
                        <div key={f.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{f.user_name}</span>
                            <span className="text-[10px] text-slate-400">{new Date(f.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-700">{f.comment}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSubmitFeedback} className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Tu nombre (opcional)" 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                    <textarea 
                      placeholder="Escribe tu comentario..." 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs h-20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button className="w-full bg-slate-900 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center hover:bg-slate-800 transition-colors">
                      <Send className="w-3 h-3 mr-2" /> Enviar Comentario
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
