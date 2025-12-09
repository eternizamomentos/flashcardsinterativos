import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Flashcard } from "../types";
import { logError } from '../utils/logger';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateFlashcardsFromText = async (text: string, count: number = 5): Promise<Omit<Flashcard, 'status' | 'nextReview' | 'interval' | 'easeFactor'>[]> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("API Key não configurada.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        front: {
          type: Type.STRING,
          description: "A pergunta, termo ou conceito na frente do cartão.",
        },
        back: {
          type: Type.STRING,
          description: "A resposta, definição ou explicação no verso do cartão.",
        },
      },
      required: ["front", "back"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analise o seguinte texto e crie ${count} flashcards educacionais de alta qualidade.
      O texto é: "${text}".
      
      Retorne APENAS um array JSON. Certifique-se de que o conteúdo esteja em Português do Brasil.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Sem resposta da IA");

    const parsedData = JSON.parse(jsonText) as { front: string; back: string }[];

    return parsedData.map(item => ({
      id: generateId(),
      front: item.front,
      back: item.back,
    }));

  } catch (error) {
    logError('Erro ao gerar flashcards:', error);
    throw error;
  }
};
