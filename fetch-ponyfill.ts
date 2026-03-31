import { GoogleGenAI, Type } from "@google/genai";

/**
 * AIEngine.ts
 * Servicio de análisis de datos utilizando Gemini 3
 */

// Inicialización diferida para asegurar que las variables de entorno estén cargadas
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("La llave de API de Gemini no está configurada. Asegúrese de definir GEMINI_API_KEY o VITE_GEMINI_API_KEY en el entorno.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeData = async (data: any[], contextTitle: string, tone: string = 'Ejecutivo/Formal') => {
  try {
    const ai = getGenAI();
    const model = "gemini-3.1-pro-preview";
    
    const prompt = `Como analista de datos experto de Banco Sofitasa, procesa este JSON referente a "${contextTitle}". 
    Utiliza un tono "${tone}".
    Entrega: 
    1. Resumen ejecutivo, 
    2. Correlaciones estadísticas detectadas, 
    3. Predicciones basadas en tendencias. 
    
    Formato: JSON estructurado para la UI con las llaves: "summary", "correlations", "predictions".`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt + "\n\n" + JSON.stringify(data.slice(0, 50)),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            correlations: { type: Type.ARRAY, items: { type: Type.STRING } },
            predictions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "correlations", "predictions"]
        }
      }
    });

    const text = response.text || '{}';
    // Limpiar posibles bloques de código markdown si el modelo los incluyó por error
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error: any) {
    console.error("Error detallado en AIEngine (analyzeData):", error);
    throw error;
  }
};

export const analyzeGlobalData = async (allData: Record<string, any[]>, tone: string = 'Ejecutivo/Formal') => {
  try {
    const ai = getGenAI();
    const model = "gemini-3.1-pro-preview";
    
    // Preparar un resumen de los datos para no exceder el contexto
    const dataSummary = Object.entries(allData).map(([tab, data]) => {
      return `Tabla ${tab}: ${data.length} registros. Muestra: ${JSON.stringify(data.slice(0, 10))}`;
    }).join('\n\n');

    const prompt = `Actúa como el Director de Inteligencia de Negocios de Banco Sofitasa. 
    Analiza el estado global de la institución basado en los datos de múltiples departamentos:
    ${Object.keys(allData).join(', ')}.
    
    Utiliza un tono "${tone}".
    
    Entrega un informe integral que incluya:
    1. Visión general de la salud operativa y financiera.
    2. Sinergias o riesgos detectados entre diferentes áreas (ej. relación entre investigaciones y presupuestos).
    3. Recomendaciones estratégicas de alto nivel.
    
    Formato: JSON estructurado con las llaves: "summary", "correlations", "predictions".`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt + "\n\nDATOS:\n" + dataSummary,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            correlations: { type: Type.ARRAY, items: { type: Type.STRING } },
            predictions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "correlations", "predictions"]
        }
      }
    });

    const text = response.text || '{}';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error: any) {
    console.error("Error detallado en AIEngine (analyzeGlobalData):", error);
    throw error;
  }
};

export const parseTextToData = async (text: string, columns: string[]) => {
  try {
    const ai = getGenAI();
    const model = "gemini-3.1-pro-preview";
    const prompt = `Extrae la información del siguiente texto y mapeala a las columnas: ${columns.join(', ')}.
    Si un dato no está presente, usa null.
    Texto: "${text}"
    Retorna un objeto JSON con los valores correspondientes.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error parseando texto con IA:", error);
    return null;
  }
};
