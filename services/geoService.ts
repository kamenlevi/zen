import { GoogleGenAI } from "@google/genai";
import { Difficulty } from "../types.ts";
import { COUNTRIES_DATA } from "./countryData.ts";
import { findBestMatch } from "../utils/fuzzy.ts";
import { haversineDistance, getDirection } from "../utils/geo.ts";

const COUNTRIES_LIST = COUNTRIES_DATA.map(c => c.name);
const COUNTRY_MAP = new Map(COUNTRIES_DATA.map(c => [c.name, c]));

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let hintCache = new Map<string, string>();

export function getRandomCountry(difficulty: Difficulty = Difficulty.Medium): string {
  return COUNTRIES_LIST[Math.floor(Math.random() * COUNTRIES_LIST.length)];
}

export async function validateAndGetLocation(guess: string, targetName: string): Promise<{
  isValid: boolean; distance: number; direction: string; percentage: number; canonicalName: string; lat: number; lng: number;
}> {
  const bestMatchName = findBestMatch(guess, COUNTRIES_LIST);
  const effectiveGuess = bestMatchName || guess;

  const guessCountry = COUNTRY_MAP.get(effectiveGuess);
  const targetCountry = COUNTRY_MAP.get(targetName);

  if (!guessCountry || !targetCountry) {
    return { isValid: false, distance: 0, direction: '?', percentage: 0, canonicalName: effectiveGuess, lat: 0, lng: 0 };
  }

  const distance = haversineDistance(guessCountry.latitude, guessCountry.longitude, targetCountry.latitude, targetCountry.longitude);
  const direction = getDirection(guessCountry.latitude, guessCountry.longitude, targetCountry.latitude, targetCountry.longitude);
  const maxDistance = 20000; // Max possible distance on Earth is roughly 20,000 km
  const percentage = Math.max(0, 100 - (distance / maxDistance) * 100);

  return {
    isValid: true,
    distance: Math.round(distance),
    direction,
    percentage,
    canonicalName: guessCountry.name,
    lat: guessCountry.latitude,
    lng: guessCountry.longitude
  };
}

export async function getGeoHint(targetCountry: string): Promise<string> {
    if (hintCache.has(targetCountry)) {
        return hintCache.get(targetCountry)!;
    }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Poetic hint about "${targetCountry}". No name. Under 15 words.`,
    });
    const hint = response.text?.trim() || "A land with rich history.";
    hintCache.set(targetCountry, hint);
    return hint;
  } catch (err) {
    return "This nation lies within a major continent.";
  }
}
