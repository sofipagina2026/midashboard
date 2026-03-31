import React from 'react';
import { DataTableView } from './DataTableView';

interface CertificadosViewProps {
  Bombero: any[];
  CICPC: any[];
  onAnalyze: (data: any[], title: string) => void;
}

const bomberosColumns = [
  { key: 'N', label: 'N' },
  { key: 'AGENCIA', label: 'Agencia' },
  { key: 'FECHA_DE_EMISION', label: 'Fecha de Emisión' },
  { key: 'FECHA_DE_VENCIMIENTO', label: 'Fecha de Vencimiento' },
  { key: 'PERIODO', label: 'Periodo' },
];

const seguridadColumns = [
  { key: 'N', label: 'N' },
  { key: 'Oficina', label: 'Oficina' },
  { key: 'Estado', label: 'Estado' },
  { key: 'Programa', label: 'Programa' },
  { key: 'Nro_Cert', label: 'Nro. Cert.' },
  { key: 'FECHA_EXP', label: 'Fecha Exp.' },
  { key: 'FECHA_VEN', label: 'Fecha Ven.' },
  { key: 'Status', label: 'Estatus' },
];

export const CertificadosView: React.FC<CertificadosViewProps> = ({ certsBomberos, certsSeguridad, onAnalyze }) => {
  return (
    <div className="space-y-8">
      <DataTableView 
        title="Certificados de Bomberos"
        data={Bombero}
        columns={bomberosColumns}
        onAnalyze={onAnalyze}
      />
      <DataTableView 
        title="Certificados de Seguridad"
        data={CICPC}
        columns={seguridadColumns}
        onAnalyze={onAnalyze}
      />
    </div>
  );
};
