
import { Difficulty, WordleStatus } from "../types.ts";
import { WORDLE_WORDS } from "./wordleWordBank.ts";

const ALL_WORDS_5 = Array.from(new Set(WORDLE_WORDS))
  .map(w => w.trim().toUpperCase())
  .filter(w => w.length === 5);

/**
 * Generate word based on difficulty.
 */
export async function generateDynamicWord(difficulty: Difficulty): Promise<string> {
  const pool = ALL_WORDS_5;
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
