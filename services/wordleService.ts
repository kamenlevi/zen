import { Difficulty, WordleStatus } from "../types.ts";

/* --------------------------------------------------
   Word lists
-------------------------------------------------- */

const WORDS_BY_DIFFICULTY: Record<Difficulty, string[]> = {
  [Difficulty.Easy]: [
    "HEART","MUSIC","WATER","PEACE","LIGHT","WORLD","BREAD","HOUSE","NIGHT","WHITE"
  ],
  [Difficulty.Medium]: [
    "BRAVE","STORM","CRANE","GLOVE","BRICK","FLAME","GHOST","SHARK","PLANT","OCEAN"
  ],
  [Difficulty.Hard]: [
    "FJORD","PHLOX","ABYSS","QUERY","WASTE","YACHT","KNAVE","QUIRK","SNOUT","ZESTY"
  ],
  [Difficulty.Expert]: [
    "SYLPH","GNASH","UNMET","SNORE","AMUSE","ADAPT","SPAWN","JUDGE","BLUFF","CRAWL"
  ],
  [Difficulty.Master]: [
    "FIFIS","XYLEM","CRWTH","AIOLI","SYBAR","OORIE","ZOWIE","SABRA","REIFY","SQUAB"
  ]
};

/* --------------------------------------------------
   Build a fast lookup set ONCE
-------------------------------------------------- */

const ALL_VALID_WORDS = new Set(
  Object.values(WORDS_BY_DIFFICULTY).flat()
);

/* --------------------------------------------------
   Generate word
-------------------------------------------------- */

export function generateDynamicWord(difficulty: Difficulty): string {
  const list = WORDS_BY_DIFFICULTY[difficulty];
  return list[Math.floor(Math.random() * list.length)];
}

/* --------------------------------------------------
   Validate guess
-------------------------------------------------- */

export function isValidWord(word: string): boolean {
  const w = word.trim().toUpperCase();

  if (!/^[A-Z]{5}$/.test(w)) return false;
  return ALL_VALID_WORDS.has(w);
}

/* --------------------------------------------------
   Feedback logic (unchanged)
-------------------------------------------------- */

export function getWordFeedback(
  guess: string,
  target: string
): WordleStatus[] {

  const g = guess.toUpperCase().split("");
  const t = target.toUpperCase().split("");

  const feedback: WordleStatus[] = new Array(5).fill("absent");
  const used = new Array(5).fill(false);

  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      feedback[i] = "correct";
      used[i] = true;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (feedback[i] === "correct") continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && g[i] === t[j]) {
        feedback[i] = "present";
        used[j] = true;
        break;
      }
    }
  }

  return feedback;
}
