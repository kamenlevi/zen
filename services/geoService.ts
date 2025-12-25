import { GoogleGenAI } from "@google/genai";
import { Difficulty } from "../types.ts";
import { COUNTRIES_LIST } from "./wordBank.ts";
import { findBestMatch } from "../utils/fuzzy.ts";

export function getRandomCountry(difficulty: Difficulty = Difficulty.Medium): string {
  return COUNTRIES_LIST[Math.floor(Math.random() * COUNTRIES_LIST.length)];
}

export async function validateAndGetLocation(guess: string, targetName: string): Promise<{
  isValid: boolean; distance: number; direction: string; percentage: number; canonicalName: string; lat: number; lng: number;
}> {
  // Apply autocorrect
  const bestMatchName = findBestMatch(guess, COUNTRIES_LIST);
  const effectiveGuess = bestMatchName || guess;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Geography Similarity: Target="${targetName}", Guess="${effectiveGuess}". JSON: {"isValid": boolean, "distance": km, "direction": N/E/S/W, "percentage": 0-100, "name": string, "lat": num, "lng": num}`,
      config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(response.text || '{}');
    return {
      isValid: data.isValid !== false,
      distance: Math.round(data.distance || 0),
      direction: data.direction || '?',
      percentage: Number(data.percentage) || 0,
      canonicalName: data.name || effectiveGuess,
      lat: data.lat || 0,
      lng: data.lng || 0
    };
  } catch (error) {
    const exists = COUNTRIES_LIST.some(c => c.toLowerCase() === effectiveGuess.toLowerCase());
    return { isValid: exists, distance: 0, direction: '?', percentage: 0, canonicalName: effectiveGuess, lat: 0, lng: 0 };
  }
}

export async function getGeoHint(targetCountry: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Poetic hint about "${targetCountry}". No name. Under 15 words.`,
    });
    return response.text?.trim() || "A land with rich history.";
  } catch (err) {
    return "This nation lies within a major continent.";
  }
}
