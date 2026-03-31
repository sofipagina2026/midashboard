import { Case, AppSettings } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area 
} from 'recharts';

interface Props {
  cases: Case[];
  settings: AppSettings;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#475569', '#94a3b8'];

export const ChartsSection: React.FC<Props> = ({ cases, settings }) => {
  const primaryColor = settings.primaryColor;
  
  const processPieData = (data: any[]) => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    if (sorted.length <= 6) return sorted;
    
    const top = sorted.slice(0, 5);
    const others = sorted.slice(5).reduce((acc, curr) => acc + curr.value, 0);
    return [...top, { name: 'Otros', value: others }];
  };

  // Data for Type of Fact
  const typeDataRaw = cases.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.name === curr.TipoHecho);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: curr.TipoHecho, value: 1 });
    }
    return acc;
  }, []);
  const typeData = processPieData(typeDataRaw);

  // Data for VP
  const vpDataRaw = cases.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.name === curr.Vicepresidencia);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: curr.Vicepresidencia, value: 1 });
    }
    return acc;
  }, []);
  const vpData = processPieData(vpDataRaw);

  // Timeline Data
  const timelineData = cases.reduce((acc: any[], curr) => {
    const date = curr.FechaReclamo;
    if (!date) return acc;
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => {
    try {
      const partsA = a.date.split('/');
      const partsB = b.date.split('/');
      if (partsA.length !== 3 || partsB.length !== 3) return 0;
      return new Date(`${partsA[2]}-${partsA[1]}-${partsA[0]}`).getTime() - 
             new Date(`${partsB[2]}-${partsB[1]}-${partsB[0]}`).getTime();
    } catch (e) {
      return 0;
    }
  });

  const isDark = settings.darkMode;
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const tickColor = isDark ? '#94a3b8' : '#64748b';

  const renderChart = (data: any[], dataKey: string, nameKey: string = 'name') => {
    if (settings.chartPreference === 'pie') {
      return (
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey={dataKey}
            label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
            labelLine={false}
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#0f172a' : '#ffffff', 
              borderColor: isDark ? '#1e293b' : '#f1f5f9',
              color: isDark ? '#f8fafc' : '#0f172a'
            }} 
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }}
          />
        </PieChart>
      );
    }

    if (settings.chartPreference === 'area') {
      return (
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis dataKey={nameKey} fontSize={10} tick={{fill: tickColor}} />
          <YAxis fontSize={10} tick={{fill: tickColor}} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#0f172a' : '#ffffff', 
              borderColor: isDark ? '#1e293b' : '#f1f5f9',
              color: isDark ? '#f8fafc' : '#0f172a'
            }} 
          />
          <Area type="monotone" dataKey={dataKey} stroke={primaryColor} fill={primaryColor} fillOpacity={0.1} />
        </AreaChart>
      );
    }

    return (
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
        <XAxis dataKey={nameKey} fontSize={10} tick={{fill: tickColor}} />
        <YAxis fontSize={10} tick={{fill: tickColor}} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: isDark ? '#0f172a' : '#ffffff', 
            borderColor: isDark ? '#1e293b' : '#f1f5f9',
            color: isDark ? '#f8fafc' : '#0f172a'
          }} 
        />
        <Bar dataKey={dataKey} fill={primaryColor} radius={[4, 4, 0, 0]} />
      </BarChart>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 min-h-[400px] flex flex-col">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Distribución por Tipo de Hecho</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart(typeData, 'value')}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 min-h-[400px] flex flex-col">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Casos por Vicepresidencia</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart(vpData, 'value')}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-2 min-h-[400px] flex flex-col">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Tendencia de Reclamos en el Tiempo</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="date" fontSize={10} tick={{fill: tickColor}} />
              <YAxis fontSize={10} tick={{fill: tickColor}} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                  borderColor: isDark ? '#1e293b' : '#f1f5f9',
                  color: isDark ? '#f8fafc' : '#0f172a'
                }} 
              />
              <Area type="monotone" dataKey="count" stroke={primaryColor} fill={primaryColor} fillOpacity={0.1} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
