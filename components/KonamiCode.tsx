import { useEffect, useState } from 'react';

/**
 * Konami Code Easter Egg
 * ↑ ↑ ↓ ↓ ← → ← → B A
 * Triggers a fun celebration when the classic code is entered
 */
export const useKonamiCode = (callback: () => void) => {
  const [inputSequence, setInputSequence] = useState<string[]>([]);

  const konamiCode = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const newSequence = [...inputSequence, e.code].slice(-10);
      setInputSequence(newSequence);

      // Check if the sequence matches
      if (newSequence.length === konamiCode.length &&
          newSequence.every((key, i) => key === konamiCode[i])) {
        callback();
        setInputSequence([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputSequence, callback]);
};

/**
 * Konami Code Provider Component
 * Add this once in your app to enable the easter egg
 */
export const KonamiCodeHandler = () => {
  const [triggered, setTriggered] = useState(false);

  useKonamiCode(() => {
    setTriggered(true);

    // Show celebration
    console.log('%c🎮 KONAMI CODE ACTIVATED! 🎮', 'font-size: 20px; color: #F5A623; font-weight: bold;');
    console.log('%c+30 Lives! (Just kidding, but you found our secret!)', 'font-size: 12px; color: #666;');

    // Create confetti effect
    const confettiCount = 150;
    const colors = ['#2B7AB1', '#F5A623', '#ff6b6b', '#6bcb77', '#4d96ff', '#ff6bb5'];

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}vw;
        top: -10px;
        z-index: 99999;
        pointer-events: none;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        transform: rotate(${Math.random() * 360}deg);
        animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
      `;
      document.body.appendChild(confetti);

      // Remove after animation
      setTimeout(() => confetti.remove(), 5000);
    }

    // Reset after a delay
    setTimeout(() => setTriggered(false), 5000);
  });

  // Add confetti animation CSS if not present
  useEffect(() => {
    if (!document.getElementById('konami-styles')) {
      const style = document.createElement('style');
      style.id = 'konami-styles';
      style.textContent = `
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Show achievement popup when triggered
  if (triggered) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-99998 pointer-events-none">
        <div className="bg-neutral text-white px-8 py-6 rounded-2xl shadow-2xl border-4 border-highlight animate-bounce">
          <div className="text-center">
            <div className="text-4xl mb-2">🎮</div>
            <div className="font-heading text-2xl text-highlight">Achievement Unlocked!</div>
            <div className="text-sm text-gray-300 mt-1">You found the Konami Code</div>
            <div className="text-xs text-gray-500 mt-2">↑↑↓↓←→←→BA</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
