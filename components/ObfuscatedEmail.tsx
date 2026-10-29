import React, { useState } from 'react';

interface ObfuscatedEmailProps {
  className?: string;
  label?: string;
}

export const ObfuscatedEmail: React.FC<ObfuscatedEmailProps> = ({ className, label }) => {
  const [revealed, setRevealed] = useState(false);

  // Using simple parts to avoid simple string scraping
  const u = "hello";
  const d = "fresh-tech.uk";
  const fullEmail = `${u}@${d}`;

  const handleClick = () => {
    window.location.href = `mailto:${fullEmail}`;
  };

  const handleReveal = () => setRevealed(true);
  const handleHide = () => setRevealed(false);

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={handleReveal}
      onMouseLeave={handleHide}
      onFocus={handleReveal}
      onBlur={handleHide}
      className={className}
      aria-label={revealed ? `Email us at ${fullEmail}` : "Click to reveal email and send"}
    >
      {label || (revealed ? fullEmail : "Click to Reveal Email")}
    </button>
  );
};
