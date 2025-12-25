
import { GoogleGenAI } from "@google/genai";
import { Difficulty, WordleStatus } from '../types.ts';

const WORDS_BY_DIFFICULTY: Record<Difficulty, string[]> = {
  [Difficulty.Easy]: ['HEART', 'MUSIC', 'WATER', 'PEACE', 'LIGHT', 'WORLD', 'BREAD', 'HOUSE', 'NIGHT', 'WHITE', 'GREEN', 'APPLE', 'GRAPE', 'POWER', 'CLOCK', 'SMILE', 'VOICE', 'SOUND', 'PLACE', 'TABLE', 'SHINE', 'STORY', 'PHONE', 'TRAIN', 'CLEAN', 'DANCE', 'SHORE', 'PIANO'],
  [Difficulty.Medium]: ['BRAVE', 'STORM', 'CRANE', 'GLOVE', 'BRICK', 'FLAME', 'GHOST', 'SHARK', 'PLANT', 'OCEAN', 'SWIFT', 'FRONT', 'BLOOM', 'QUIET', 'FOCUS', 'CLEAR', 'GREAT', 'LARGE', 'WATCH', 'FLUFF', 'SPICE', 'CLIMB', 'BRISK', 'GLIDE', 'SNOWY', 'VIVID', 'PEARL', 'MIGHT'],
  [Difficulty.Hard]: ['FJORD', 'PHLOX', 'ABYSS', 'QUERY', 'WASTE', 'YACHT', 'KNAVE', 'QUIRK', 'SNOUT', 'ZESTY', 'VIGOR', 'AXIOM', 'VAGUE', 'WRIST', 'JOKER', 'HYENA', 'GECKO', 'PIQUE', 'OZONE', 'EPOXY', 'GAUZE', 'PROXY', 'QUART', 'SPELT', 'AWFUL', 'CLERK', 'DWARF'],
  [Difficulty.Expert]: ['SYLPH', 'GNASH', 'UNMET', 'SNORE', 'AMUSE', 'ADAPT', 'SPAWN', 'JUDGE', 'BLUFF', 'CRAWL', 'PRISM', 'WHARF', 'CHASM', 'BEGET', 'COVET', 'EVOKE', 'QUALM', 'UNZIP', 'FRITZ', 'LYNCH', 'MYTHS', 'QUOTH', 'SWIRL', 'TOPAZ', 'UNTIE', 'VORTX'],
  [Difficulty.Master]: ['FIFIS', 'XYLEM', 'CRWTH', 'AIOLI', 'SYBAR', 'OORIE', 'ZOWIE', 'SABRA', 'REIFY', 'SQUAB', 'ZARFS', 'YAMEN', 'XEBEC', 'WREAK', 'VOLTE', 'ULNAE', 'TYPIC', 'SWALE', 'RUCHE', 'QUATE', 'QOPHS', 'MYLAR', 'KAIAK', 'IDYLL', 'ETUDE', 'DERTH']
};

/**
 * Robust heuristic to catch junk input immediately.
 */
function isDefinitelyJunk(word: string): boolean {
  const w = word.toUpperCase();
  const chars = w.split('');
  const unique = new Set(chars);
  
  // 1. All same letters (AAAAA)
  if (unique.size <= 1) return true;
  
  // 2. Keyboard mashes (ASDFG, QWERT)
  const mashes = ['ASDFG', 'QWERT', 'ZXCVB', '12345'];
  if (mashes.includes(w)) return true;

  // 3. No vowels (unless it's a very rare word, but for Wordle we want real words)
  // Standard English words almost always have A, E, I, O, U, or Y.
  if (!/[AEIOUY]/.test(w)) return true;

  // 4. Repetition of 4 or more letters (e.g., AAABA)
  const counts: Record<string, number> = {};
  for (const c of chars) {
    counts[c] = (counts[c] || 0) + 1;
    if (counts[c] >= 4) return true;
  }

  return false;
}

export function generateWordleWord(difficulty: Difficulty): string {
  const words = WORDS_BY_DIFFICULTY[difficulty] || WORDS_BY_DIFFICULTY[Difficulty.Medium];
  return words[Math.floor(Math.random() * words.length)].toUpperCase();
}

/**
 * Validates a word using the Gemini API. 
 * This version uses a simple, highly reliable prompt to avoid JSON parsing errors.
 */
export async function isValidWord(word: string): Promise<boolean> {
  if (!word || word.length !== 5) return false;
  const w = word.toUpperCase();

  // 1. Check local heuristics first
  if (isDefinitelyJunk(w)) return false;

  // 2. Check internal lists
  for (const level of Object.values(WORDS_BY_DIFFICULTY)) {
    if (level.includes(w)) return true;
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined') {
    // Without API key, allow if it passed junk check to not break the game
    return true; 
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Is the sequence of letters "${w}" a valid English word? Answer only with "VALID" or "INVALID".`,
    });

    const result = response.text?.trim().toUpperCase();
    return result === 'VALID';
  } catch (e) {
    console.error("[Wordle] API Check Error:", e);
    // On error, fall back to our junk filter
    return !isDefinitelyJunk(w);
  }
}

export function getWordFeedback(guess: string, target: string): WordleStatus[] {
  const guessArr = guess.toUpperCase().split('');
  const targetArr = target.toUpperCase().split('');
  const feedback: WordleStatus[] = new Array(5).fill('absent');
  const targetUsed = new Array(5).fill(false);

  // First pass: Find all correct letters in the correct position
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      feedback[i] = 'correct';
      targetUsed[i] = true;
    }
  }

  // Second pass: Find present letters in the wrong position
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
