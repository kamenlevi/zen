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
      contents: `Generate one single, valid, common 5-letter English word for a Wordle game.
      Difficulty: ${difficulty}. 
      Easy means words everyone knows. Master means very rare/obscure but still in a standard dictionary.
      Return ONLY the word in uppercase.`,
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
 * Validates a word using the Gemini API with a high thinking budget for dictionary accuracy.
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
      contents: `Linguistic Audit: Is the 5-letter string "${w}" a real, correctly spelled English word found in standard dictionaries like Oxford or Merriam-Webster?
      
      STRICT REJECTION CRITERIA:
      1. Reject common typos (e.g., 'babie' is a typo of 'baby' and is INVALID).
      2. Reject non-words/keyboard mashes (e.g., 'asdfg').
      3. Reject proper nouns unless they are also common words.
      4. Reject pluralizations that are not standard (e.g., 'doggy' vs 'doggi').

      Respond ONLY with "VALID" or "INVALID".`,
      config: { 
        thinkingConfig: { thinkingBudget: 4096 },
        temperature: 0 
      }
    });

    const result = response.text?.trim().toUpperCase();
    return result === 'VALID';
  } catch (e) {
    console.error("Validation API error:", e);
    // On error, we fallback to a simple vowel check to at least reject obvious junk
    const hasVowel = /[AEIOUY]/.test(w);
    const noRepeatedJunk = !/(.)\1{3,}/.test(w); // No 4x repeated letters
    return hasVowel && noRepeatedJunk;
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
