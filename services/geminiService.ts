
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  generateTechnicalDescription: async (codigoCliente: string, cliente: string) => {
    if (!process.env.API_KEY) return "Servicio AI no disponible sin API Key.";
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiza esta referencia técnica: ${codigoCliente} para el cliente ${cliente}. Genera una descripción técnica breve (máximo 15 palabras) en español sobre qué tipo de pieza o componente industrial podría ser basándote en la nomenclatura común de oficina técnica.`,
      });
      return response.text || "No se pudo generar descripción.";
    } catch (e) {
      console.error("Error en Gemini:", e);
      return "Error al analizar referencia.";
    }
  }
};
