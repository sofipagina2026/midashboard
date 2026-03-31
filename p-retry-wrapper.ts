import { supabase } from './supabaseClient';

/**
 * SchemaService.ts
 * Servicio para introspección dinámica de tablas en Supabase
 */

export interface TableSchema {
  tableName: string;
  columns: string[];
  primaryKey: string; // Nueva propiedad para identificar la PK
  data: any[];
  status: 'loading' | 'success' | 'empty' | 'error';
  businessLogic: {
    dateColumns: string[];
    amountColumns: string[];
    locationColumn: string | null;
  };
}

const TABLES_TO_INSPECT = [
  'SERVICIO TECNICO',
  'RETIROS VOLUNTARIOS',
  'PRESUPUESTOS',
  'INVESTIGACIONES',
  'CERTIFICADOS DE SEGURIDAD',
  'CERTIFICADOS DE BOMBEROS'
];

// Función auxiliar para parsear fechas en formato DD/MM/YYYY o MM/DD/YYYY de forma inteligente
export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  // Manejar fechas numéricas de Excel (días desde 1/1/1900)
  if (!isNaN(Number(dateStr)) && !dateStr.includes('-') && !dateStr.includes('/')) {
    const excelDate = Number(dateStr);
    // Excel cuenta desde 1/1/1900, pero tiene un bug con el año bisiesto 1900
    // JS Date cuenta desde 1/1/1970. El offset es aprox 25569 días.
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) return date;
  }

  // Intentar parsear como ISO primero
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime()) && dateStr.includes('-')) return isoDate;

  // Manejar formatos con barras /
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    const y = parseInt(parts[2]);

    // Si el primer número es > 12, definitivamente es DD/MM/YYYY
    // Si el segundo número es > 12, definitivamente es MM/DD/YYYY
    // Si ambos son <= 12, asumimos DD/MM/YYYY por el contexto regional (Latinoamérica)
    if (d > 12) {
      return new Date(y, m - 1, d);
    } else if (m > 12) {
      return new Date(y, d - 1, m);
    } else {
      // Por defecto DD/MM/YYYY para Sofitasa
      return new Date(y, m - 1, d);
    }
  }

  return isNaN(isoDate.getTime()) ? null : isoDate;
};

