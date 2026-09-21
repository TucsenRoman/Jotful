export type ThoughtKind = 'question' | 'idea' | 'thought';

const thoughtStarter = /^(how|what|why|where|when|who|can|could|should|would|is|are|do|does|did|maybe|perhaps|i wonder|idea\b|what if|remember|todo\b|to do\b|need to\b|i need to\b|i should\b|call\b|buy\b|send\b|schedule\b|we should\b|let's\b)/i;

export function splitThoughts(input: string): string[] {
  const paragraphs = input
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .map((value) => value.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, ''))
    .filter(Boolean);

  return paragraphs.flatMap((paragraph) => {
    const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [paragraph];
    const thoughts: string[] = [];
    let current = '';

    for (const sentence of sentences.map((value) => value.trim()).filter((value) => value.length > 2)) {
      if (current && thoughtStarter.test(sentence)) {
        thoughts.push(current);
        current = sentence;
      } else {
        current = current ? `${current} ${sentence}` : sentence;
      }
    }

    if (current) thoughts.push(current);
    return thoughts;
  });
}

export function classifyThought(text: string): ThoughtKind {
  const normalized = text.trim().toLowerCase();
  if (text.trim().endsWith('?') || /^(how|what|why|where|when|who|can|should|could)\b/.test(normalized)) return 'question';
  if (/^(idea|what if|maybe|could|i wonder)\b/.test(normalized) || normalized.includes('idea')) return 'idea';
  return 'thought';
}
