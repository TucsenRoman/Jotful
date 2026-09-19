export type ThoughtKind = 'question' | 'idea' | 'task' | 'thought';

export function splitThoughts(input: string): string[] {
  const paragraphs = input.replace(/\r\n/g, '\n').split(/\n+/).map((value) => value.trim()).filter(Boolean);
  return paragraphs.flatMap((paragraph) => {
    const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [paragraph];
    return sentences.map((value) => value.trim()).filter((value) => value.length > 2);
  });
}

export function classifyThought(text: string): ThoughtKind {
  const normalized = text.trim().toLowerCase();
  if (text.trim().endsWith('?') || /^(how|what|why|where|when|who|can|should|could)\b/.test(normalized)) return 'question';
  if (/^(todo|to do|remember|need to|call|buy|send|schedule)\b/.test(normalized)) return 'task';
  if (/^(idea|what if|maybe|could|i wonder)\b/.test(normalized) || normalized.includes('idea')) return 'idea';
  return 'thought';
}
