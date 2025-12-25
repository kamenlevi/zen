import { GoogleGenAI } from "@google/genai";
import { Difficulty, WordleStatus } from '../types.ts';

const WORDS_BY_DIFFICULTY: Record<Difficulty, string[]> = {
  [Difficulty.Easy]: ['HEART', 'MUSIC', 'WATER', 'PEACE', 'LIGHT', 'WORLD', 'BREAD', 'HOUSE', 'NIGHT', 'WHITE'],
  [Difficulty.Medium]: ['BRAVE', 'STORM', 'CRANE', 'GLOVE', 'BRICK', 'FLAME', 'GHOST', 'SHARK', 'PLANT', 'OCEAN'],
  [Difficulty.Hard]: ['FJORD', 'PHLOX', 'ABYSS', 'QUERY', 'WASTE', 'YACHT', 'KNAVE', 'QUIRK', 'SNOUT', 'ZESTY'],
  [Difficulty.Expert]: ['SYLPH', 'GNASH', 'UNMET', 'SNORE', 'AMUSE', 'ADAPT', 'SPAWN', 'JUDGE', 'BLUFF', 'CRAWL'],
  [Difficulty.Master]: ['FIFIS', 'XYLEM', 'CRWTH', 'AIOLI', 'SYBAR', 'OORIE', 'ZOWIE', 'SABRA', 'REIFY', 'SQUAB']
};

/**
 * Generates a unique 5-letter word using Gemini API based on difficulty.
 */
export async function generateDynamicWord(difficulty: Difficulty): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined') {
    const list = WORDS_BY_DIFFICULTY[difficulty];
    return list[Math.floor(Math.random() * list.length)].toUpperCase();
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate one single 5-letter English word for a Wordle game.
      Difficulty Level: ${difficulty} 
      (Easy = extremely common, Master = extremely obscure/rare).
      Respond with ONLY the word in uppercase.`,
    });
    const word = response.text?.trim().toUpperCase();
    if (word && word.length === 5 && /^[A-Z]+$/.test(word)) {
      return word;
    }
  } catch (e) {
    console.error("AI Word Generation failed, falling back", e);
  }
  const list = WORDS_BY_DIFFICULTY[difficulty];
  return list[Math.floor(Math.random() * list.length)].toUpperCase();
}

/**
 * Validates a word using the Gemini API for strict dictionary checking.
 */
export async function isValidWord(word: string): Promise<boolean> {
  const w = word.trim().toUpperCase();
  if (w.length !== 5) return false;

  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined') return true;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Is the 5-letter string "${w}" a valid, correctly spelled real English word found in standard dictionaries? 
      Strict rules:
      - Reject common typos (e.g., 'babie' is a typo of 'baby' and is INVALID).
      - Reject keyboard mashes.
      Respond ONLY with "VALID" or "INVALID".`,
      config: { 
        thinkingConfig: { thinkingBudget: 2048 },
        temperature: 0 
      }
    });

    return response.text?.trim().toUpperCase() === 'VALID';
  } catch (e) {
    console.error("Validation API error:", e);
    return true; 
  }
}

export function getWordFeedback(guess: string, target: string): WordleStatus[] {
  if (!guess || !target) return new Array(5).fill('absent');
  const guessArr = guess.toUpperCase().split('');
  const targetArr = target.toUpperCase().split('');
  const feedback: WordleStatus[] = new Array(5).fill('absent');
  const targetUsed = new Array(5).fill(false);

  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      feedback[i] = 'correct';
      targetUsed[i] = true;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (feedback[i] === 'correct') continue;
    for (let j = 0; j < 5; j++) {
      if (!targetUsed[j] && guessArr[i] === targetArr[j]) {
        feedback[i] = 'present';
        targetUsed[j] = true;
        break;
      }
    }
  }
  return feedback;
}