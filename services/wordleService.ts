
import { Difficulty, WordleStatus } from "../types.ts";
import { COMMON_WORDS, OBSCURE_WORDS, DICTIONARY } from "./wordBank.ts";

/**
 * Robust filter and sanitize words from the bank.
 */
const ALL_WORDS_5 = Array.from(new Set([...COMMON_WORDS, ...OBSCURE_WORDS, ...DICTIONARY]))
  .map(w => w.trim().toUpperCase())
  .filter(w => w.length === 5);

const COMMON_5 = COMMON_WORDS
  .map(w => w.trim().toUpperCase())
  .filter(w => w.length === 5);

/**
 * Filter words by difficulty logic based on commonality and character complexity.
 */
function getWordsByDifficulty(difficulty: Difficulty): string[] {
  switch (difficulty) {
    case Difficulty.Easy:
      // High frequency common words from the bank
      const easyPool = ["STARE", "PLANT", "CRANE", "AUDIO", "READY", "LEARN", "TABLE", "BREAD", "HEART", "MUSIC", "PEACE", "TOUCH", "YOUTH", "SPACE", "LIGHT", "HOUSE", "WORLD", "SMART", "DREAM", "FLAME"];
      return easyPool.filter(w => ALL_WORDS_5.includes(w));
    case Difficulty.Medium:
      // Standard dictionary words with unique letters
      return COMMON_5.filter(w => new Set(w).size === 5).slice(0, 800);
    case Difficulty.Hard:
      // Words with double letters or tricky common endings
      return COMMON_5.filter(w => new Set(w).size < 5 || w.endsWith("LY") || w.endsWith("ER"));
    case Difficulty.Expert:
      // Words containing rare letters from the bank
      return ALL_WORDS_5.filter(w => "JKQXZ".split("").some(c => w.includes(c))).slice(0, 500);
    case Difficulty.Master:
      // Obscure words
      return OBSCURE_WORDS.map(w => w.toUpperCase()).filter(w => w.length === 5);
    default:
      return COMMON_5.length > 0 ? COMMON_5 : ["ZENLY"];
  }
}

/**
 * Generate word based on difficulty.
 */
export async function generateDynamicWord(difficulty: Difficulty): Promise<string> {
  const pool = getWordsByDifficulty(difficulty);
  const word = pool[Math.floor(Math.random() * pool.length)];
  return word || "ZENLY";
}

export async function isValidWord(word: string): Promise<boolean> {
  const w = word.trim().toUpperCase();
  if (w.length !== 5) return false;
  return ALL_WORDS_5.includes(w);
}

export function getWordFeedback(guess: string, target: string): WordleStatus[] {
  const g = guess.toUpperCase().split("");
  const t = target.toUpperCase().split("");
  const feedback: WordleStatus[] = new Array(5).fill("absent");
  const tMatches = new Array(5).fill(false);
  const gMatches = new Array(5).fill(false);

  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      feedback[i] = "correct";
      tMatches[i] = true;
      gMatches[i] = true;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (gMatches[i]) continue;
    for (let j = 0; j < 5; j++) {
      if (!tMatches[j] && g[i] === t[j]) {
        feedback[i] = "present";
        tMatches[j] = true;
        break;
      }
    }
  }
  return feedback;
}
