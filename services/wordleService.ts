
import { Difficulty, WordleStatus } from "../types.ts";
import { COMMON_WORDS, OBSCURE_WORDS, DICTIONARY } from "./wordBank.ts";

/**
 * Filter words by difficulty logic based on commonality and character complexity.
 */
function getWordsByDifficulty(difficulty: Difficulty): string[] {
  switch (difficulty) {
    case Difficulty.Easy:
      // High frequency common words
      return ["STARE", "PLANT", "CRANE", "AUDIO", "READY", "LEARN", "TABLE", "BREAD", "HEART", "MUSIC"];
    case Difficulty.Medium:
      // Common words with 5 unique letters
      return COMMON_WORDS.filter(w => new Set(w).size === 5).slice(0, 1000);
    case Difficulty.Hard:
      // Common words with double letters or tricky endings
      return COMMON_WORDS.filter(w => new Set(w).size < 5 || w.endsWith("LY") || w.endsWith("ER"));
    case Difficulty.Expert:
      // Tricky common words or rare valid words
      return COMMON_WORDS.filter(w => "JKQXZ".split("").some(c => w.includes(c)));
    case Difficulty.Master:
      // The hardest obscure words from the user dictionary
      return DICTIONARY.slice(0, 500).map(w => w.toUpperCase());
    default:
      return COMMON_WORDS;
  }
}

/**
 * Generate word based on difficulty.
 */
export async function generateDynamicWord(difficulty: Difficulty): Promise<string> {
  const pool = getWordsByDifficulty(difficulty);
  const word = pool[Math.floor(Math.random() * pool.length)];
  return word?.toUpperCase() || "ZENLY";
}

export async function isValidWord(word: string): Promise<boolean> {
  const w = word.trim().toUpperCase();
  // Check against answer pools and the massive dictionary provided
  return COMMON_WORDS.includes(w) || 
         OBSCURE_WORDS.includes(w) || 
         DICTIONARY.some(d => d.toUpperCase() === w);
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
