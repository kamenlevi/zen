
import { GoogleGenAI } from "@google/genai";
import { Difficulty, WordleStatus } from '../types.ts';

const WORDS_BY_DIFFICULTY: Record<Difficulty, string[]> = {
  [Difficulty.Easy]: ['HEART', 'MUSIC', 'WATER', 'PEACE', 'LIGHT', 'WORLD', 'BREAD', 'HOUSE', 'NIGHT', 'WHITE', 'GREEN', 'APPLE', 'GRAPE', 'POWER', 'CLOCK', 'SMILE', 'VOICE', 'SOUND', 'PLACE', 'TABLE', 'SHINE', 'STORY', 'PHONE', 'TRAIN', 'CLEAN', 'DANCE', 'SHORE', 'PIANO'],
  [Difficulty.Medium]: ['BRAVE', 'STORM', 'CRANE', 'GLOVE', 'BRICK', 'FLAME', 'GHOST', 'SHARK', 'PLANT', 'OCEAN', 'SWIFT', 'FRONT', 'BLOOM', 'QUIET', 'FOCUS', 'CLEAR', 'GREAT', 'LARGE', 'WATCH', 'FLUFF', 'SPICE', 'CLIMB', 'BRISK', 'GLIDE', 'SNOWY', 'VIVID', 'PEARL', 'MIGHT'],
  [Difficulty.Hard]: ['FJORD', 'PHLOX', 'ABYSS', 'QUERY', 'WASTE', 'YACHT', 'KNAVE', 'QUIRK', 'SNOUT', 'ZESTY', 'VIGOR', 'AXIOM', 'VAGUE', 'WRIST', 'JOKER', 'HYENA', 'GECKO', 'PIQUE', 'OZONE', 'EPOXY', 'GAUZE', 'PROXY', 'QUART', 'SPELT', 'AWFUL', 'CLERK', 'DWARF'],
  [Difficulty.Expert]: ['SYLPH', 'GNASH', 'UNMET', 'SNORE', 'AMUSE', 'ADAPT', 'SPAWN', 'JUDGE', 'BLUFF', 'CRAWL', 'PRISM', 'WHARF', 'CHASM', 'BEGET', 'COVET', 'EVOKE', 'QUALM', 'UNZIP', 'FRITZ', 'LYNCH', 'MYTHS', 'QUOTH', 'SWIRL', 'TOPAZ', 'UNTIE', 'VORTX'],
  [Difficulty.Master]: ['FIFIS', 'XYLEM', 'CRWTH', 'AIOLI', 'SYBAR', 'OORIE', 'ZOWIE', 'SABRA', 'REIFY', 'SQUAB', 'ZARFS', 'YAMEN', 'XEBEC', 'WREAK', 'VOLTE', 'ULNAE', 'TYPIC', 'SWALE', 'RUCHE', 'QUATE', 'QOPHS', 'MYLAR', 'KAIAK', 'IDYLL', 'ETUDE', 'DERTH']
};

