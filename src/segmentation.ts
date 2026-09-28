export type ThoughtKind = 'question' | 'idea' | 'thought';

export function splitThoughts(input: string): string[] {
  // A line break is often just a visual pause in one thought. Only an explicit
  // blank line marks a new thought, so saving can never peel a final line or a
  // sentence beginning with "Maybe" into a separate item.
  return input
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n+/)
    .flatMap((paragraph) => {
      const lines = paragraph
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const isList = lines.length > 0 && lines.every((line) => /^(?:[-*•]|\d+[.)])\s+/.test(line));
      return isList
        ? lines.map((line) => line.replace(/^(?:[-*•]|\d+[.)])\s+/, ''))
        : [lines.join(' ')];
    })
    .filter(Boolean);
}

export function classifyThought(text: string): ThoughtKind {
  const normalized = text.trim().toLowerCase();
  if (text.trim().endsWith('?') || /^(how|what|why|where|when|who|can|should|could)\b/.test(normalized)) return 'question';
  if (/^(idea|what if|maybe|could|i wonder)\b/.test(normalized) || normalized.includes('idea')) return 'idea';
  return 'thought';
}