export const introspectTables = async (): Promise<Record<string, TableSchema>> => {
  const schemas: Record<string, TableSchema> = {};

  for (const tableName of TABLES_TO_INSPECT) {
    try {
      console.log(`Intentando introspectar tabla: ${tableName}`);
      
      // Intentar obtener los últimos 2000 registros ordenados por id desc
      let { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: false })
        .limit(2000);
      
      // Si falla (ej. no hay columna id), reintentar sin orden específico
      if (error) {
        console.warn(`No se pudo ordenar por 'id' en ${tableName}, reintentando sin orden.`);
        const fallbackQuery = await supabase
          .from(tableName)
          .select('*')
          .limit(2000);
        data = fallbackQuery.data;
        error = fallbackQuery.error;
      }

      console.log(`Resultado de Supabase para ${tableName}:`, { data, error });

      if (error) {
        console.error(`Error detallado de Supabase (Introspect ${tableName}):`, error);
        schemas[tableName] = {
          tableName,
          columns: [],
          primaryKey: 'id',
          data: [],
          status: 'error',
          businessLogic: { dateColumns: [], amountColumns: [], locationColumn: null }
        };
        continue;
      }

      const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
      
      // Fallback columns if table is empty
      if (columns.length === 0) {
        const fallbacks: Record<string, string[]> = {
          'INVESTIGACIONES': ['ID_Caso', 'FechaReclamo', 'NumExpediente', 'NumReclamo', 'Investigador', 'AgenciaReporta', 'TipoHecho', 'AgenciaOrigen', 'Vicepresidencia', 'FechaHecho', 'Descripcion', 'MontoExpuesto', 'MontoAfectado', 'MontoRecuperado', 'CanalTransaccional', 'Conclusion', 'ClienteReceptor', 'Estatus'],
          'SERVICIO TECNICO': ['Solicitud', 'Nro', 'Agencia _Pto_De_Serv _Depto', 'F_Solicitud', 'Reportado', 'Tipo_De_Solicitud', 'Proveedor', 'Observacion', 'Fecha_De_Atencion'],
          'CERTIFICADOS DE SEGURIDAD': ['N', 'ESTADO', 'FECHA_DE_VENCIMIENTO', 'FECHA_DE_EXPEDICION', 'NDECERTIFICACION', 'OFICINA', 'FECHA_ACTUAL'],
          'CERTIFICADOS DE BOMBEROS': ['N', 'ESTADO', 'FECHA_DE_VENCIMIENTO', 'FECHA_DE_EXPEDICION', 'NDECERTIFICACION', 'OFICINA', 'FECHA_ACTUAL'],
          'PRESUPUESTOS': ['Item_Descripcion', 'Empresa_1_Nombre', 'Empresa_1_Monto', 'Empresa_2_Nombre', 'Empresa_2_Monto', 'Empresa_3_Nombre', 'Empresa_3_Monto', 'Empresa_4_Nombre', 'Empresa_4_Monto'],
          'RETIROS VOLUNTARIOS': ['Nro', 'EMPLEADO', 'CEDULA', 'CARGO', 'ADSCRITOA', 'EXPEDIENTE']
        };
        if (fallbacks[tableName]) {
          columns.push(...fallbacks[tableName]);
        }
      }
      
      // Identificar Primary Key (Heurística: 'id' es la prioridad absoluta)
      const primaryKey = columns.find(c => c.toLowerCase() === 'id') || 
                        columns.find(c => c.toLowerCase() === 'idcaso') || 
                        columns.find(c => c.toLowerCase() === 'numexpediente') || 
                        columns[0] || 'id';

      // Analizar lógica de negocio por columna
      const dateColumns = columns.filter(col => 
        col.toLowerCase().includes('fecha') || 
        col.toLowerCase().includes('vencimiento') ||
        col.toLowerCase().includes('emision') ||
        col.toLowerCase().includes('expedicion') ||
        col.toLowerCase().includes('actual') ||
        col.toLowerCase().includes('date') ||
        col.toLowerCase().startsWith('f_') ||
        col.toLowerCase().startsWith('f-')
      );

      const expirationCol = columns.find(col => 
        col.toLowerCase().includes('vencimiento') || 
        col.toLowerCase().includes('expiracion') ||
        col.toLowerCase().includes('vence') ||
        col.toLowerCase().includes('expiry') ||
        col.toLowerCase().includes('fecha_v')
      );

      const emissionCol = columns.find(col => 
        col.toLowerCase().includes('emision') || 
        col.toLowerCase().includes('expedicion') ||
        col.toLowerCase().includes('inicio') ||
        col.toLowerCase().includes('fecha_e')
      );

      // Priorizar explícitamente 'vencimiento' si hay varias
      const priorityExpirationCol = columns.find(col => 
        col.toLowerCase() === 'fechavencimiento' || 
        col.toLowerCase() === 'fecha_vencimiento' || 
        col.toLowerCase() === 'vencimiento' ||
        col.toLowerCase() === 'fecha vencimiento'
      );
      const finalExpirationCol = priorityExpirationCol || expirationCol;

      // Inyectar columna calculada si es una tabla de certificados
      const processedData = data?.map(item => {
        if (finalExpirationCol && item[finalExpirationCol]) {
          const expiryDate = parseDate(String(item[finalExpirationCol]));
          if (!expiryDate || isNaN(expiryDate.getTime())) return item;

          // Normalizar ambas fechas a medianoche UTC para evitar problemas de zona horaria
          const today = new Date();
          const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
          
          const expiryUTC = Date.UTC(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());

          const diffTime = expiryUTC - todayUTC;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          let status = 'Activo';
          if (diffDays < 0) status = 'Vencido';
          else if (diffDays <= 30) status = 'Por Vencer';

          const newItem = { ...item, 'Dias_por_Vencer': diffDays, 'Status': status };

          // Si existe fecha de emisión, calcular vigencia total opcionalmente
          if (emissionCol && item[emissionCol]) {
            const emissionDate = parseDate(String(item[emissionCol]));
            if (emissionDate && !isNaN(emissionDate.getTime())) {
              const emissionUTC = Date.UTC(emissionDate.getFullYear(), emissionDate.getMonth(), emissionDate.getDate());
              const totalValidity = Math.floor((expiryUTC - emissionUTC) / (1000 * 60 * 60 * 24));
              newItem['Vigencia_Total'] = totalValidity;
            }
          }

          return newItem;
        }
        return item;
      }) || [];

      if (finalExpirationCol && processedData.length > 0) {
        if (!columns.includes('Dias_por_Vencer')) columns.push('Dias_por_Vencer');
        if (!columns.includes('Status')) columns.push('Status');
        if (emissionCol && !columns.includes('Vigencia_Total')) columns.push('Vigencia_Total');
      }

      const amountColumns = columns.filter(col => 
        (col.toLowerCase().includes('monto') || 
        col.toLowerCase().includes('presupuesto') ||
        col.toLowerCase().includes('cantidad') ||
        col.toLowerCase().includes('amount') ||
        col.toLowerCase().includes('total') ||
        col.toLowerCase().includes('nro') ||
        col.toLowerCase().includes('solicitud') ||
        col.toLowerCase().includes('num')) &&
        col !== 'Vigencia_Total'
      );

      const locationColumn = columns.find(col => 
        col.toLowerCase().includes('agencia') || 
        col.toLowerCase().includes('sucursal') ||
        col.toLowerCase().includes('ubicacion') ||
        col.toLowerCase().includes('lugar') ||
        col.toLowerCase().includes('sede')
      ) || null;

      schemas[tableName] = {
        tableName,
        columns,
        primaryKey,
        data: processedData,
        status: processedData.length > 0 ? 'success' : 'empty',
        businessLogic: {
          dateColumns,
          amountColumns,
          locationColumn
        }
      };
      console.log(`Esquema final para ${tableName}:`, schemas[tableName]);
    } catch (err) {
      console.error(`Fallo crítico en ${tableName}:`, err);
      schemas[tableName] = {
        tableName,
        columns: [],
        primaryKey: 'id',
        data: [],
        status: 'error',
        businessLogic: { dateColumns: [], amountColumns: [], locationColumn: null }
      };
    }
  }

  return schemas;
};

