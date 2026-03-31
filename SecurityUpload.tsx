import React from 'react';
import { DataTableView } from './DataTableView';

interface ReportesViewProps {
  serviceReports: any[];
  onAnalyze: (data: any[], title: string) => void;
}

const columns = [
  { key: 'Solicitud', label: 'Solicitud' },
  { key: 'Nro', label: 'Nro' },
  { key: 'Agencia _Pto_De_Serv _Depto', label: 'Agencia/Dpto' },
  { key: 'F_Solicitud', label: 'Fecha Solicitud' },
  { key: 'Reportado', label: 'Reportado' },
  { key: 'Tipo_De_Solicitud', label: 'Tipo de Solicitud' },
  { key: 'Proveedor', label: 'Proveedor' },
  { key: 'Observacion', label: 'Observación' },
];

export const ReportesView: React.FC<ReportesViewProps> = ({ serviceReports, onAnalyze }) => {
  return (
    <DataTableView 
      title="Servicio de Reportes"
      data={serviceReports}
      columns={columns}
      onAnalyze={onAnalyze}
    />
  );
};
