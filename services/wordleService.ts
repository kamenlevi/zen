import { GoogleGenAI } from "@google/genai";
import { Difficulty, WordleStatus } from '../types.ts';

/**
 * A curated list of common 5-letter words to allow for instant validation.
 * For words not in this list, the app performs a deep linguistic check via the Gemini API.
 */
const COMMON_WORDS = new Set([
  'APPLE', 'BEACH', 'BRAIN', 'BREAD', 'BRUSH', 'CHAIR', 'CHEST', 'CHORD', 'CLICK', 'CLOCK',
  'CLOUD', 'DANCE', 'DIARY', 'DRINK', 'EARTH', 'FEAST', 'FIELD', 'FRUIT', 'GLASS', 'GRAPE',
  'GREEN', 'HEART', 'HOUSE', 'JUICE', 'LIGHT', 'LEMON', 'LUCKY', 'MONEY', 'MUSIC', 'NIGHT',
  'OCEAN', 'PARTY', 'PIANO', 'PILOT', 'PLANE', 'PHONE', 'PIZZA', 'PLANT', 'RADIO', 'RIVER',
  'ROBOT', 'SHIRT', 'SHOES', 'SMILE', 'SNAKE', 'SOUND', 'SPACE', 'SPOON', 'STORM', 'TABLE',
  'TIGER', 'TOAST', 'TOUCH', 'TRAIN', 'TRUCK', 'VOICE', 'WATER', 'WATCH', 'WHALE', 'WORLD',
  'WRITE', 'YOUTH', 'ZEBRA', 'STORE', 'PLATE', 'SHINE', 'GREAT', 'LARGE', 'SMALL', 'SWIFT',
  'CRANE', 'AUDIO', 'ADIEU', 'STEAM', 'STARE', 'CLONE', 'DREAM', 'FLAME', 'GLARE'
]);

const WORDS_BY_DIFFICULTY: Record<Difficulty, string[]> = {
  [Difficulty.Easy]: ['HEART', 'MUSIC', 'WATER', 'PEACE', 'LIGHT', 'WORLD', 'BREAD', 'HOUSE', 'NIGHT', 'WHITE', 'GREEN', 'APPLE', 'GRAPE', 'POWER', 'CLOCK', 'SMILE', 'VOICE', 'SOUND', 'PLACE', 'TABLE', 'SHINE', 'STORY', 'PHONE', 'TRAIN', 'CLEAN', 'DANCE', 'SHORE', 'PIANO'],
  [Difficulty.Medium]: ['BRAVE', 'STORM', 'CRANE', 'GLOVE', 'BRICK', 'FLAME', 'GHOST', 'SHARK', 'PLANT', 'OCEAN', 'SWIFT', 'FRONT', 'BLOOM', 'QUIET', 'FOCUS', 'CLEAR', 'GREAT', 'LARGE', 'WATCH', 'FLUFF', 'SPICE', 'CLIMB', 'BRISK', 'GLIDE', 'SNOWY', 'VIVID', 'PEARL', 'MIGHT'],
  [Difficulty.Hard]: ['FJORD', 'PHLOX', 'ABYSS', 'QUERY', 'WASTE', 'YACHT', 'KNAVE', 'QUIRK', 'SNOUT', 'ZESTY', 'VIGOR', 'AXIOM', 'VAGUE', 'WRIST', 'JOKER', 'HYENA', 'GECKO', 'PIQUE', 'OZONE', 'EPOXY', 'GAUZE', 'PROXY', 'QUART', 'SPELT', 'AWFUL', 'CLERK', 'DWARF'],
  [Difficulty.Expert]: ['SYLPH', 'GNASH', 'UNMET', 'SNORE', 'AMUSE', 'ADAPT', 'SPAWN', 'JUDGE', 'BLUFF', 'CRAWL', 'PRISM', 'WHARF', 'CHASM', 'BEGET', 'COVET', 'EVOKE', 'QUALM', 'UNZIP', 'FRITZ', 'LYNCH', 'MYTHS', 'QUOTH', 'SWIRL', 'TOPAZ', 'UNTIE', 'VORTX'],
  [Difficulty.Master]: ['FIFIS', 'XYLEM', 'CRWTH', 'AIOLI', 'SYBAR', 'OORIE', 'ZOWIE', 'SABRA', 'REIFY', 'SQUAB', 'ZARFS', 'YAMEN', 'XEBEC', 'WREAK', 'VOLTE', 'ULNAE', 'TYPIC', 'SWALE', 'RUCHE', 'QUATE', 'QOPHS', 'MYLAR', 'KAIAK', 'IDYLL', 'ETUDE', 'DERTH']
};

