
import { GoogleGenAI } from "@google/genai";
import { Difficulty, WordleStatus } from '../types.ts';

// Expanded internal dictionaries to ensure common words work perfectly offline/locally.
const COMMON_WORDS = new Set([
  'APPLE', 'BEACH', 'BRAIN', 'BREAD', 'BRUSH', 'CHAIR', 'CHEST', 'CHORD', 'CLICK', 'CLOCK',
  'CLOUD', 'DANCE', 'DIARY', 'DRINK', 'EARTH', 'FEAST', 'FIELD', 'FRUIT', 'GLASS', 'GRAPE',
  'GREEN', 'HEART', 'HOUSE', 'JUICE', 'LIGHT', 'LEMON', 'LUCKY', 'MONEY', 'MUSIC', 'NIGHT',
  'OCEAN', 'PARTY', 'PIANO', 'PILOT', 'PLANE', 'PHONE', 'PIZZA', 'PLANT', 'RADIO', 'RIVER',
  'ROBOT', 'SHIRT', 'SHOES', 'SMILE', 'SNAKE', 'SOUND', 'SPACE', 'SPOON', 'STORM', 'TABLE',
  'TIGER', 'TOAST', 'TOUCH', 'TRAIN', 'TRUCK', 'VOICE', 'WATER', 'WATCH', 'WHALE', 'WORLD',
  'WRITE', 'YOUTH', 'ZEBRA', 'STORE', 'PLATE', 'SHINE', 'GREAT', 'LARGE', 'SMALL', 'SWIFT'
]);

const WORDS_BY_DIFFICULTY: Record<Difficulty, string[]> = {
  [Difficulty.Easy]: ['HEART', 'MUSIC', 'WATER', 'PEACE', 'LIGHT', 'WORLD', 'BREAD', 'HOUSE', 'NIGHT', 'WHITE', 'GREEN', 'APPLE', 'GRAPE', 'POWER', 'CLOCK', 'SMILE', 'VOICE', 'SOUND', 'PLACE', 'TABLE', 'SHINE', 'STORY', 'PHONE', 'TRAIN', 'CLEAN', 'DANCE', 'SHORE', 'PIANO'],
  [Difficulty.Medium]: ['BRAVE', 'STORM', 'CRANE', 'GLOVE', 'BRICK', 'FLAME', 'GHOST', 'SHARK', 'PLANT', 'OCEAN', 'SWIFT', 'FRONT', 'BLOOM', 'QUIET', 'FOCUS', 'CLEAR', 'GREAT', 'LARGE', 'WATCH', 'FLUFF', 'SPICE', 'CLIMB', 'BRISK', 'GLIDE', 'SNOWY', 'VIVID', 'PEARL', 'MIGHT'],
  [Difficulty.Hard]: ['FJORD', 'PHLOX', 'ABYSS', 'QUERY', 'WASTE', 'YACHT', 'KNAVE', 'QUIRK', 'SNOUT', 'ZESTY', 'VIGOR', 'AXIOM', 'VAGUE', 'WRIST', 'JOKER', 'HYENA', 'GECKO', 'PIQUE', 'OZONE', 'EPOXY', 'GAUZE', 'PROXY', 'QUART', 'SPELT', 'AWFUL', 'CLERK', 'DWARF'],
  [Difficulty.Expert]: ['SYLPH', 'GNASH', 'UNMET', 'SNORE', 'AMUSE', 'ADAPT', 'SPAWN', 'JUDGE', 'BLUFF', 'CRAWL', 'PRISM', 'WHARF', 'CHASM', 'BEGET', 'COVET', 'EVOKE', 'QUALM', 'UNZIP', 'FRITZ', 'LYNCH', 'MYTHS', 'QUOTH', 'SWIRL', 'TOPAZ', 'UNTIE', 'VORTX'],
  [Difficulty.Master]: ['FIFIS', 'XYLEM', 'CRWTH', 'AIOLI', 'SYBAR', 'OORIE', 'ZOWIE', 'SABRA', 'REIFY', 'SQUAB', 'ZARFS', 'YAMEN', 'XEBEC', 'WREAK', 'VOLTE', 'ULNAE', 'TYPIC', 'SWALE', 'RUCHE', 'QUATE', 'QOPHS', 'MYLAR', 'KAIAK', 'IDYLL', 'ETUDE', 'DERTH']
};

