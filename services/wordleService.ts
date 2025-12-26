
import { Difficulty, WordleStatus } from "../types.ts";
import { COMMON_WORDS, OBSCURE_WORDS, DICTIONARY } from "./wordBank.ts";
import { WORDLE_WORDS } from "./wordleWordBank.ts";
import { WORDLE_ANSWERS } from "./wordleAnswerBank.ts";

const ALL_WORDS_5 = Array.from(new Set([...COMMON_WORDS, ...OBSCURE_WORDS, ...DICTIONARY, ...WORDLE_WORDS]))
  .map(w => w.trim().toUpperCase())
  .filter(w => w.length === 5);

const ANSWER_WORDS_5 = Array.from(new Set(WORDLE_ANSWERS))
  .map(w => w.trim().toUpperCase())
  .filter(w => w.length === 5);

const COMMON_ANSWER_SET = new Set(ANSWER_WORDS_5.filter(word => COMMON_WORDS.includes(word.toLowerCase())));

/**
 * Filter words by difficulty logic based on commonality and character complexity.
 */
function getWordsByDifficulty(difficulty: Difficulty): string[] {
  switch (difficulty) {
    case Difficulty.Easy:
      // Easy words are common words from the answer list
      return ANSWER_WORDS_5.filter(word => COMMON_ANSWER_SET.has(word));
    case Difficulty.Medium:
      // Medium words are from the answer list, not super common, and without very rare letters
      return ANSWER_WORDS_5.filter(word => !COMMON_ANSWER_SET.has(word) && !/[QZJX]/.test(word));
    case Difficulty.Hard:
      // Hard words are from the answer list, with some rare letters or less common overall
      return ANSWER_WORDS_5.filter(word => !COMMON_ANSWER_SET.has(word) && /[QZJX]/.test(word));
    case Difficulty.Expert:
      // Expert words are from the answer list, containing very rare letters
      return ANSWER_WORDS_5.filter(word => /[QZJXKV]/.test(word));
    case Difficulty.Master:
      // Master words are a subset of expert words, potentially more obscure from the answer list
      // For now, it will be the same as expert or a further filtered version if a separate obscure answer list is provided
      return ANSWER_WORDS_5.filter(word => OBSCURE_WORDS.includes(word.toLowerCase()));
    default:
      return ANSWER_WORDS_5.filter(word => COMMON_ANSWER_SET.has(word)); // Default to easy if no specific difficulty
  }
}

/**
 * Generate word based on difficulty.
 */
export async function generateDynamicWord(difficulty: Difficulty): Promise<string> {
  const pool = getWordsByDifficulty(difficulty);
  // Ensure we always return a word, even if the pool for a difficulty is empty
  if (pool.length === 0) {
    console.warn(`Difficulty pool for ${difficulty} is empty, falling back to ANSWER_WORDS_5`);
    const fallbackWord = ANSWER_WORDS_5[Math.floor(Math.random() * ANSWER_WORDS_5.length)];
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
