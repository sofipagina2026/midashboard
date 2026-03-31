import React from 'react';
import { DataTableView } from './DataTableView';

interface RetirosViewProps {
  retiros: any[];
  onAnalyze: (data: any[], title: string) => void;
}

const columns = [
  { key: 'Nro', label: 'Nro' },
  { key: 'EMPLEADO', label: 'Empleado' },
  { key: 'CEDULA', label: 'Cédula' },
  { key: 'CARGO', label: 'Cargo' },
  { key: 'ADSCRITOA', label: 'Adscrito A' },
  { key: 'EXPEDIENTE', label: 'Expediente' },
];

export const RetirosView: React.FC<RetirosViewProps> = ({ retiros, onAnalyze }) => {
  return (
    <DataTableView 
      title="Retiros Voluntarios"
      data={retiros}
      columns={columns}
      onAnalyze={onAnalyze}
    />
  );
};
