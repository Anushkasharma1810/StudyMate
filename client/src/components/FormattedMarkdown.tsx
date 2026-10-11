import React from 'react';

interface FormattedMarkdownProps {
  content: string;
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content }) => {
  if (!content) return null;

  // Split into paragraphs / blocks
  const blocks = content.split(/\n\n+/);

  return (
    <div className="markdown-body" style={{ lineHeight: 1.7, fontSize: '0.92rem', wordBreak: 'break-word' }}>
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Code block
        if (trimmed.startsWith('```')) {
          const lines = trimmed.split('\n');
          const lang = lines[0].replace('```', '').trim();
          const code = lines.slice(1, -1).join('\n') || lines.slice(1).join('\n').replace(/```$/, '');
          return (
            <div
              key={bIdx}
              style={{
                margin: '12px 0',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {lang && (
                <div style={{ padding: '4px 12px', background: 'var(--bg-subtle)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-soft)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {lang.toUpperCase()}
                </div>
              )}
              <pre style={{ margin: 0, padding: '12px 16px', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.86rem' }}>
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={bIdx} style={{ fontSize: '1.15rem', fontWeight: 700, margin: '14px 0 6px', color: 'var(--text-main)' }}>
              {renderInline(trimmed.replace(/^###\s+/, ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={bIdx} style={{ fontSize: '1.25rem', fontWeight: 800, margin: '16px 0 8px', color: 'var(--primary)' }}>
              {renderInline(trimmed.replace(/^##\s+/, ''))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={bIdx} style={{ fontSize: '1.4rem', fontWeight: 800, margin: '18px 0 10px', color: 'var(--text-main)' }}>
              {renderInline(trimmed.replace(/^#\s+/, ''))}
            </h1>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={bIdx}
              style={{
                borderLeft: '4px solid var(--primary)',
                background: 'var(--bg-subtle)',
                padding: '10px 16px',
                borderRadius: '0 8px 8px 0',
                margin: '10px 0',
                color: 'var(--text-muted)'
              }}
            >
              {renderInline(trimmed.replace(/^>\s+/, ''))}
            </blockquote>
          );
        }

        // Bullet / Ordered List
        const lines = trimmed.split('\n');
        const isList = lines.every(l => /^\s*([-*•]|\d+\.)\s+/.test(l));
        if (isList) {
          const isOrdered = /^\s*\d+\.\s+/.test(lines[0]);
          if (isOrdered) {
            return (
              <ol key={bIdx} style={{ margin: '8px 0 12px 22px' }}>
                {lines.map((l, lIdx) => (
                  <li key={lIdx} style={{ marginBottom: '4px' }}>
                    {renderInline(l.replace(/^\s*\d+\.\s+/, ''))}
                  </li>
                ))}
              </ol>
            );
          }
          return (
            <ul key={bIdx} style={{ margin: '8px 0 12px 22px' }}>
              {lines.map((l, lIdx) => (
                <li key={lIdx} style={{ marginBottom: '4px' }}>
                  {renderInline(l.replace(/^\s*[-*•]\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }

        // Table (Markdown | col | col |)
        if (trimmed.includes('|') && trimmed.split('\n').length >= 2) {
          const rows = lines.map(l => l.split('|').filter(c => c.trim().length > 0 || c === '').map(c => c.trim()));
          if (rows.length >= 2 && rows[1].some(c => c.includes('---'))) {
            const headers = rows[0];
            const dataRows = rows.slice(2);
            return (
              <div key={bIdx} style={{ overflowX: 'auto', margin: '12px 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr>
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} style={{ padding: '8px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', textAlign: 'left', fontWeight: 600 }}>
                          {renderInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((r, rIdx) => (
                      <tr key={rIdx}>
                        {r.map((cell, cIdx) => (
                          <td key={cIdx} style={{ padding: '8px 12px', border: '1px solid var(--border-subtle)' }}>
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // Standard Paragraph
        return (
          <p key={bIdx} style={{ marginBottom: '10px' }}>
            {lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {renderInline(line)}
                {lineIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

// Render inline Markdown formatting: bold, italic, code, and source page badges
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Replace page citations [Page X] or [Page X, Y]
  const parts = text.split(/(\[Page\s+[\d,\s-]+\]|\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Source Page Citation Badge: [Page X]
    if (/^\[Page\s+[\d,\s-]+\]$/i.test(part)) {
      return (
        <span
          key={idx}
          className="badge badge-primary"
          style={{
            display: 'inline-flex',
            margin: '0 4px',
            fontSize: '0.74rem',
            padding: '2px 8px',
            verticalAlign: 'baseline',
            fontWeight: 600
          }}
        >
          {part.replace(/[\[\]]/g, '')}
        </span>
      );
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={idx} style={{ fontWeight: 700, color: 'var(--text-main)' }}>{part.slice(2, -2)}</strong>;
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return <em key={idx} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
    }

    // Inline Code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          style={{
            background: 'var(--bg-subtle)',
            color: 'var(--primary)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.88em'
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}
