import { GoogleGenAI } from "@google/genai";
import { Case, AppSettings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateDataSummary(cases: Case[], securityCerts: any[] = [], settings?: AppSettings) {
  const model = "gemini-3-flash-preview";
  
  const toneInstruction = settings?.aiTone === 'technical' 
    ? "Usa un lenguaje técnico y analítico, enfocado en métricas de riesgo, auditoría y cumplimiento normativo."
    : settings?.aiTone === 'casual'
    ? "Usa un lenguaje directo, ameno y sencillo, como si fuera un boletín informativo interno para todo el personal."
    : "Usa un lenguaje profesional, ejecutivo y corporativo, adecuado para la alta gerencia.";

  // Create a condensed version of the data for the prompt
  const dataSummary = {
    cases: cases.map(c => ({
      tipo: c.TipoHecho,
      monto: c.MontoAfectado,
      conclusion: (c.Conclusion || '').substring(0, 50) + "...",
      estatus: c.Estatus
    })),
    certs: securityCerts.map(c => ({
      tipo: c.tipo,
      venc: c.vencimiento
    }))
  };

  const prompt = `
    Eres un analista senior de riesgos y seguridad integral de Banco Sofitasa. Tu tarea es realizar un análisis profundo y comparativo de los datos de seguridad proporcionados.
    
    ${toneInstruction}

    Por favor, genera un informe ejecutivo en español que integre:
    1. **Seguridad Financiera**: Resumen de fraudes y reclamos bancarios (volumen, montos, tendencias).
    2. **Cumplimiento y Certificaciones**: Estado de los certificados de seguridad y riesgos de vencimiento.
    3. **Análisis de Riesgo Cruzado**: ¿Existe alguna relación entre incidentes y fraudes? ¿Qué agencias presentan mayor riesgo integral?
    4. **Recomendaciones Estratégicas**: Sugerencias concretas para la Gerencia de Seguridad.
    
    Datos para analizar: ${JSON.stringify(dataSummary)}
    
    Responde en formato Markdown elegante y profesional, usando negritas para resaltar datos clave.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text;
  } catch (error) {
    console.error("Error generating summary:", error);
    return "No se pudo generar el resumen automatizado en este momento.";
  }
}

export async function classifyAndProcessData(content: string, mode: 'strict' | 'flexible' = 'flexible') {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analiza la siguiente información y clasifícala en una de estas dos categorías:
    1. 'case': Reclamo bancario o fraude.
    2. 'cert': Certificado de seguridad o documento de cumplimiento.

    MODO DE PROCESAMIENTO: ${mode.toUpperCase()}
    ${mode === 'strict' ? 'En modo STRICT, sé muy conservador. Si faltan datos clave (fechas, montos, ubicaciones), marca el campo como nulo y añade una advertencia en un campo "warning".' : 'En modo FLEXIBLE, intenta inferir datos faltantes basándote en el contexto.'}

    Extrae los datos necesarios según la categoría:
    - Para 'case': ID_Caso, FechaReclamo, NumExpediente, NumReclamo, Investigador, AgenciaReporta, TipoHecho, AgenciaOrigen, Vicepresidencia, FechaHecho, Descripcion, MontoExpuesto, MontoAfectado, MontoRecuperado, Conclusion, ClienteReceptor, Estatus.
    - Para 'cert': tipo, vencimiento, entidad, estatus.

    Responde ÚNICAMENTE con un objeto JSON válido con este formato:
    { "category": "case|cert", "data": { ...datos extraídos... }, "warning": "opcional si hay dudas" }

    Información a procesar: ${content}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error classifying data:", error);
    return null;
  }
}

export async function analyzeCase(caseData: Case) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analiza este caso específico de reclamo bancario y proporciona una breve explicación de por qué se tomó la decisión (Procedente/No Procedente) y qué puntos clave se deben considerar.
    Responde en español de forma concisa.
    
    Caso: ${JSON.stringify(caseData)}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing case:", error);
    return "Error al analizar el caso.";
  }
}

export async function analyzeServiceSheet(data: any, type: 'cert') {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analiza la siguiente "Hoja de Servicio" de un Certificado de Seguridad.
    Proporciona un resumen ejecutivo, identifica riesgos potenciales y verifica si la información parece completa y válida.
    Si hay una fecha de vencimiento, indica cuánto tiempo queda y si es urgente renovar.
    Responde en español con formato Markdown.
    
    Datos: ${JSON.stringify(data)}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing service sheet:", error);
    return "Error al analizar la hoja de servicio.";
  }
}
