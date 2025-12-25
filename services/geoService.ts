
import { GoogleGenAI } from "@google/genai";
import { Difficulty } from "../types.ts";

export interface CountryData {
  name: string;
  lat: number;
  lng: number;
}

const COUNTRIES_BY_LEVEL: Record<Difficulty, string[]> = {
  [Difficulty.Easy]: ['France', 'Brazil', 'Japan', 'Canada', 'Australia', 'Egypt', 'Italy', 'India'],
  [Difficulty.Medium]: ['Vietnam', 'Norway', 'Argentina', 'Kenya', 'Poland', 'Turkey', 'Peru', 'Portugal'],
  [Difficulty.Hard]: ['Oman', 'Slovakia', 'Uruguay', 'Namibia', 'Laos', 'Estonia', 'Suriname', 'Bhutan'],
  [Difficulty.Expert]: ['Kiribati', 'Djibouti', 'Vanuatu', 'Andorra', 'Comoros', 'Palau', 'Togo', 'Nauru'],
  [Difficulty.Master]: ['Niue', 'Tuvalu', 'Wallis and Futuna', 'Sint Maarten', 'Tokelau', 'Mayotte', 'Montserrat', 'Bouvet Island']
};

export function getRandomCountry(difficulty: Difficulty = Difficulty.Medium): string {
  const list = COUNTRIES_BY_LEVEL[difficulty];
  return list[Math.floor(Math.random() * list.length)];
}

export async function validateAndGetLocation(guess: string, targetName: string): Promise<{
  isValid: boolean;
  distance: number;
  direction: string;
  percentage: number;
  canonicalName: string;
  lat: number;
  lng: number;
}> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a geographic data engine. 
      Target Country: "${targetName}"
      User's Guess: "${guess}"

      Task:
      1. Determine if the guess is a real country/territory.
      2. Calculate the distance (km) between the centroids of the guess and the target.
      3. Determine the cardinal direction (N, NE, E, SE, S, SW, W, NW) from the guess to the target.
      4. Rate proximity percentage (100% is the same country).
      5. Provide the canonical English name for the guessed country.
      6. Provide the latitude and longitude coordinates of the guessed country's centroid.

      Return ONLY a JSON object: {"isValid": boolean, "distance": number, "direction": string, "percentage": number, "name": string, "lat": number, "lng": number}`,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || '{}');
    return {
      isValid: data.isValid !== false,
      distance: Math.round(data.distance || 0),
      direction: data.direction || '?',
      percentage: Math.min(100, Math.max(0, Number(data.percentage) || 0)),
      canonicalName: data.name || guess,
      lat: Number(data.lat) || 0,
      lng: Number(data.lng) || 0
    };
  } catch (error) {
    console.error("Geo validation failed", error);
    return { isValid: false, distance: 0, direction: '?', percentage: 0, canonicalName: guess, lat: 0, lng: 0 };
  }
}

export async function getGeoHint(target: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a travel guide. Target Country: "${target}".
      Give a subtle, poetic hint about this country's culture, landmarks, or landscape without naming it or its neighbors directly. One short sentence.`,
    });
    return response.text?.trim() || "A land of ancient history and vast horizons.";
  } catch (error) {
    return "The coordinates point to a land of mystery.";
  }
}
