import { GoogleGenAI } from "@google/genai";
import { Difficulty } from "../types.ts";
import { COLORS_LIST } from "./wordBank.ts";
import { findBestMatch } from "../utils/fuzzy.ts";

export interface ColorData {
  name: string;
  hex: string;
}

export function getRandomNicheColor(difficulty: Difficulty = Difficulty.Medium): ColorData {
  const startIdx = difficulty === Difficulty.Easy ? 0 : 
                   difficulty === Difficulty.Medium ? 5 :
                   difficulty === Difficulty.Hard ? 10 :
                   difficulty === Difficulty.Expert ? 15 : 20;
  
  const subset = COLORS_LIST.slice(startIdx, startIdx + 10);
  return subset[Math.floor(Math.random() * subset.length)] || COLORS_LIST[0];
}

export async function getSemanticCloseness(guess: string, target: string): Promise<{ percentage: number; hex: string; isValid?: boolean; correctedName?: string }> {
  // Apply autocorrect
  const colorNames = COLORS_LIST.map(c => c.name);
  const bestMatchName = findBestMatch(guess, colorNames);
  const effectiveGuess = bestMatchName || guess;
  
  const offlineMatch = COLORS_LIST.find(c => c.name.toLowerCase() === effectiveGuess.toLowerCase());
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Color Similarity: Target="${target}", Guess="${effectiveGuess}". JSON: {"score": 0-100, "hex": string, "isValid": boolean}`,
      config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(response.text || '{}');
    return {
      percentage: Number(data.score) || 0,
      hex: data.hex || (offlineMatch ? offlineMatch.hex : '#808080'),
      isValid: data.isValid !== false,
      correctedName: effectiveGuess
    };
  } catch (error) {
    if (offlineMatch) return { 
      percentage: effectiveGuess.toLowerCase() === target.toLowerCase() ? 100 : 50, 
      hex: offlineMatch.hex, 
      isValid: true,
      correctedName: effectiveGuess
    };
    return { percentage: 0, hex: "#808080", isValid: false };
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => c.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export async function getColorHint(targetColorName: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a single cryptic, poetic hint for the color "${targetColorName}". Rules: 1. No color name. 2. Under 10 words.`,
    });
    return response.text?.trim() || "A shade from the natural world.";
  } catch (err) {
    return "Think of common objects associated with this hue.";
  }
}