/**
 * Heuristic check to quickly discard obvious keyboard mashes and non-linguistic patterns.
 */
function isLinguisticJunk(word: string): boolean {
  const w = word.trim().toUpperCase();
  if (w.length !== 5) return true;
  const chars = w.split('');
  const unique = new Set(chars);
  if (unique.size <= 1) return true;
  const counts: Record<string, number> = {};
  for (const c of chars) {
    counts[c] = (counts[c] || 0) + 1;
    if (counts[c] >= 4) return true;
  }
  const keyboardMash = ['QWERT', 'ASDFG', 'ZXCVB', 'YUIOP', 'HJKLM', 'QAZXS', 'WEDCV'];
  if (keyboardMash.some(p => w.includes(p) || p.split('').reverse().join('').includes(w))) return true;
  if (!/[AEIOUY]/.test(w)) return true;
  if (/[BCDFGHJKLMNPQRSTVWXZ]{4,}/.test(w)) {
    const commonClusters = ['ST', 'CH', 'SH', 'TH', 'WH', 'PL', 'PR', 'TR', 'CL', 'BR', 'GR', 'FL', 'SP', 'SL', 'DR', 'CK', 'NT', 'ND', 'NG'];
    if (!commonClusters.some(c => w.includes(c))) return true;
  }
  return false;
}

export function generateWordleWord(difficulty: Difficulty): string {
  const words = WORDS_BY_DIFFICULTY[difficulty] || WORDS_BY_DIFFICULTY[Difficulty.Medium];
  return words[Math.floor(Math.random() * words.length)].toUpperCase();
}

/**
 * Validates a word using a local dictionary and the Gemini API for deep dictionary checking.
 * Set to use a thinking budget for maximum accuracy.
 */
export async function isValidWord(word: string): Promise<boolean> {
  const w = word.trim().toUpperCase();
  if (w.length !== 5) return false;
  if (isLinguisticJunk(w)) return false;
  if (COMMON_WORDS.has(w)) return true;
  
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined') {
    return !isLinguisticJunk(w);
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    // We use a slow, high-quality check to satisfy the user's request for accuracy.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform a strict linguistic dictionary check. Is the 5-letter string "${w}" a valid, real English word found in standard dictionaries? 
      Strict guidelines: 
      - Reject slang unless widely accepted.
      - Reject common typos (e.g., 'babie' is a typo of 'baby' and should be INVALID).
      - Reject keyboard mashes (e.g., 'fmodj').
      Only respond with the word "VALID" or "INVALID".`,
      config: { 
        thinkingConfig: { thinkingBudget: 2048 },
        temperature: 0 
      }
    });

    const result = response.text?.trim().toUpperCase();
    return result === 'VALID';
  } catch (e) {
    console.error("Word validation API error:", e);
    return !isLinguisticJunk(w);
  }
}

export function getWordFeedback(guess: string, target: string): WordleStatus[] {
  if (!guess || !target) return new Array(5).fill('absent');
  const guessArr = guess.toUpperCase().split('');
  const targetArr = target.toUpperCase().split('');
  const feedback: WordleStatus[] = new Array(5).fill('absent');
  const targetUsed = new Array(5).fill(false);

  // First pass: Find correct positions
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      feedback[i] = 'correct';
      targetUsed[i] = true;
    }
  }

  // Second pass: Find present letters in wrong positions
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
