import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Inbox className="w-16 h-16 mb-4 opacity-20" />
      <p className="text-xl font-black uppercase tracking-widest opacity-40">Sin Registros</p>
      <p className="text-sm mt-2">No se encontraron datos para este periodo o ubicación.</p>
    </div>
  );
}
