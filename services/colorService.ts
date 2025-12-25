
import { GoogleGenAI } from "@google/genai";
import { Difficulty } from "../types.ts";

export interface ColorData {
  name: string;
  hex: string;
}

const COLORS_BY_LEVEL: Record<Difficulty, ColorData[]> = {
  [Difficulty.Easy]: [
    { name: 'Crimson', hex: '#DC143C' },
    { name: 'Turquoise', hex: '#40E0D0' },
    { name: 'Azure', hex: '#007FFF' },
    { name: 'Indigo', hex: '#4B0082' },
    { name: 'Emerald', hex: '#50C878' },
    { name: 'Vermilion', hex: '#E34234' }
  ],
  [Difficulty.Medium]: [
    { name: 'Chartreuse', hex: '#7FFF00' },
    { name: 'Celadon', hex: '#ACE1AF' },
    { name: 'Viridian', hex: '#40826D' },
    { name: 'Aureolin', hex: '#FDEE00' },
    { name: 'Heliotrope', hex: '#DF73FF' },
    { name: 'Malachite', hex: '#0BDA51' }
  ],
  [Difficulty.Hard]: [
    { name: 'Coquelicot', hex: '#FF3800' },
    { name: 'Smaragdine', hex: '#50C878' },
    { name: 'Glaucous', hex: '#6082B6' },
    { name: 'Isabelline', hex: '#F4F0EC' },
    { name: 'Mikado Yellow', hex: '#FFC40C' },
    { name: 'Sinopia', hex: '#CB410B' }
  ],
  [Difficulty.Expert]: [
    { name: 'Atrovirens', hex: '#004F54' },
    { name: 'Zaffre', hex: '#0014A8' },
    { name: 'Icterine', hex: '#FCF75E' },
    { name: 'Kobe', hex: '#882D17' },
    { name: 'Eburnean', hex: '#F5F5DC' },
    { name: 'Xanthic', hex: '#EEED09' }
  ],
  [Difficulty.Master]: [
    { name: 'Caput Mortuum', hex: '#592720' },
    { name: 'Skobeloff', hex: '#007474' },
    { name: 'Gamboge', hex: '#E49B0F' },
    { name: 'Feldgrau', hex: '#4D5D53' },
    { name: 'Sarcoline', hex: '#E6BE8A' },
    { name: 'Phlox', hex: '#DF00FF' },
    { name: 'Zinnwaldite', hex: '#EBC2AF' },
    { name: 'Bistre', hex: '#3D2B1F' }
  ]
};

// Converts RGB values to a hex color string.
export function rgbToHex(r: number, g: number, b: number): string {
  const componentToHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function getRandomNicheColor(difficulty: Difficulty = Difficulty.Medium): ColorData {
  const words = COLORS_BY_LEVEL[difficulty];
  return words[Math.floor(Math.random() * words.length)];
}

export async function getSemanticCloseness(guess: string, target: string): Promise<{ percentage: number; hex: string; isValid?: boolean }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional color theorist. 
      Target Color Name: "${target}"
      User's Guess: "${guess}"

      Task:
      1. Rate semantic similarity (0-100%). Be generous with synonyms.
      2. Identify if the user's guess is a real color or visual descriptor.
      3. Provide the CSS Hex code for "${guess}".

      Return ONLY a JSON object: {"score": number, "hex": string, "isValid": boolean}`,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || '{}');
    return {
      percentage: Math.min(100, Math.max(0, Number(data.score) || 0)),
      hex: data.hex || '#808080',
      isValid: data.isValid !== false
    };
  } catch (error) {
    return { percentage: 0, hex: "#808080", isValid: true };
  }
}

export async function getColorHint(target: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a grounded color consultant. Target: "${target}".
      Describe the color's relationship to physical materials or temperature. Avoid AI-isms. 
      Be USEFUL for a player trying to guess the name. One sentence.`,
    });
    return response.text?.trim() || "A specific hue found in nature and art.";
  } catch (error) {
    return "A hue beyond current description.";
  }
}
