import React from 'react';
import { AppSettings } from '../types';
import { Palette, BarChart3, MessageSquare, Layout, Check, Moon, Sun, Trash2, AlertTriangle } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
}

const COLORS = [
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Slate', value: '#475569' },
  { name: 'Amber', value: '#d97706' },
];

export const SettingsView: React.FC<Props> = ({ settings, onUpdate }) => {
  const updateSetting = (key: keyof AppSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="w-8 h-8 text-indigo-600" />
            Personalización del Sistema
          </div>
          <button
            onClick={() => updateSetting('darkMode', !settings.darkMode)}
            className={`p-2 rounded-2xl border-2 transition-all flex items-center gap-2 ${
              settings.darkMode 
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                : 'border-slate-100 text-slate-400 hover:border-slate-200'
            }`}
          >
            {settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span className="text-xs font-bold uppercase tracking-widest">
              {settings.darkMode ? 'Modo Oscuro' : 'Modo Claro'}
            </span>
          </button>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Theme Color */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Color Principal de Marca
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateSetting('primaryColor', color.value)}
                  className={`h-12 rounded-2xl border-2 transition-all flex items-center justify-center ${
                    settings.primaryColor === color.value 
                      ? 'border-slate-900 dark:border-white scale-105 shadow-md' 
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                >
                  {settings.primaryColor === color.value && <Check className="w-6 h-6 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Preference */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Preferencia de Visualización
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'bar', label: 'Gráficos de Barras (Precisión)', icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'pie', label: 'Gráficos Circulares (Proporción)', icon: <Layout className="w-4 h-4" /> },
                { id: 'area', label: 'Gráficos de Área (Tendencia)', icon: <BarChart3 className="w-4 h-4" /> },
              ].map((pref) => (
                <button
                  key={pref.id}
                  onClick={() => updateSetting('chartPreference', pref.id)}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                    settings.chartPreference === pref.id 
                      ? 'border-slate-900 dark:border-indigo-500 bg-slate-50 dark:bg-slate-800' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={settings.chartPreference === pref.id ? 'text-indigo-600' : 'text-slate-400'}>
                      {pref.icon}
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{pref.label}</span>
                  </div>
                  {settings.chartPreference === pref.id && <Check className="w-4 h-4 text-slate-900 dark:text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* AI Tone */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Tono del Analista IA
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'formal', label: 'Ejecutivo y Formal', desc: 'Ideal para reportes a la junta directiva.' },
                { id: 'casual', label: 'Cercano e Informativo', desc: 'Perfecto para comunicación interna.' },
                { id: 'technical', label: 'Técnico y Detallado', desc: 'Enfocado en auditoría y cumplimiento.' },
              ].map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => updateSetting('aiTone', tone.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    settings.aiTone === tone.id 
                      ? 'border-slate-900 dark:border-indigo-500 bg-slate-50 dark:bg-slate-800' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{tone.label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{tone.desc}</p>
                  </div>
                  {settings.aiTone === tone.id && <Check className="w-4 h-4 text-slate-900 dark:text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Densidad de Interfaz
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'compact', label: 'Compacta' },
                { id: 'spacious', label: 'Espaciosa' },
              ].map((density) => (
                <button
                  key={density.id}
                  onClick={() => updateSetting('dashboardDensity', density.id)}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center font-bold text-sm ${
                    settings.dashboardDensity === density.id 
                      ? 'border-slate-900 dark:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white' 
                      : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  {density.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-2">¿Necesitas una configuración a medida?</h3>
          <p className="text-indigo-200 text-sm max-w-md">
            Podemos ajustar los modelos de IA para que se adapten específicamente a los procesos internos de tu departamento.
          </p>
        </div>
        <BarChart3 className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
      </div>

      <div className="bg-rose-500/10 border-2 border-rose-500/20 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <AlertTriangle className="w-8 h-8 text-rose-300" />
            <h3 className="text-xl font-bold text-rose-100">Zona de Peligro</h3>
          </div>
          <p className="text-rose-200 text-sm max-w-md mb-6">
            Estas acciones son irreversibles y eliminarán permanentemente los datos de la aplicación.
          </p>
          <button 
            onClick={() => {
              if (window.confirm('¿Estás absolutamente seguro? Esta acción eliminará TODOS los datos y reiniciará la aplicación.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-2xl transition-all flex items-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar Todos los Datos
          </button>
        </div>
      </div>

    </div>
  );
};