/**
 * Strict linguistic heuristic to catch junk input instantly.
 * This is designed to block "AAAAA", "QWERT", "ZXCVB", and other mashing patterns.
 */
function isLinguisticJunk(word: string): boolean {
  const w = word.toUpperCase();
  const chars = w.split('');
  const unique = new Set(chars);
  
  // 1. Repetitive strings (AAAAA, BBBBB, etc.)
  if (unique.size <= 1) return true;
  
  // 2. High frequency of a single character (e.g., AAAAB)
  const counts: Record<string, number> = {};
  for (const c of chars) {
    counts[c] = (counts[c] || 0) + 1;
    if (counts[c] >= 4) return true;
  }

  // 3. Obvious keyboard mashes
  const commonMashes = ['ASDFG', 'QWERT', 'ZXCVB', 'HJKLM', 'POIUZ', 'YXCVM'];
  if (commonMashes.includes(w)) return true;

  // 4. Missing vowels (Vowels are A, E, I, O, U and Y)
  // Almost every 5-letter English word has at least one of these.
  const hasVowel = /[AEIOUY]/.test(w);
  if (!hasVowel) return true;

  // 5. Implausible consonant clusters (e.g., "RTZPQ")
  // Check for 4 or more consecutive consonants (very rare in valid 5-letter words)
  if (/[BCDFGHJKLMNPQRSTVWXZ]{4,}/.test(w)) {
    // Exception for specific valid clusters like 'THRILL' or 'SCHEME' but those aren't 5 letters
    // For 5 letters, 4 consonants in a row is almost always junk (e.g., "STRNG" is 5 but not a full word)
    // We'll be slightly lenient for things like "STRENGTH" (8) but for 5 letters, 4 is a strong junk signal.
    return true;
  }

  return false;
}

export function generateWordleWord(difficulty: Difficulty): string {
  const words = WORDS_BY_DIFFICULTY[difficulty] || WORDS_BY_DIFFICULTY[Difficulty.Medium];
  return words[Math.floor(Math.random() * words.length)].toUpperCase();
}

/**
 * High-accuracy validation using gemini-3-pro-preview.
 */
export async function isValidWord(word: string): Promise<boolean> {
  const w = word.trim().toUpperCase();
  if (w.length !== 5) return false;

  // 1. Instant check against junk heuristics
  if (isLinguisticJunk(w)) {
    console.debug(`[Wordle] "${w}" rejected by local junk filter.`);
    return false;
  }

  // 2. Instant check against internal dictionaries
  if (COMMON_WORDS.has(w)) return true;
  for (const list of Object.values(WORDS_BY_DIFFICULTY)) {
    if (list.includes(w)) return true;
  }

  const apiKey = process.env.API_KEY;
  // If no API key is available locally, we trust the junk filter.
  // This prevents the "AAAAA is allowed" issue for users without keys.
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    console.warn("[Wordle] No API key detected. Using strict heuristics.");
    return !isLinguisticJunk(w);
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    // Using gemini-3-pro-preview for "slower but better" accuracy.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Linguistic Verification Task:
      Is "${w}" a real, recognized 5-letter English word (dictionary word, common plural, or verb form)?
      
      RULES:
      - Reply ONLY with "VALID" or "INVALID".
      - Strictly reject non-words, keyboard mashing, and strings of random letters.`,
    });

    const result = response.text?.trim().toUpperCase();
    console.debug(`[Wordle] Pro API result for "${w}": ${result}`);
    return result === 'VALID';
  } catch (e) {
    console.error("[Wordle] Validation API failure:", e);
    // On failure, fallback to our strict junk filter
    return !isLinguisticJunk(w);
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
