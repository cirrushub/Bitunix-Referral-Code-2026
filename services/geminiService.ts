
import { GoogleGenAI, Type } from "@google/genai";
import { MarketingContent } from "../types";

export const fetchMarketingContent = async (): Promise<MarketingContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Identify and verify the primary selling points for Bitunix crypto exchange.
      Focus on:
      1. Futures Grid Trading availability.
      2. 200x Leverage support.
      3. Withdrawal speed.
      4. Current global rankings (e.g., trust rankings or growth rankings relative to top players).
      Generate a compelling landing page marketing JSON.
    `,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          subheadline: { type: Type.STRING },
          rankClaim: { type: Type.STRING },
          trustFactor: { type: Type.STRING },
          features: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                icon: { type: Type.STRING },
                badge: { type: Type.STRING }
              },
              required: ["title", "description", "icon"]
            }
          }
        },
        required: ["headline", "subheadline", "rankClaim", "trustFactor", "features"]
      }
    }
  });

  const content = JSON.parse(response.text.trim());
  return content;
};