export const formatHeader = (column: string): string => {
  const mappings: Record<string, string> = {
    'NumExpediente': 'N° Expediente',
    'FechaReclamo': 'Fecha de Reclamo',
    'AgenciaReporta': 'Agencia que Reporta',
    'MontoExpuesto': 'Monto Expuesto',
    'MontoAfectado': 'Monto Afectado',
    'MontoRecuperado': 'Monto Recuperado',
    'IdCaso': 'ID de Caso',
    'FechaHecho': 'Fecha del Hecho',
    'NumReclamo': 'N° de Reclamo',
    'AgenciaOrigen': 'Agencia de Origen',
    'TipoHecho': 'Tipo de Hecho',
    'Dias_por_Vencer': 'Días por Vencer',
    'Status': 'Status',
    'Vigencia_Total': 'Vigencia Total (Días)',
    'FECHA_DE_EXPEDICION': 'Fecha de Expedición',
    'FECHA_DE_VENCIMIENTO': 'Fecha de Vencimiento',
    'FECHA_ACTUAL': 'Fecha Actual',
    'NDECERTIFICACION': 'N° de Certificación',
    'ESTADO': 'Estado',
    'OFICINA': 'Oficina',
    'Estado_Solicitud': 'Estado de Solicitud',
    'Fecha_De_Atencion': 'Fecha de Atención',
    'FECHA_DE_ATENCION': 'Fecha de Atención',
    'F_Solicitud': 'Fecha de Solicitud'
  };

  if (mappings[column]) return mappings[column];

  return column
    .replace(/([A-Z])/g, ' $1') // Añadir espacio antes de mayúsculas
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
