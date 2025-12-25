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
      contents: `Generate one single, valid, real 5-letter English word for a Wordle game.
      Difficulty: ${difficulty}. 
      Easy = very common. Master = very rare/advanced but still in a real dictionary.
      Respond with ONLY the word in uppercase.`,
    });
    const word = response.text?.trim().toUpperCase();
    if (word && word.length === 5 && /^[A-Z]+$/.test(word)) {
      return word;
    }
  } catch (e) {
    console.error("AI Word Generation failed", e);
  }
  const list = WORDS_BY_DIFFICULTY[difficulty];
  return list[Math.floor(Math.random() * list.length)].toUpperCase();
}

/**
 * Validates a word with strict dictionary enforcement using Gemini.
 */
export async function isValidWord(word: string): Promise<boolean> {
  const w = word.trim().toUpperCase();
  if (w.length !== 5) return false;

  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined') return true;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Linguistic Audit: Is the 5-letter string "${w}" a real, correctly spelled English word?
      
      STRICT REJECTION RULES:
      - Reject TYPOS (e.g., 'babie' is a typo of 'baby' and is INVALID).
      - Reject keyboard mashes (e.g., 'asdfg').
      - Reject fake words that just sound real.
      - Reject slang not found in standard dictionaries.

      Respond ONLY with "VALID" or "INVALID".`,
      config: { 
        temperature: 0 
      }
    });

    const result = response.text?.trim().toUpperCase();
    return result === 'VALID';
  } catch (e) {
    console.error("Validation API error:", e);
    // On error, default to false to prevent non-words from slipping through.
    // We only allow if it's in our tiny internal difficulty list as a fallback.
    return Object.values(WORDS_BY_DIFFICULTY).some(list => list.includes(w));
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
