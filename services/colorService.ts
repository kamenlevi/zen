import { GoogleGenAI } from "@google/genai";
import { Difficulty } from "../types.ts";
import { COLORS_LIST } from "./wordBank.ts";
import { findBestMatch } from "../utils/fuzzy.ts";
import { getColorDifference } from "../utils/color.ts";

export interface ColorData {
  name: string;
  hex: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let hintCache = new Map<string, string>();

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

  if (!bestMatchName) {
    return { percentage: 0, hex: "#808080", isValid: false };
  }
  
  const effectiveGuess = bestMatchName;
  
  const guessColor = COLORS_LIST.find(c => c.name.toLowerCase() === effectiveGuess.toLowerCase());
  const targetColor = COLORS_LIST.find(c => c.name.toLowerCase() === target.toLowerCase());

  if (!guessColor || !targetColor) {
    return { percentage: 0, hex: "#808080", isValid: false };
  }

  const difference = getColorDifference(guessColor.hex, targetColor.hex);
  const percentage = Math.max(0, 100 - difference);

  return {
    percentage,
    hex: guessColor.hex,
    isValid: true,
    correctedName: effectiveGuess
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => c.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export async function getColorHint(targetColorName: string): Promise<string> {
    if (hintCache.has(targetColorName)) {
        return hintCache.get(targetColorName)!;
    }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a single cryptic, poetic hint for the color "${targetColorName}". Rules: 1. No color name. 2. Under 10 words.`,
    });
    const hint = response.text?.trim() || "A shade from the natural world.";
    hintCache.set(targetColorName, hint);
    return hint;
  } catch (err) {
    return "Think of common objects associated with this hue.";
  }
}
