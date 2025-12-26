
import { Difficulty, WordleStatus } from "../types.ts";
import { COMMON_WORDS, OBSCURE_WORDS, DICTIONARY } from "./wordBank.ts";
import { WORDLE_WORDS } from "./wordleWordBank.ts";

const ALL_WORDS_5 = Array.from(new Set([...COMMON_WORDS, ...OBSCURE_WORDS, ...DICTIONARY, ...WORDLE_WORDS]))
  .map(w => w.trim().toUpperCase())
  .filter(w => w.length === 5);

const COMMON_WORD_SET = new Set(COMMON_WORDS.map(w => w.toUpperCase()));
const OBSCURE_WORD_SET = new Set(OBSCURE_WORDS.map(w => w.toUpperCase()));

/**
 * Filter words by difficulty logic based on commonality and character complexity.
 */
function getWordsByDifficulty(difficulty: Difficulty): string[] {
  switch (difficulty) {
    case Difficulty.Easy:
      // Words that are common and in our main Wordle list
      return ALL_WORDS_5.filter(word => COMMON_WORD_SET.has(word));
    case Difficulty.Medium:
      // Words from the main list, not super common, and without very rare letters
      return ALL_WORDS_5.filter(word => !COMMON_WORD_SET.has(word) && !/[QZJX]/.test(word));
    case Difficulty.Hard:
      // Words with some rare letters or less common overall
      return ALL_WORDS_5.filter(word => !COMMON_WORD_SET.has(word) && /[QZJX]/.test(word));
    case Difficulty.Expert:
      // Words containing very rare letters or from the obscure list
      return ALL_WORDS_5.filter(word => OBSCURE_WORD_SET.has(word) || /[QZJXKV]/.test(word));
    case Difficulty.Master:
      // Highly obscure words from the obscure list
      return ALL_WORDS_5.filter(word => OBSCURE_WORD_SET.has(word));
    default:
      return ALL_WORDS_5.filter(word => COMMON_WORD_SET.has(word)); // Default to easy if no specific difficulty
  }
}

/**
 * Generate word based on difficulty.
 */
export async function generateDynamicWord(difficulty: Difficulty): Promise<string> {
  const pool = getWordsByDifficulty(difficulty);
  // Ensure we always return a word, even if the pool for a difficulty is empty (shouldn't happen with merged list)
  if (pool.length === 0) {
    console.warn(`Difficulty pool for ${difficulty} is empty, falling back to ALL_WORDS_5`);
    const fallbackWord = ALL_WORDS_5[Math.floor(Math.random() * ALL_WORDS_5.length)];
    return fallbackWord || "ZENLY";
  }
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
