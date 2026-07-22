import type { ReactNode } from "react";

/**
 * Minimal Markdown-to-React renderer for ORION's replies: bold, italics,
 * bullet lists, and paragraph breaks. Builds React elements directly
 * (never dangerouslySetInnerHTML) so model output can't inject raw HTML.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const key = `${keyPrefix}-${i++}`;
    if (match[1] !== undefined) {
      nodes.push(<strong key={key}>{match[1]}</strong>);
    } else {
      const content = match[2] ?? match[3];
      nodes.push(<em key={key}>{content}</em>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

function renderParagraphLines(lines: string[], keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) nodes.push(<br key={`${keyPrefix}-br-${i}`} />);
    nodes.push(...renderInline(line, `${keyPrefix}-${i}`));
  });
  return nodes;
}

export function renderMarkdown(text: string): ReactNode {
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim() !== "");

  return blocks.map((block, blockIndex) => {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    const bulletLines = lines
      .map((l) => /^[-*]\s+(.*)$/.exec(l.trim()))
      .filter((m): m is RegExpExecArray => m !== null);

    if (bulletLines.length === lines.length && lines.length > 0) {
      return (
        <ul key={`ul-${blockIndex}`}>
          {bulletLines.map((m, i) => (
            <li key={i}>{renderInline(m[1], `li-${blockIndex}-${i}`)}</li>
          ))}
        </ul>
      );
    }

    return <p key={`p-${blockIndex}`}>{renderParagraphLines(lines, `p-${blockIndex}`)}</p>;
  });
}
