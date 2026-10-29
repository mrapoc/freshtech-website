import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Keyboard } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
}

/**
 * Keyboard Shortcuts Handler
 * Provides keyboard navigation for power users
 * Press "?" to see available shortcuts
 */
export const KeyboardShortcuts = () => {
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();

  const shortcuts: Shortcut[] = [
    { key: 'g h', description: 'Go to Home', action: () => navigate('/') },
    { key: 'g a', description: 'Go to About', action: () => navigate('/about') },
    { key: 'g s', description: 'Go to Services', action: () => navigate('/services') },
    { key: 'g p', description: 'Go to Pricing', action: () => navigate('/pricing') },
    { key: 'g c', description: 'Go to Contact', action: () => navigate('/contact') },
    { key: 'g b', description: 'Go to Blog', action: () => navigate('/blog') },
    { key: '/', description: 'Focus search (coming soon)', action: () => {} },
    { key: '?', description: 'Show this help', action: () => setShowHelp(true) },
    { key: 'Esc', description: 'Close dialogs', action: () => setShowHelp(false) },
  ];

  useEffect(() => {
    let keyBuffer = '';
    let keyTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Handle Escape
      if (e.key === 'Escape') {
        setShowHelp(false);
        return;
      }

      // Handle "?" for help
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      // Build key buffer for multi-key shortcuts (like "g h")
      clearTimeout(keyTimeout);
      keyBuffer += e.key.toLowerCase() + ' ';

      // Check for matching shortcut
      const matchedShortcut = shortcuts.find(s =>
        keyBuffer.trim() === s.key.toLowerCase() ||
        keyBuffer.trim().endsWith(s.key.toLowerCase())
      );

      if (matchedShortcut && matchedShortcut.key !== '?') {
        e.preventDefault();
        matchedShortcut.action();
        keyBuffer = '';
      }

      // Reset buffer after 1 second
      keyTimeout = setTimeout(() => {
        keyBuffer = '';
      }, 1000);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(keyTimeout);
    };
  }, [navigate]);

  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-9999 flex items-center justify-center p-4"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setShowHelp(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Keyboard size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-neutral">Keyboard Shortcuts</h2>
            <p className="text-sm text-gray-500">Navigate faster with your keyboard</p>
          </div>
        </div>

        <div className="space-y-2">
          {shortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
            >
              <span className="text-gray-700">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded-sm text-xs font-mono text-gray-600">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-sm text-gray-600">?</kbd> anywhere to toggle this help
          </p>
        </div>
      </div>
    </div>
  );
};
