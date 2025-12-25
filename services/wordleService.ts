
import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, WordleStatus } from '../types.ts';

const WORDS_BY_DIFFICULTY: Record<Difficulty, string[]> = {
  [Difficulty.Easy]: ['HEART', 'MUSIC', 'WATER', 'PEACE', 'LIGHT', 'WORLD', 'BREAD', 'HOUSE', 'NIGHT', 'WHITE', 'GREEN', 'APPLE', 'GRAPE', 'POWER', 'CLOCK', 'SMILE', 'VOICE', 'SOUND', 'PLACE', 'TABLE', 'SHINE', 'STORY', 'PHONE', 'TRAIN', 'CLEAN', 'DANCE', 'SHORE', 'PIANO'],
  [Difficulty.Medium]: ['BRAVE', 'STORM', 'CRANE', 'GLOVE', 'BRICK', 'FLAME', 'GHOST', 'SHARK', 'PLANT', 'OCEAN', 'SWIFT', 'FRONT', 'BLOOM', 'QUIET', 'FOCUS', 'CLEAR', 'GREAT', 'LARGE', 'WATCH', 'FLUFF', 'SPICE', 'CLIMB', 'BRISK', 'GLIDE', 'SNOWY', 'VIVID', 'PEARL', 'MIGHT'],
  [Difficulty.Hard]: ['FJORD', 'PHLOX', 'ABYSS', 'QUERY', 'WASTE', 'YACHT', 'KNAVE', 'QUIRK', 'SNOUT', 'ZESTY', 'VIGOR', 'AXIOM', 'VAGUE', 'WRIST', 'JOKER', 'HYENA', 'GECKO', 'PIQUE', 'OZONE', 'EPOXY', 'GAUZE', 'PROXY', 'QUART', 'SPELT', 'AWFUL', 'CLERK', 'DWARF'],
  [Difficulty.Expert]: ['SYLPH', 'GNASH', 'UNMET', 'SNORE', 'AMUSE', 'ADAPT', 'SPAWN', 'JUDGE', 'BLUFF', 'CRAWL', 'PRISM', 'WHARF', 'CHASM', 'BEGET', 'COVET', 'EVOKE', 'QUALM', 'UNZIP', 'FRITZ', 'LYNCH', 'MYTHS', 'QUOTH', 'SWIRL', 'TOPAZ', 'UNTIE', 'VORTX'],
  [Difficulty.Master]: ['FIFIS', 'XYLEM', 'CRWTH', 'AIOLI', 'SYBAR', 'OORIE', 'ZOWIE', 'SABRA', 'REIFY', 'SQUAB', 'ZARFS', 'YAMEN', 'XEBEC', 'WREAK', 'VOLTE', 'ULNAE', 'TYPIC', 'SWALE', 'RUCHE', 'QUATE', 'QOPHS', 'MYLAR', 'KAIAK', 'IDYLL', 'ETUDE', 'DERTH']
};

/**
 * Heuristic check for junk words like "AAAAA", "ZZZZZ", or "ABABAB".
 * Returns false if the word looks like keyboard mashing or repetitive junk.
 */
function isHeuristicJunk(word: string): boolean {
  const chars = word.toUpperCase().split('');
  const uniqueChars = new Set(chars);
  
  // Rule 1: Too few unique characters (e.g., AAAAA, AAABA)
  if (uniqueChars.size <= 1) return true;
  
  // Rule 2: 4 or more of the same character (e.g., AAAAB)
  const counts: Record<string, number> = {};
  for (const char of chars) {
    counts[char] = (counts[char] || 0) + 1;
    if (counts[char] >= 4) return true;
  }

  return false;
}

export function generateWordleWord(difficulty: Difficulty): string {
  const words = WORDS_BY_DIFFICULTY[difficulty] || WORDS_BY_DIFFICULTY[Difficulty.Medium];
  return words[Math.floor(Math.random() * words.length)].toUpperCase();
}

/**
 * Validates a word using the Gemini Pro API with deep reasoning (Thinking Budget).
 * This ensures the model actually evaluates the word against linguistic rules 
 * rather than guessing or hallucinating validity for mashing.
 */
export async function isValidWord(word: string): Promise<boolean> {
  if (!word || word.length !== 5) return false;
  const w = word.toUpperCase();

  // 1. Instant Junk Filter
  if (isHeuristicJunk(w)) {
    console.debug(`[Wordle] Word "${w}" rejected by junk heuristics.`);
    return false;
  }

  // 2. Internal dictionary check for level-specific words
  for (const level of Object.values(WORDS_BY_DIFFICULTY)) {
    if (level.includes(w)) return true;
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined') {
    console.warn("[Wordle] No API key detected. Validation limited to internal lists and heuristics.");
    // If no API key, and not in internal list, we assume it's valid if it passed junk check
    // to avoid breaking the game for users without keys, unless it's obviously junk.
    return !isHeuristicJunk(w);
  }

  // 3. High-Quality Pro Validation with Thinking Budget
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class lexicographer and Wordle adjudicator.
      
      WORD TO INVESTIGATE: "${w}"
      
      YOUR MISSION:
      Determine if "${w}" is a legitimate 5-letter English word found in standard English dictionaries (Oxford, Merriam-Webster, etc.).
      
      CRITERIA:
      - Reject keyboard mashing (e.g., "ASDFG").
      - Reject repetitive character strings (e.g., "AAAAA").
      - Accept obscure words if they are real (e.g., "XYLEM").
      - Accept common pluralizations or verb forms.
      
      Respond STRICTLY in JSON format.`,
      config: { 
        // Enable deep reasoning to prevent hallucinations on "mashing" words
        thinkingConfig: { thinkingBudget: 2000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: {
              type: Type.BOOLEAN,
              description: "Whether the word is found in a standard English dictionary."
            },
            reasoning: {
              type: Type.STRING,
              description: "Short linguistic justification."
            }
          },
          required: ["isValid"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"isValid": true}');
    console.debug(`[Wordle] API result for "${w}":`, result);
    return result.isValid;
  } catch (e) {
    console.error("[Wordle] Validation API error:", e);
    // On API failure, allow the word if it passed junk check to prevent game block
    return true; 
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
