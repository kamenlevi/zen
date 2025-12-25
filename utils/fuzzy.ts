/**
 * Simple string similarity and fuzzy matching.
 */

export function findBestMatch(input: string, pool: string[]): string {
  const normalizedInput = input.toLowerCase().trim();
  if (!normalizedInput) return "";

  // 1. Exact or starts-with match (highest priority)
  const directMatch = pool.find(p => p.toLowerCase() === normalizedInput);
  if (directMatch) return directMatch;

  // 2. Simple similarity scoring
  let bestScore = 0;
  let bestMatch = pool[0];

  for (const item of pool) {
    const score = calculateSimilarity(normalizedInput, item.toLowerCase());
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  // Only return if it's reasonably close (threshold 0.7)
  return bestScore > 0.6 ? bestMatch : directMatch || "";
}

function calculateSimilarity(s1: string, s2: string): number {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  return (longerLength - editDistance(longer, shorter)) / longerLength;
}

function editDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
