
import { GoogleGenAI } from "@google/genai";
import { Difficulty, WordleStatus } from '../types.ts';

// Common words to ensure the game works offline/locally for basic play.
const COMMON_WORDS = new Set([
  'APPLE', 'BEACH', 'BRAIN', 'BREAD', 'BRUSH', 'CHAIR', 'CHEST', 'CHORD', 'CLICK', 'CLOCK',
  'CLOUD', 'DANCE', 'DIARY', 'DRINK', 'EARTH', 'FEAST', 'FIELD', 'FRUIT', 'GLASS', 'GRAPE',
  'GREEN', 'HEART', 'HOUSE', 'JUICE', 'LIGHT', 'LEMON', 'LUCKY', 'MONEY', 'MUSIC', 'NIGHT',
  'OCEAN', 'PARTY', 'PIANO', 'PILOT', 'PLANE', 'PHONE', 'PIZZA', 'PLANT', 'RADIO', 'RIVER',
  'ROBOT', 'SHIRT', 'SHOES', 'SMILE', 'SNAKE', 'SOUND', 'SPACE', 'SPOON', 'STORM', 'TABLE',
  'TIGER', 'TOAST', 'TOUCH', 'TRAIN', 'TRUCK', 'VOICE', 'WATER', 'WATCH', 'WHALE', 'WORLD',
  'WRITE', 'YOUTH', 'ZEBRA', 'STORE', 'PLATE', 'SHINE', 'GREAT', 'LARGE', 'SMALL', 'SWIFT',
  'CRANE', 'AUDIO', 'ADIEU', 'STEAM', 'STARE', 'CLONE', 'DRINK', 'DREAM', 'FLAME', 'GLARE'
]);

const WORDS_BY_DIFFICULTY: Record<Difficulty, string[]> = {
  [Difficulty.Easy]: ['HEART', 'MUSIC', 'WATER', 'PEACE', 'LIGHT', 'WORLD', 'BREAD', 'HOUSE', 'NIGHT', 'WHITE', 'GREEN', 'APPLE', 'GRAPE', 'POWER', 'CLOCK', 'SMILE', 'VOICE', 'SOUND', 'PLACE', 'TABLE', 'SHINE', 'STORY', 'PHONE', 'TRAIN', 'CLEAN', 'DANCE', 'SHORE', 'PIANO'],
  [Difficulty.Medium]: ['BRAVE', 'STORM', 'CRANE', 'GLOVE', 'BRICK', 'FLAME', 'GHOST', 'SHARK', 'PLANT', 'OCEAN', 'SWIFT', 'FRONT', 'BLOOM', 'QUIET', 'FOCUS', 'CLEAR', 'GREAT', 'LARGE', 'WATCH', 'FLUFF', 'SPICE', 'CLIMB', 'BRISK', 'GLIDE', 'SNOWY', 'VIVID', 'PEARL', 'MIGHT'],
  [Difficulty.Hard]: ['FJORD', 'PHLOX', 'ABYSS', 'QUERY', 'WASTE', 'YACHT', 'KNAVE', 'QUIRK', 'SNOUT', 'ZESTY', 'VIGOR', 'AXIOM', 'VAGUE', 'WRIST', 'JOKER', 'HYENA', 'GECKO', 'PIQUE', 'OZONE', 'EPOXY', 'GAUZE', 'PROXY', 'QUART', 'SPELT', 'AWFUL', 'CLERK', 'DWARF'],
  [Difficulty.Expert]: ['SYLPH', 'GNASH', 'UNMET', 'SNORE', 'AMUSE', 'ADAPT', 'SPAWN', 'JUDGE', 'BLUFF', 'CRAWL', 'PRISM', 'WHARF', 'CHASM', 'BEGET', 'COVET', 'EVOKE', 'QUALM', 'UNZIP', 'FRITZ', 'LYNCH', 'MYTHS', 'QUOTH', 'SWIRL', 'TOPAZ', 'UNTIE', 'VORTX'],
  [Difficulty.Master]: ['FIFIS', 'XYLEM', 'CRWTH', 'AIOLI', 'SYBAR', 'OORIE', 'ZOWIE', 'SABRA', 'REIFY', 'SQUAB', 'ZARFS', 'YAMEN', 'XEBEC', 'WREAK', 'VOLTE', 'ULNAE', 'TYPIC', 'SWALE', 'RUCHE', 'QUATE', 'QOPHS', 'MYLAR', 'KAIAK', 'IDYLL', 'ETUDE', 'DERTH']
};

