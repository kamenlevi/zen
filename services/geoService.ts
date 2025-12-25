
import { GoogleGenAI } from "@google/genai";
import { Difficulty } from "../types.ts";

export interface CountryData {
  name: string;
  lat: number;
  lng: number;
}

const COUNTRIES_BY_LEVEL: Record<Difficulty, string[]> = {
  [Difficulty.Easy]: [
    'United States', 'China', 'France', 'Brazil', 'Japan', 'Canada', 'Australia', 'Egypt', 
    'Italy', 'India', 'Germany', 'United Kingdom', 'Mexico', 'Spain', 'Russia', 'South Africa'
  ],
  [Difficulty.Medium]: [
    'Vietnam', 'Norway', 'Argentina', 'Kenya', 'Poland', 'Turkey', 'Peru', 'Portugal', 
    'Thailand', 'Sweden', 'Greece', 'Chile', 'Ukraine', 'Morocco', 'Saudi Arabia', 'Colombia'
  ],
  [Difficulty.Hard]: [
    'Oman', 'Slovakia', 'Uruguay', 'Namibia', 'Laos', 'Estonia', 'Suriname', 'Bhutan',
    'Uzbekistan', 'Slovenia', 'Kyrgyzstan', 'Botswana', 'Suriname', 'Gabon', 'Mongolia', 'Latvia'
  ],
  [Difficulty.Expert]: [
    'Kiribati', 'Djibouti', 'Vanuatu', 'Andorra', 'Comoros', 'Palau', 'Togo', 'Nauru',
    'Liechtenstein', 'San Marino', 'Benin', 'Equatorial Guinea', 'Lesotho', 'Timor-Leste', 'Grenada'
  ],
  [Difficulty.Master]: [
    'Tristan da Cunha', 'Pitcairn Islands', 'Niue', 'Tuvalu', 'Wallis and Futuna', 
    'Sint Maarten', 'Tokelau', 'Mayotte', 'Montserrat', 'Bouvet Island', 'Svalbard',
    'Saint Pierre and Miquelon', 'Cocos Islands', 'Christmas Island', 'South Georgia'
  ]
};

export function getRandomCountry(difficulty: Difficulty = Difficulty.Medium): string {
  const list = COUNTRIES_BY_LEVEL[difficulty] || COUNTRIES_BY_LEVEL[Difficulty.Medium];
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
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined') {
     // Mock fallback if no API key
     return { isValid: false, distance: 0, direction: '?', percentage: 0, canonicalName: guess, lat: 0, lng: 0 };
  }

  const ai = new GoogleGenAI({ apiKey });
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
      4. Rate proximity percentage (100% is exactly the target).
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
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined') return "A land of mystery.";

  const ai = new GoogleGenAI({ apiKey });
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
