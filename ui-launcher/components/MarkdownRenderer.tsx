import React from 'react';

interface MarkdownRendererProps {
  content: string;
  onCopyCode?: (code: string) => void;
}

export function renderInline(text: string): React.ReactNode[] {
  if (!text) return [];
  // Tokeniza: Imagens, Links, inline code, bold, italic, strikethrough e <br>
  const tokenRegex = /(!\[.*?\]\(.*?\)|\`.*?\`|\[.*?\]\(.*?\)|\*\*.*?\*\*|__.*?__|(?<!\*)\*.*?\*(?!\*)|(?<!_)_.*?_(?!_)|~~.*?~~|<br\s*\/?>)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    // Imagem: ![alt](url)
    const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const alt = imgMatch[1];
      const src = imgMatch[2];
      return (
        <span key={i} className="block my-3">
          <span className="block overflow-hidden rounded-xl border border-amber-500/30 bg-[#0c0c16] max-w-md shadow-2xl group">
            <img
              src={src}
              alt={alt}
              className="w-full h-auto object-cover max-h-[460px] rounded-t-xl transition-transform duration-300 group-hover:scale-[1.01]"
              loading="lazy"
            />
            <span className="p-2.5 px-3 flex items-center justify-between text-xs text-zinc-400 bg-[#12121e] border-t border-zinc-800/80">
              <span className="truncate pr-2 font-mono text-zinc-300">{alt || 'Imagem sintetizada'}</span>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline underline-offset-2 flex items-center gap-1 shrink-0 font-medium font-mono text-[11px]"
              >
                Abrir Imagem ↗
              </a>
            </span>
          </span>
        </span>
      );
    }

    // Quebra de linha HTML (<br>)
    if (/^<br\s*\/?>$/i.test(part)) {
      return <br key={i} />;
    }

    // Código Inline: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={i}
          className="bg-[#121220] border border-[#28283c] px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px] mx-0.5"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Negrito: **text** ou __text__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return (
        <strong key={i} className="font-bold text-white tracking-wide">
          {renderInline(part.slice(2, -2))}
        </strong>
      );
    }

    // Itálico: *text* ou _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <em key={i} className="italic text-gray-200">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Tachado: ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      return (
        <del key={i} className="line-through text-gray-500">
          {part.slice(2, -2)}
        </del>
      );
    }

    // Link: [label](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
}

function isTableSeparator(line: string): boolean {
  return /^\|(\s*:?-+:?\s*\|)+$/.test(line.trim());
}

function parseTableRow(line: string): string[] {
  const trimmed = line.trim();
  const inner = trimmed.startsWith('|') && trimmed.endsWith('|')
    ? trimmed.slice(1, -1)
    : trimmed;
  return inner.split('|').map(c => c.trim());
}

export default function MarkdownRenderer({ content, onCopyCode }: MarkdownRendererProps) {
  if (!content) return null;

  // 1. Separa blocos de código cercados (```lang ... ```) de blocos de texto
  const codeBlockRegex = /(```[\s\S]*?```)/g;
  const sections = content.split(codeBlockRegex);

  return (
    <div className="space-y-2 select-text leading-relaxed text-xs">
      {sections.map((section, sIdx) => {
        // Bloco de código
        if (section.startsWith('```') && section.endsWith('```')) {
          const firstLineEnd = section.indexOf('\n');
          const lang = section.slice(3, firstLineEnd > 0 ? firstLineEnd : 3).trim().toLowerCase() || 'código';
          const code = firstLineEnd > 0 ? section.slice(firstLineEnd + 1, -3) : section.slice(3, -3);
          const isDiff = lang === 'diff';

          return (
            <div key={sIdx} className="my-2.5 rounded-xl overflow-hidden border border-[#222238] bg-[#070710]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d0d18] border-b border-[#222238] text-[10px] text-gray-400 font-mono">
                <span className={`uppercase tracking-wider font-bold ${isDiff ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {lang}
                </span>
                {onCopyCode && (
                  <button
                    type="button"
                    onClick={() => onCopyCode(code)}
                    className="hover:text-white flex items-center gap-1 bg-white/[0.06] hover:bg-white/[0.12] px-2 py-0.5 rounded transition cursor-pointer"
                  >
                    📋 Copiar Código
                  </button>
                )}
              </div>
              <pre className="p-3.5 text-[11px] font-mono text-gray-200 overflow-x-auto whitespace-pre leading-relaxed">
                {isDiff ? (
                  <code>
                    {code.split('\n').map((line, lidx) => {
                      let colorClass = 'text-gray-300';
                      if (line.startsWith('+')) colorClass = 'text-emerald-400 bg-emerald-950/25 block px-1 -mx-1 rounded';
                      else if (line.startsWith('-')) colorClass = 'text-rose-400 bg-rose-950/25 block px-1 -mx-1 rounded';
                      else if (line.startsWith('@@')) colorClass = 'text-cyan-400 block font-bold';
                      return <span key={lidx} className={colorClass}>{line}{'\n'}</span>;
                    })}
                  </code>
                ) : (
                  <code>{code}</code>
                )}
              </pre>
            </div>
          );
        }

        // Bloco de texto: processa parágrafos, tabelas, headers, listas
        const lines = section.split('\n');
        const elements: React.ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];
          const trimmed = line.trim();

          // Linha vazia
          if (!trimmed) {
            i++;
            continue;
          }

          // Divisores: --- ou ***
          if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            elements.push(<hr key={i} className="border-[#202030] my-3.5" />);
            i++;
            continue;
          }

          // Headers
          if (trimmed.startsWith('#')) {
            const levelMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
            if (levelMatch) {
              const level = levelMatch[1].length;
              const title = levelMatch[2];
              if (level === 1) {
                elements.push(
                  <h1 key={i} className="text-sm font-extrabold text-white mt-4 mb-2 pb-1 border-b border-[#202032]">
                    {renderInline(title)}
                  </h1>
                );
              } else if (level === 2) {
                elements.push(
                  <h2 key={i} className="text-xs font-bold text-amber-300 mt-3 mb-1.5 flex items-center gap-1.5">
                    {renderInline(title)}
                  </h2>
                );
              } else if (level === 3) {
                elements.push(
                  <h3 key={i} className="text-xs font-bold text-amber-400/90 mt-2.5 mb-1">
                    {renderInline(title)}
                  </h3>
                );
              } else {
                elements.push(
                  <h4 key={i} className="text-[11px] font-semibold text-gray-300 mt-2 mb-1">
                    {renderInline(title)}
                  </h4>
                );
              }
              i++;
              continue;
            }
          }

          // Tabelas Markdown: linha começando e terminando com | seguida de divisor
          if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
            const tableHeaders = parseTableRow(lines[i]);
            i += 2; // pula header e separador
            const tableRows: string[][] = [];

            while (i < lines.length && lines[i].trim().startsWith('|')) {
              tableRows.push(parseTableRow(lines[i]));
              i++;
            }

            elements.push(
              <div key={`table-${i}`} className="overflow-x-auto my-3 rounded-xl border border-[#232338] bg-[#070710]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0f0f1c] text-amber-300 font-bold border-b border-[#232338]">
                    <tr>
                      {tableHeaders.map((th, thIdx) => (
                        <th key={thIdx} className="p-2.5 border-r border-[#1c1c2e] last:border-r-0 font-mono tracking-wide">
                          {renderInline(th)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181828]">
                    {tableRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-white/[0.02] transition">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2.5 border-r border-[#181828] last:border-r-0 text-gray-200 align-top">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            continue;
          }

          // Blockquotes: > quote
          if (trimmed.startsWith('>')) {
            const quoteLines = [];
            while (i < lines.length && lines[i].trim().startsWith('>')) {
              quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
              i++;
            }
            elements.push(
              <blockquote key={`quote-${i}`} className="border-l-2 border-amber-500 bg-amber-950/20 px-3.5 py-2 rounded-r-xl my-2 text-gray-300 italic text-[11px]">
                {renderInline(quoteLines.join(' '))}
              </blockquote>
            );
            continue;
          }

          // Listas (Bullet ou Numéricas)
          if (/^(\-|\*|•|\d+\.)\s+/.test(trimmed)) {
            const listItems = [];
            while (i < lines.length && /^(\-|\*|•|\d+\.)\s+/.test(lines[i].trim())) {
              const itemMatch = lines[i].trim().match(/^(\-|\*|•|\d+\.)\s+(.*)$/);
              if (itemMatch) {
                listItems.push({
                  bullet: itemMatch[1],
                  text: itemMatch[2]
                });
              }
              i++;
            }
            elements.push(
              <ul key={`list-${i}`} className="space-y-1 my-1.5 pl-1">
                {listItems.map((item, lIdx) => (
                  <li key={lIdx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono font-bold select-none text-[11px] leading-relaxed">
                      {/\d+\./.test(item.bullet) ? item.bullet : '•'}
                    </span>
                    <span className="flex-1 leading-relaxed">
                      {renderInline(item.text)}
                    </span>
                  </li>
                ))}
              </ul>
            );
            continue;
          }

          // Parágrafo normal
          elements.push(
            <p key={i} className="leading-relaxed">
              {renderInline(line)}
            </p>
          );
          i++;
        }

        return <div key={sIdx} className="space-y-1.5">{elements}</div>;
      })}
    </div>
  );
}
