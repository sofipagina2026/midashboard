import React from 'react';
import { DataTableView } from './DataTableView';

interface PresupuestoViewProps {
  cctvAlarms: any[];
  onAnalyze: (data: any[], title: string) => void;
}

const columns = [
  { key: 'ID_Registro', label: 'ID Registro' },
  { key: 'Fecha', label: 'Fecha' },
  { key: 'Nombre_Sede_Oficina', label: 'Sede/Oficina' },
  { key: 'Ubicación', label: 'Ubicación' },
  { key: 'Empresa_o_Persona_Encargada', label: 'Encargado' },
  { key: 'Tipo_Servicio_CCTV_Alarma_Instalacion_Mantenimiento', label: 'Tipo de Servicio' },
  { key: 'Estatus_Servicio_Pendiente_Completado', label: 'Estatus' },
];

export const PresupuestoView: React.FC<PresupuestoViewProps> = ({ cctvAlarms, onAnalyze }) => {
  return (
    <DataTableView 
      title="Presupuesto de CCTV y Alarmas"
      data={cctvAlarms}
      columns={columns}
      onAnalyze={onAnalyze}
    />
  );
};
