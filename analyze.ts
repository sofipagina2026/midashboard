export interface Case {
  ID_Caso: string;
  FechaReclamo: string;
  NumExpediente: string;
  NumReclamo: string;
  Investigador: string;
  AgenciaReporta: string;
  TipoHecho: string;
  AgenciaOrigen: string;
  Vicepresidencia: string;
  FechaHecho: string;
  Descripcion: string;
  MontoExpuesto: string;
  MontoAfectado: string;
  MontoRecuperado: string;
  CanalTransaccional: string;
  Conclusion: string;
  ClienteReceptor: string;
  Estatus: string;
}

export interface Feedback {
  id: number;
  case_id: string;
  user_name: string;
  comment: string;
  created_at: string;
}

export interface FireReport {
  id: number;
  fecha: string;
  ubicacion: string;
  descripcion: string;
  estatus: string;
}

export interface SecurityCertificate {
  id: number;
  tipo: string;
  vencimiento: string;
  entidad: string;
  estatus: string;
}

export interface CCTVRecord {
  id: number;
  fecha: string;
  agencia: string;
  descripcion: string;
  empresa: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  estatus: string;
}

export interface AppSettings {
  primaryColor: string;
  chartPreference: 'bar' | 'pie' | 'area';
  aiTone: 'formal' | 'casual' | 'technical';
  showAnimations: boolean;
  dashboardDensity: 'compact' | 'spacious';
  darkMode: boolean;
}
