import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  variant?: 'light' | 'dark';
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '', variant = 'dark' }) => {
  const isLight = variant === 'light';

  return (
    <nav aria-label="Breadcrumb" className={`text-sm overflow-hidden ${className}`}>
      <ol className={`flex items-center gap-1 flex-nowrap min-w-0 ${isLight ? 'text-white/70' : 'text-gray-500'}`}>
        {/* Home link */}
        <li className="flex items-center shrink-0">
          <Link
            to="/"
            className={`flex items-center gap-1 transition-colors focus:outline-hidden focus-visible:ring-2 rounded ${
              isLight
                ? 'hover:text-white focus-visible:ring-white'
                : 'hover:text-primary focus-visible:ring-primary'
            }`}
            aria-label="Home"
          >
            <Home size={14} />
            <span className="sr-only md:not-sr-only">Home</span>
          </Link>
        </li>

        {/* Breadcrumb items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className={`flex items-center min-w-0 ${isLast ? 'flex-1' : 'shrink-0'}`}>
              <ChevronRight size={14} className={`mx-1 shrink-0 ${isLight ? 'text-white/50' : 'text-gray-400'}`} aria-hidden="true" />
              {isLast || !item.href ? (
                <span
                  className={`font-medium ${isLast ? 'truncate' : ''} ${isLight ? 'text-white' : 'text-neutral'}`}
                  aria-current={isLast ? 'page' : undefined}
                  title={isLast ? item.label : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className={`transition-colors focus:outline-hidden focus-visible:ring-2 rounded whitespace-nowrap ${
                    isLight
                      ? 'hover:text-white focus-visible:ring-white'
                      : 'hover:text-primary focus-visible:ring-primary'
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
