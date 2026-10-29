import React from 'react';
import { Clock } from 'lucide-react';

interface ReadingTimeProps {
  content: string;
  className?: string;
  wordsPerMinute?: number;
}

/**
 * Reading Time Estimate Component
 * Calculates and displays estimated reading time based on content length
 * Average reading speed: 200-250 words per minute
 */
export const ReadingTime: React.FC<ReadingTimeProps> = ({
  content,
  className = '',
  wordsPerMinute = 200
}) => {
  // Strip HTML tags and count words
  const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const wordCount = plainText.split(' ').filter(word => word.length > 0).length;
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm text-gray-500 ${className}`}>
      <Clock size={14} className="text-gray-400" />
      <span>{minutes} min read</span>
    </span>
  );
};

/**
 * Calculate reading time from text content
 * Returns number of minutes
 */
export const calculateReadingTime = (content: string, wordsPerMinute = 200): number => {
  const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const wordCount = plainText.split(' ').filter(word => word.length > 0).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

/**
 * Format reading time as string
 */
export const formatReadingTime = (minutes: number): string => {
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
};
