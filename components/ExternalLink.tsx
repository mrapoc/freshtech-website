import React from 'react';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

/**
 * External Link Component
 * Automatically adds:
 * - External link icon
 * - Opens in new tab
 * - Security attributes (noopener, noreferrer)
 * - Accessible label for screen readers
 */
export const ExternalLink: React.FC<ExternalLinkProps> = ({
  href,
  children,
  className = '',
  showIcon = true
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 ${className}`}
    >
      {children}
      {showIcon && (
        <ExternalLinkIcon
          size={12}
          className="opacity-50 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      )}
      <span className="sr-only">(opens in new tab)</span>
    </a>
  );
};

/**
 * Hook to automatically process external links in content
 * Use with dangerouslySetInnerHTML content
 */
export const useExternalLinks = (containerRef: React.RefObject<HTMLElement>) => {
  React.useEffect(() => {
    if (!containerRef.current) return;

    const links = containerRef.current.querySelectorAll('a[href^="http"]');
    links.forEach((link) => {
      const anchor = link as HTMLAnchorElement;
      // Skip internal links
      if (anchor.hostname === window.location.hostname) return;

      // Add external link attributes
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');

      // Add icon if not already present
      if (!anchor.querySelector('.external-icon')) {
        const icon = document.createElement('span');
        icon.className = 'external-icon inline-block ml-1 opacity-50';
        icon.textContent = '↗';
        icon.setAttribute('aria-hidden', 'true');
        anchor.appendChild(icon);

        // Add screen reader text
        const srText = document.createElement('span');
        srText.className = 'sr-only';
        srText.textContent = '(opens in new tab)';
        anchor.appendChild(srText);
      }
    });
  }, [containerRef]);
};