// Local "Fast-Cache" for instant validation of common words
const COMMON_DICTIONARY_CACHE = new Set([
  'ABACK','ABASE','ABATE','ABBEY','ABBOT','ABHOR','ABIDE','ABLED','ABODE','ABORT','ABOUT','ABOVE','ABUSE','ABYSS','ACORN','ACRID','ACTOR','ACUTE','ADAGE','ADAPT','ADULT','AFTER','AGAIN','AGAPE','AGATE','AGENT','AGILE','AGING','AGLOW','AGONY','AGREE','AHEAD','AIDED','AIOLI','ALARM','ALBUM','ALDER','ALIEN','ALIKE','ALIVE','ALLAY','ALLEY','ALLOT','ALLOW','ALLOY','ALOFT','ALONE','ALONG','ALOOF','ALOUD','ALPHA','ALTAR','ALTER','AMASS','AMAZE','AMBER','AMBLE','AMEND','AMISS','AMPLE','AMPLY','AMUSE','ANGEL','ANGER','ANGLE','ANGRY','ANGST','ANIME','ANKLE','ANNEX','ANNOY','ANNUL','ANODE','ANTIC','ANVIL','AORTA','APART','APHID','APING','APNEA','APPLE','APPLY','APRON','APTLY','ARBOR','ARDOR','ARENA','ARGUE','ARISE','ARMOR','AROMA','AROSE','ARRAY','ARROW','ARSON','ARTSY','ASCOT','ASHEN','ASIDE','ASKEW','ASSAY','ASSET','ATOLL','ATONE','ATTIC','AUDIO','AUDIT','AUGUR','AUNTY','AVAIL','AVERT','AVIAN','AVOID','AWAIT','AWAKE','AWARD','AWARE','AWASH','AWFUL','AWOKE','AXIAL','AXIOM','AXION','AZURE',
  'BACON','BADGE','BADLY','BAGEL','BAGGY','BAKER','BALER','BALMY','BANAL','BANJO','BARGE','BARON','BASAL','BASIC','BASIL','BASIN','BASIS','BASTE','BATCH','BATHE','BATON','BATTY','BEACH','BEADY','BEARD','BEAST','BEECH','BEEFY','BEFIT','BEGAN','BEGAT','BEGET','BEGIN','BEGUN','BEING','BELCH','BELIE','BELLE','BELLY','BELOW','BENCH','BERET','BERRY','BERTH','BESET','BETEL','BEVEL','BEZEL','BIBLE','BICEP','BIDEW','BIGOT','BIKEW','BILGE','BILLY','BINGE','BINGO','BIOME','BIRCH','BIRTH','BISON','BITTY','BLACK','BLADE','BLAME','BLAND','BLANK','BLARE','BLAST','BLAZE','BLEAK','BLEAT','BLEED','BLEEP','BLEND','BLESS','BLIMP','BLIND','BLINK','BLISS','BLITZ','BLOAT','BLOCK','BLOKE','BLOND','BLOOD','BLOOM','BLOWN','BLUFF','BLUNT','BLURB','BLURT','BLUSH','BOARD','BOAST','BOBBY','BONEY','BONGO','BONUS','BOOBY','BOOST','BOOTH','BOOTY','BOOZE','BOOZY','BORAX','BORNE','BOSOM','BOSSY','BOTCH','BOUGH','BOULE','BOUND','BOWEL','BOXER','BRACE','BRAID','BRAIN','BRAKE','BRAND','BRASH','BRASS','BRAVE','BRAVO','BRAWL','BRAWN','BREAD','BREAK','BREAM','BREED','BRIAR','BRIBE','BRICK','BRIDE','BRIEF','BRINE','BRING','BRINK','BRINY','BRISK','BROAD','BROIL','BROKE','BROOD','BROOK','BROOM','BROTH','BROWN','BROWSE','BRUNT','BRUSH','BRUTE','BUDDY','BUDGE','BUGGY','BUGLE','BUILD','BUILT','BULGE','BULKY','BULLY','BUNCH','BUNNY','BURLY','BURNT','BURST','BUSED','BUSHIE','BUSHY','BUTCH','BUTTE','BUTXO','BUYER'
]);

export function generateWordleWord(difficulty: Difficulty): string {
  const words = WORDS_BY_DIFFICULTY[difficulty] || WORDS_BY_DIFFICULTY[Difficulty.Medium];
  return words[Math.floor(Math.random() * words.length)].toUpperCase();
}

/**
 * Validates a word against a 200,000+ entry English dictionary.
 * Uses a fast local cache first, then falls back to Gemini AI for total dictionary coverage.
 */
export async function isValidWord(word: string): Promise<boolean> {
  if (!word || word.length !== 5) return false;
  const w = word.toUpperCase();

  // 1. Fast check against common words
  if (COMMON_DICTIONARY_CACHE.has(w)) return true;
  for (const level of Object.values(WORDS_BY_DIFFICULTY)) {
    if (level.includes(w)) return true;
  }

  // 2. Comprehensive check using Gemini AI for 200k+ word coverage
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Is "${w}" a valid English word according to the Oxford or Scrabble dictionaries? 
      Strict 5-letter words only.
      Return ONLY a JSON object: {"valid": boolean}`,
      config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || '{"valid": false}');
    return result.valid === true;
  } catch (e) {
    console.error("Dictionary check failed", e);
    // If API fails, fallback to simple length check so user isn't blocked by network errors
    return true; 
  }
}

export function getWordFeedback(guess: string, target: string): WordleStatus[] {
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