/**
 * Strict local junk filter to block non-word keyboard mashing.
 */
function isLinguisticJunk(word: string): boolean {
  const w = word.trim().toUpperCase();
  if (w.length !== 5) return true;

  const chars = w.split('');
  const unique = new Set(chars);
  
  // 1. Repetitive characters (AAAAA, BBBBB)
  if (unique.size <= 1) return true;
  
  // 2. Over-frequency of single characters (AAAAB)
  const counts: Record<string, number> = {};
  for (const c of chars) {
    counts[c] = (counts[c] || 0) + 1;
    if (counts[c] >= 4) return true;
  }

  // 3. Known keyboard row/column patterns
  const patterns = ['QWERT', 'ASDFG', 'ZXCVB', 'YUIOP', 'HJKLM', 'QAZXS', 'WEDCV'];
  if (patterns.some(p => w.includes(p) || p.split('').reverse().join('').includes(w))) return true;

  // 4. Missing vowels (A, E, I, O, U, Y)
  // Almost all valid 5-letter English words have a vowel.
  const hasVowel = /[AEIOUY]/.test(w);
  if (!hasVowel) return true;

  // 5. Unnatural consonant clusters (e.g., "RTZPL")
  // Check for 4 or more consecutive non-vowels.
  if (/[BCDFGHJKLMNPQRSTVWXZ]{4,}/.test(w)) {
    // Specifically block strings that don't even have common clusters
    const commonClusters = ['ST', 'CH', 'SH', 'TH', 'WH', 'PL', 'PR', 'TR', 'CL', 'BR', 'GR', 'FL', 'SP', 'SL', 'DR', 'CK', 'NT', 'ND', 'NG'];
    const hasCluster = commonClusters.some(c => w.includes(c));
    if (!hasCluster) return true;
  }

  return false;
}

export function generateWordleWord(difficulty: Difficulty): string {
  const words = WORDS_BY_DIFFICULTY[difficulty] || WORDS_BY_DIFFICULTY[Difficulty.Medium];
  return words[Math.floor(Math.random() * words.length)].toUpperCase();
}

export async function isValidWord(word: string): Promise<boolean> {
  const w = word.trim().toUpperCase();
  if (w.length !== 5) return false;

  // Rule 1: Instant local block if it's obvious junk.
  if (isLinguisticJunk(w)) return false;

  // Rule 2: Instant allow if it's in our known dictionary.
  if (COMMON_WORDS.has(w)) return true;
  for (const list of Object.values(WORDS_BY_DIFFICULTY)) {
    if (list.includes(w)) return true;
  }

  const apiKey = process.env.API_KEY;
  // Rule 3: If no API key, we rely on junk filter + internal list.
  // We've already filtered junk, so we'll be slightly permissive with 
  // plausible words but only if they are clearly NOT junk.
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    // Basic "looks like English" check as final fallback
    return !isLinguisticJunk(w) && /[AEIOUY]/.test(w);
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Is the string "${w}" a real, dictionary-recognized 5-letter English word?
      Reply ONLY with "VALID" or "INVALID". 
      Consider common plurals and simple verb forms. 
      Strictly reject random letters and keyboard mash patterns.`,
    });

    const result = response.text?.trim().toUpperCase();
    return result === 'VALID';
  } catch (e) {
    console.warn("[Wordle] API verification failed, using local heuristic.");
    return !isLinguisticJunk(w);
  }
}

export function getWordFeedback(guess: string, target: string): WordleStatus[] {
  if (!guess || !target) return new Array(5).fill('absent');
  
  const guessArr = guess.toUpperCase().split('');
  const targetArr = target.toUpperCase().split('');
  const feedback: WordleStatus[] = new Array(5).fill('absent');
  const targetUsed = new Array(5).fill(false);

  // First pass: Correct positions
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      feedback[i] = 'correct';
      targetUsed[i] = true;
    }
  }

  // Second pass: Wrong positions
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
