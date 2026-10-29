import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * Injects Cloudinary transformations for auto-format, auto-quality, and resizing.
 * @param url The original image URL
 * @param width Target width in pixels
 * @param quality Cloudinary quality setting (good, eco, best, low) or numeric string (25, 50)
 */
export const optimizeCloudinaryUrl = (url?: string, width?: number, quality: string = 'good') => {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url;
  if (!url.includes('/upload/')) return url;

  // Determine quality parameter
  // If it's one of the named presets, use q_auto:{preset}
  // If it's a number string (e.g., "25"), use q_{number}
  const isAuto = ['good', 'eco', 'best', 'low'].includes(quality);
  const qParam = isAuto ? `q_auto:${quality}` : `q_${quality}`;

  // Construct parameters: f_auto (format), quality
  const params = [`f_auto`, qParam];
  
  // Add width resize if provided
  if (width) {
    params.unshift(`w_${width}`);
  }

  const paramStr = params.join(',');

  // Prevent double injection if string already matches
  if (url.includes(`/${paramStr}/`)) return url;

  // Replace /upload/ with /upload/{params}/
  return url.replace('/upload/', `/upload/${paramStr}/`);
};

/**
 * Generates a standard srcset for responsive images using Cloudinary resizing.
 */
export const generateCloudinarySrcSet = (url?: string, baseWidth?: number, quality: string = 'good') => {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return undefined;
  
  // OPTIMIZATION: If a specific small base width is provided (e.g. for logos), 
  // generate only 1x and 2x density descriptors.
  if (baseWidth && baseWidth < 400) {
      const w1 = optimizeCloudinaryUrl(url, baseWidth, quality);
      const w2 = optimizeCloudinaryUrl(url, baseWidth * 2, quality);
      return `${w1} 1x, ${w2} 2x`;
  }

  // STANDARD RESPONSIVE BREAKPOINTS
  // Added intermediate steps (700, 800, 900) to prevent large jumps in file size (e.g. 640 -> 768)
  const widths = [400, 500, 600, 640, 700, 768, 800, 900, 1024, 1280, 1536, 1920, 2560];
  
  return widths.map(w => {
    const src = optimizeCloudinaryUrl(url, w, quality);
    return `${src} ${w}w`;
  }).join(', ');
};

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackText?: string;
  width?: number | string; // Used for both layout attribute and Cloudinary optimization
  height?: number | string; // Explicit height for CLS prevention
  fetchPriority?: "high" | "low" | "auto"; // For LCP optimization
  quality?: "good" | "eco" | "best" | "low" | string; // Control compression aggressiveness
}

export const SmartImage: React.FC<SmartImageProps> = ({ 
  src, 
  alt, 
  className = "", 
  fallbackSrc = "https://placehold.co/600x400/2B7AB1/FFFFFF?text=Image+Missing",
  fallbackText,
  style,
  width,
  height,
  fetchPriority,
  loading,
  quality = "good",
  ...props 
}) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Parse width for optimization logic
  const numericWidth = typeof width === 'number' ? width : typeof width === 'string' ? parseInt(width, 10) : undefined;
  
  // Explicitly check if src is a string before optimizing
  const finalSrc = typeof src === 'string' ? optimizeCloudinaryUrl(src, numericWidth, quality) : src;
  
  // Generate srcset if not provided manually
  const autoSrcSet = props.srcSet || (typeof src === 'string' ? generateCloudinarySrcSet(src, numericWidth, quality) : undefined);

  // Determine correct sizes attribute
  const srcSetHasWidths = autoSrcSet && autoSrcSet.includes('w');
  
  // Default sizes
  const defaultSizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw";
  const finalSizes = props.sizes || (srcSetHasWidths ? defaultSizes : undefined);

  // Optimization: If it's high priority (LCP), skip the fade-in animation and eager load
  const isLcp = fetchPriority === "high";

  // Default to lazy loading for non-LCP images (improves PageSpeed INP)
  const finalLoading = loading || (isLcp ? "eager" : "lazy");

  // If there's an error and we have a fallback, show fallback
  if (error) {
    // If fallbackText is provided, show a placeholder with text
    if (fallbackText) {
      return (
        <div
          className={`${className} flex items-center justify-center bg-gray-100 text-gray-500`}
          style={{ ...style, width, height }}
          role="img"
          aria-label={alt || fallbackText}
        >
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <ImageOff size={24} />
            <span className="text-sm">{fallbackText}</span>
          </div>
        </div>
      );
    }

    // Otherwise try the fallback image
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        {...props}
      />
    );
  }

  // Use sync decoding for LCP images (don't delay render) and async for the rest
  const finalDecoding = isLcp ? "sync" : "async";

  return (
    <img
      src={finalSrc}
      srcSet={autoSrcSet}
      sizes={finalSizes}
      alt={alt}
      width={width}
      height={height}
      // fetchPriority is supported by React 18+ but TS types may lag
      {...(fetchPriority && { fetchPriority })}
      loading={finalLoading}
      decoding={finalDecoding}
      className={`${className} ${!isLcp ? 'transition-all duration-700 ease-in-out' : ''} ${!isLcp && !loaded ? 'blur-xs opacity-0' : 'blur-0 opacity-100'}`}
      style={{
        ...style,
        opacity: isLcp ? 1 : (loaded ? (style?.opacity ?? 1) : 0),
      }}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      {...props}
    />
  );
};