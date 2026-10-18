// Line formats for the capture editor. The editor is a plain TextInput (the
// native rich editor summoned the keyboard on cold launch), so headings, bullets
// and checkboxes live as short prefixes at the start of a line. The prefixes are
// styled in the input and turned into real HTML for `onRichTextChange`.

export type LineKind = "plain" | "heading" | "bullet" | "todo" | "done";

export const linePrefix: Record<Exclude<LineKind, "plain">, string> = {
  heading: "# ",
  bullet: "• ",
  todo: "☐ ",
  done: "☑ ",
};

export function lineKind(line: string): LineKind {
  if (line.startsWith(linePrefix.heading)) return "heading";
  if (line.startsWith(linePrefix.bullet)) return "bullet";
  if (line.startsWith(linePrefix.todo)) return "todo";
  if (line.startsWith(linePrefix.done)) return "done";
  return "plain";
}

export function stripPrefix(line: string) {
  const kind = lineKind(line);
  return kind === "plain" ? line : line.slice(linePrefix[kind].length);
}

/** Index range of the line that holds `cursor`. */
function lineAt(text: string, cursor: number) {
  const at = Math.max(0, Math.min(cursor, text.length));
  const start = text.lastIndexOf("\n", at - 1) + 1;
  const endIndex = text.indexOf("\n", at);
  return { start, end: endIndex === -1 ? text.length : endIndex };
}

export function kindAtCursor(text: string, cursor: number): LineKind {
  const { start, end } = lineAt(text, cursor);
  return lineKind(text.slice(start, end));
}

/**
 * Toggle a format on the line under the cursor. The checkbox tool treats a
 * ticked box as "on" too, so pressing it again clears either.
 */
export function toggleLineKind(
  text: string,
  cursor: number,
  kind: "heading" | "bullet" | "todo",
) {
  const { start, end } = lineAt(text, cursor);
  const line = text.slice(start, end);
  const current = lineKind(line);
  const body = stripPrefix(line);
  const isOn = current === kind || (kind === "todo" && current === "done");
  const next = isOn ? body : linePrefix[kind] + body;
  const delta = next.length - line.length;
  return {
    text: text.slice(0, start) + next + text.slice(end),
    cursor: Math.max(start, cursor + delta),
  };
}

/**
 * When Return is typed at the end of a bullet or checkbox line, carry the
 * prefix to the new line; Return on an empty bullet ends the list.
 */
export function continueList(previous: string, next: string) {
  if (next.length !== previous.length + 1) return null;
  let at = 0;
  while (at < previous.length && previous[at] === next[at]) at += 1;
  if (next[at] !== "\n") return null;
  const { start } = lineAt(previous, at);
  const line = previous.slice(start, at);
  const kind = lineKind(line);
  if (kind !== "bullet" && kind !== "todo" && kind !== "done") return null;
  if (stripPrefix(line).trim() === "") {
    // Empty item + Return: drop the prefix instead of adding a new line.
    const text = previous.slice(0, start) + previous.slice(at);
    return { text, cursor: start };
  }
  const prefix = kind === "bullet" ? linePrefix.bullet : linePrefix.todo;
  const text = next.slice(0, at + 1) + prefix + next.slice(at + 1);
  return { text, cursor: at + 1 + prefix.length };
}

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** HTML for `onRichTextChange`. Plain text keeps the old `<p>…<br>…</p>` shape. */
export function toRichHtml(text: string) {
  if (!text) return "";
  const lines = text.split("\n");
  if (lines.every((line) => lineKind(line) === "plain"))
    return `<p>${escape(text).replace(/\n/g, "<br>")}</p>`;
  const html: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) html.push(`<ul>${list.join("")}</ul>`);
    list = [];
  };
  for (const line of lines) {
    const kind = lineKind(line);
    const body = escape(stripPrefix(line));
    if (kind === "bullet") {
      list.push(`<li><p>${body}</p></li>`);
      continue;
    }
    flush();
    if (kind === "heading") html.push(`<h1>${body}</h1>`);
    else if (kind === "todo" || kind === "done")
      html.push(`<p>${linePrefix[kind]}${body}</p>`);
    else html.push(`<p>${body}</p>`);
  }
  flush();
  return html.join("");
}
