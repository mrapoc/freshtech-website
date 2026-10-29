import React from 'react';
import { Link } from 'react-router-dom';

interface RichTextProps {
  text: string;
  className?: string;
  boldColorClass?: string;
}

export const RichText: React.FC<RichTextProps> = ({ text, className = "", boldColorClass = "font-bold" }) => {
  if (!text) return null;

  // Helper to render inline formatting (bold and links)
  const renderInline = (segment: string, keyPrefix: string): React.ReactNode[] => {
    // Split by link pattern [text](url)
    const parts = segment.split(/\[(.*?)\]\((.*?)\)/g);
    const elements: React.ReactNode[] = [];

    const renderItalic = (str: string, key: string) => {
      const italicParts = str.split(/(\*[^*]+?\*)/g);
      return (
        <React.Fragment key={key}>
          {italicParts.map((part, i) => {
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
              return <em key={i}>{part.slice(1, -1)}</em>;
            }
            return <React.Fragment key={i}>{part}</React.Fragment>;
          })}
        </React.Fragment>
      );
    };

    const renderBold = (str: string, key: string) => {
      const boldParts = str.split(/(\*\*[^*]+?\*\*)/g);
      return (
        <React.Fragment key={key}>
          {boldParts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className={boldColorClass}>{part.slice(2, -2)}</strong>;
            }
            return renderItalic(part, `${key}-${i}`);
          })}
        </React.Fragment>
      );
    };

    for (let i = 0; i < parts.length; i += 3) {
      if (parts[i]) {
        elements.push(renderBold(parts[i], `${keyPrefix}-text-${i}`));
      }

      if (i + 2 < parts.length) {
        const linkText = parts[i+1];
        const url = parts[i+2];
        const isExternal = url.startsWith('http');
        const linkClass = "text-primary font-bold hover:underline hover:text-accent transition-colors";

        if (isExternal) {
          elements.push(
            <a key={`${keyPrefix}-link-${i}`} href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {linkText}
            </a>
          );
        } else {
          elements.push(
            <Link key={`${keyPrefix}-link-${i}`} to={url} className={linkClass}>
              {linkText}
            </Link>
          );
        }
      }
    }

    return elements;
  };

  // Split text into paragraphs first
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className={className}>
      {paragraphs.map((paragraph, pIdx) => {
        // Check if this paragraph is a list (lines starting with - or •)
        const lines = paragraph.split('\n');
        const isListParagraph = lines.every(line =>
          line.trim() === '' || line.trim().startsWith('-') || line.trim().startsWith('•')
        );

        // Check if it's a numbered list (lines starting with numbers)
        const isNumberedList = lines.every(line =>
          line.trim() === '' || /^\d+\./.test(line.trim())
        );

        if (isListParagraph && lines.some(l => l.trim().startsWith('-') || l.trim().startsWith('•'))) {
          return (
            <ul key={pIdx} className="list-disc list-inside space-y-1 my-4 ml-4">
              {lines
                .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
                .map((line, lIdx) => (
                  <li key={lIdx} className="text-gray-700">
                    {renderInline(line.replace(/^[-•]\s*/, ''), `p${pIdx}-l${lIdx}`)}
                  </li>
                ))}
            </ul>
          );
        }

        if (isNumberedList && lines.some(l => /^\d+\./.test(l.trim()))) {
          return (
            <ol key={pIdx} className="list-decimal list-inside space-y-1 my-4 ml-4">
              {lines
                .filter(line => /^\d+\./.test(line.trim()))
                .map((line, lIdx) => (
                  <li key={lIdx} className="text-gray-700">
                    {renderInline(line.replace(/^\d+\.\s*/, ''), `p${pIdx}-l${lIdx}`)}
                  </li>
                ))}
            </ol>
          );
        }

        // Regular paragraph - handle internal line breaks
        return (
          <p key={pIdx} className="mb-4 last:mb-0">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInline(line, `p${pIdx}-l${lIdx}`)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};
