import { GoogleGenAI } from "@google/genai";
import { Difficulty, WordleStatus } from '../types.ts';

const COMMON_VALID_WORDS = new Set([
  'APPLE', 'BEACH', 'BRAIN', 'BREAD', 'BRUSH', 'CHAIR', 'CHEST', 'CHORD', 'CLICK', 'CLOCK',
  'CLOUD', 'DANCE', 'DIARY', 'DRINK', 'EARTH', 'FEAST', 'FIELD', 'FRUIT', 'GLASS', 'GRAPE',
  'GREEN', 'HEART', 'HOUSE', 'JUICE', 'LIGHT', 'LEMON', 'LUCKY', 'MONEY', 'MUSIC', 'NIGHT',
  'OCEAN', 'PARTY', 'PIANO', 'PILOT', 'PLANE', 'PHONE', 'PIZZA', 'PLANT', 'RADIO', 'RIVER',
  'ROBOT', 'SHIRT', 'SHOES', 'SMILE', 'SNAKE', 'SOUND', 'SPACE', 'SPOON', 'STORM', 'TABLE',
  'TIGER', 'TOAST', 'TOUCH', 'TRAIN', 'TRUCK', 'VOICE', 'WATER', 'WATCH', 'WHALE', 'WORLD',
  'WRITE', 'YOUTH', 'ZEBRA', 'STORE', 'PLATE', 'SHINE', 'GREAT', 'LARGE', 'SMALL', 'SWIFT'
]);

const WORDS_BY_DIFFICULTY: Record<Difficulty, string[]> = {
  [Difficulty.Easy]: ['HEART', 'MUSIC', 'WATER', 'PEACE', 'LIGHT', 'WORLD', 'BREAD', 'HOUSE', 'NIGHT', 'WHITE'],
  [Difficulty.Medium]: ['BRAVE', 'STORM', 'CRANE', 'GLOVE', 'BRICK', 'FLAME', 'GHOST', 'SHARK', 'PLANT', 'OCEAN'],
  [Difficulty.Hard]: ['FJORD', 'PHLOX', 'ABYSS', 'QUERY', 'WASTE', 'YACHT', 'KNAVE', 'QUIRK', 'SNOUT', 'ZESTY'],
  [Difficulty.Expert]: ['SYLPH', 'GNASH', 'UNMET', 'SNORE', 'AMUSE', 'ADAPT', 'SPAWN', 'JUDGE', 'BLUFF', 'CRAWL'],
  [Difficulty.Master]: ['FIFIS', 'XYLEM', 'CRWTH', 'AIOLI', 'SYBAR', 'OORIE', 'ZOWIE', 'SABRA', 'REIFY', 'SQUAB']
};

export async function generateDynamicWord(difficulty: Difficulty): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined') {
    const list = WORDS_BY_DIFFICULTY[difficulty];
    return list[Math.floor(Math.random() * list.length)].toUpperCase();
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate one single, valid, real 5-letter English word for a Wordle game.
      Difficulty: ${difficulty}. 
      Easy = very common. Master = very rare but real.
      Respond with ONLY the word in uppercase.`,
    });
    const word = response.text?.trim().toUpperCase();
    if (word && word.length === 5 && /^[A-Z]+$/.test(word)) {
      return word;
    }
  } catch (e) {
    console.error("AI Word Generation failed", e);
  }
  const list = WORDS_BY_DIFFICULTY[difficulty];
  return list[Math.floor(Math.random() * list.length)].toUpperCase();
}

export async function isValidWord(word: string): Promise<boolean> {
  const w = word.trim().toUpperCase();
  if (w.length !== 5) return false;

  // Fast-pass for common words
  if (COMMON_VALID_WORDS.has(w)) return true;

  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined') return true;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Is the 5-letter string "${w}" a real English word found in a standard dictionary? Respond ONLY with "VALID" or "INVALID".`,
      config: { 
        temperature: 0,
        maxOutputTokens: 10
      }
    });

    const result = response.text?.trim().toUpperCase();
    return result === 'VALID';
  } catch (e) {
    console.error("Validation API error:", e);
    // Fallback: If it has a vowel and isn't nonsense, let it pass rather than blocking the game
    const hasVowel = /[AEIOUY]/.test(w);
    return hasVowel;
  }
}

export function getWordFeedback(guess: string, target: string): WordleStatus[] {
  if (!guess || !target) return new Array(5).fill('absent');
  const guessArr = guess.toUpperCase().split('');
  const targetArr = target.toUpperCase().split('');
  const feedback: WordleStatus[] = new Array(5).fill('absent');
  const targetUsed = new Array(5).fill(false);

  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      feedback[i] = 'correct';
      targetUsed[i] = true;
    }
  }

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
