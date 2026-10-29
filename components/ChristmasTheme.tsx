import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { PartyPopper, Snowflake } from 'lucide-react';

// --- Context for Global State ---
interface FestiveContextType {
  isSnowing: boolean;
  toggleSnow: () => void;
  triggerFireworks: () => void;
  isFireworksActive: boolean;
}

const FestiveContext = createContext<FestiveContextType | undefined>(undefined);

// --- Date Helpers ---
const isNewYearPeriod = (): boolean => {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed: 0=Jan, 11=Dec
  const day = now.getDate();

  // Jan 1 through Jan 14 only (two weeks)
  return month === 0 && day >= 1 && day <= 14;
};

const isFestivePeriod = (): boolean => {
  const now = new Date();
  const month = now.getMonth();

  // December only (snow + festive UI)
  return month === 11;
};

// Show festive controls during December or first two weeks of January
const isFestiveSeason = (): boolean => {
  return isFestivePeriod() || isNewYearPeriod();
};

export const useFestive = () => {
  const context = useContext(FestiveContext);
  if (!context) throw new Error('useFestive must be used within a FestiveProvider');
  return context;
};

// --- Snow Effect Component (Canvas) ---
const Snowfall = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: { x: number; y: number; r: number; d: number; tilt: number; tiltAngle: number; tiltAngleIncremental: number }[] = [];
    const maxParticles = 50;

    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 4 + 1,
        d: Math.random() * maxParticles,
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngle: 0,
        tiltAngleIncremental: (Math.random() * 0.07) + 0.05
      });
    }

    let animationFrameId: number;
    let angle = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();

      for (let i = 0; i < maxParticles; i++) {
        const p = particles[i];
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
      }

      ctx.fill();
      update();
      animationFrameId = requestAnimationFrame(draw);
    };

    const update = () => {
      angle += 0.01;
      for (let i = 0; i < maxParticles; i++) {
        const p = particles[i];
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(angle + p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(angle);

        if (p.x > width + 5 || p.x < -5 || p.y > height) {
          if (i % 3 > 0) {
            particles[i] = { ...p, x: Math.random() * width, y: -10, tilt: Math.floor(Math.random() * 10) - 20 };
          } else {
            if (Math.sin(angle) > 0) {
              particles[i] = { ...p, x: -5, y: Math.random() * height, tilt: Math.floor(Math.random() * 10) - 20 };
            } else {
              particles[i] = { ...p, x: width + 5, y: Math.random() * height, tilt: Math.floor(Math.random() * 10) - 20 };
            }
          }
        }
      }
    };

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-9999" />;
};

// --- Fireworks Burst Component (Brief celebration, then stops) ---
const FireworksBurst: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
      size: number;
      decay: number;
      gravity: number;
    }

    const particles: Particle[] = [];
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bb5', '#c44dff', '#ffffff'];
    let rocketsLaunched = 0;
    const maxRockets = 5; // Only launch 5 fireworks

    const createExplosion = (x: number, y: number, color: string) => {
      const particleCount = 50;
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 / particleCount) * i;
        const velocity = 2 + Math.random() * 4;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          alpha: 1,
          color,
          size: 2 + Math.random() * 2,
          decay: 0.02 + Math.random() * 0.015,
          gravity: 0.06
        });
      }
    };

    // Launch all fireworks at staggered intervals
    const launchPositions = [0.2, 0.4, 0.5, 0.6, 0.8];
    launchPositions.forEach((pos, index) => {
      setTimeout(() => {
        const x = width * pos;
        const y = height * (0.25 + Math.random() * 0.25);
        createExplosion(x, y, colors[Math.floor(Math.random() * colors.length)]);
        rocketsLaunched++;
      }, index * 300);
    });

    let animationFrameId: number;
    const startTime = Date.now();

    const draw = () => {
      // Clear with transparency (no black background)
      ctx.clearRect(0, 0, width, height);

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Handle hex colors for alpha
        const r = parseInt(p.color.slice(1, 3), 16);
        const g = parseInt(p.color.slice(3, 5), 16);
        const b = parseInt(p.color.slice(5, 7), 16);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
        ctx.fill();

        // Glow effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      ctx.shadowBlur = 0;

      // End after all particles fade (max 4 seconds)
      const elapsed = Date.now() - startTime;
      if (particles.length === 0 && rocketsLaunched >= maxRockets || elapsed > 4000) {
        cancelAnimationFrame(animationFrameId);
        onComplete();
        return;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-9999" />;
};

// --- Main Provider Component ---
export const FestiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSnowing, setIsSnowing] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [hasAutoTriggeredNewYear, setHasAutoTriggeredNewYear] = useState(false);

  // Check stored preference on mount (default OFF, only during festive period)
  useEffect(() => {
    if (!isFestivePeriod()) return; // Snow only in December
    const stored = localStorage.getItem('fresh-tech-snow-mode');
    if (stored === 'true') {
      // Respect reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        setIsSnowing(true);
      }
    }
  }, []);

  // Auto-trigger New Year celebration once per session (Jan 1 - Jan 14)
  useEffect(() => {
    if (isNewYearPeriod() && !hasAutoTriggeredNewYear) {
      const alreadyShown = sessionStorage.getItem('fresh-tech-new-year-shown');
      if (!alreadyShown) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          // Small delay for page to load
          setTimeout(() => {
            setShowFireworks(true);
            setHasAutoTriggeredNewYear(true);
            sessionStorage.setItem('fresh-tech-new-year-shown', 'true');
          }, 1000);
        }
      }
    }
  }, [hasAutoTriggeredNewYear]);

  const toggleSnow = () => {
    const newState = !isSnowing;
    setIsSnowing(newState);
    localStorage.setItem('fresh-tech-snow-mode', String(newState));
  };

  const triggerFireworks = useCallback(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    setShowFireworks(true);
  }, []);

  const handleFireworksComplete = useCallback(() => {
    setShowFireworks(false);
  }, []);

  // Hide snow when fireworks are active
  const showSnow = isSnowing && !showFireworks;

  return (
    <FestiveContext.Provider value={{ isSnowing, toggleSnow, triggerFireworks, isFireworksActive: showFireworks }}>
      {showSnow && <Snowfall />}
      {showFireworks && <FireworksBurst onComplete={handleFireworksComplete} />}
      {children}
    </FestiveContext.Provider>
  );
};

// --- Snow Toggle Button ---
export const SnowToggle = ({ className }: { className?: string }) => {
  const { isSnowing, toggleSnow } = useFestive();

  return (
    <button
      onClick={toggleSnow}
      className={`
        flex items-center justify-center gap-2 px-3 h-8 rounded-full text-xs font-bold transition-all duration-300 border
        ${isSnowing
          ? 'bg-blue-500 text-white border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
          : 'bg-white/10 text-gray-500 md:text-gray-400 border-gray-400 hover:text-white hover:border-white hover:bg-white/20'}
        ${className}
      `}
      title={isSnowing ? "Turn off Snow" : "Let it snow!"}
    >
      <Snowflake size={14} className={`shrink-0 ${isSnowing ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
      <span className="hidden sm:inline">Snow</span>
    </button>
  );
};

// --- Party Mode Button (triggers brief fireworks) ---
export const PartyToggle = ({ className }: { className?: string }) => {
  const { triggerFireworks } = useFestive();
  const [justClicked, setJustClicked] = useState(false);

  const handleClick = () => {
    if (justClicked) return; // Prevent spam clicking
    setJustClicked(true);
    triggerFireworks();
    setTimeout(() => setJustClicked(false), 4000); // Reset after fireworks complete
  };

  return (
    <button
      onClick={handleClick}
      disabled={justClicked}
      className={`
        flex items-center justify-center gap-2 px-3 h-8 rounded-full text-xs font-bold transition-all duration-300 border
        ${justClicked
          ? 'bg-linear-to-r from-purple-600 to-pink-500 text-white border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
          : 'bg-white/10 text-gray-700 md:text-gray-600 border-gray-500 hover:text-white hover:border-white hover:bg-white/20'}
        ${justClicked ? 'cursor-not-allowed' : ''}
        ${className}
      `}
      title="Celebrate!"
    >
      <PartyPopper size={14} className={`shrink-0 ${justClicked ? 'animate-bounce' : ''}`} />
      <span className="hidden sm:inline">{justClicked ? '🎆' : '2026!'}</span>
    </button>
  );
};

// --- New Year Banner with Celebrate Button ---
export const NewYearBanner = ({ className, isMobile = false }: { className?: string; isMobile?: boolean }) => {
  const { triggerFireworks, isSnowing, toggleSnow, isFireworksActive } = useFestive();
  const [justClicked, setJustClicked] = useState(false);

  const handleCelebrate = () => {
    if (justClicked || isFireworksActive) return;
    setJustClicked(true);
    triggerFireworks();
    setTimeout(() => setJustClicked(false), 4000);
  };

  const isActive = justClicked || isFireworksActive;

  // Mobile: render buttons without wrapper gap issues
  if (isMobile) {
    return (
      <>
        {/* New Year button */}
        <button
          onClick={handleCelebrate}
          disabled={isActive}
          className={`
            flex items-center gap-1 px-2 h-8 rounded-full text-xs font-bold transition-all duration-300 border
            ${isActive
              ? 'bg-linear-to-r from-purple-600 to-pink-500 text-white border-purple-400'
              : 'bg-amber-100 text-amber-900 border-amber-500 hover:border-amber-600'}
            ${isActive ? 'cursor-not-allowed' : ''}
          `}
          title="Celebrate New Year!"
        >
          <span>🎆</span>
          <span className="font-black">2026!</span>
        </button>

        {/* Snow toggle */}
        <button
          onClick={toggleSnow}
          className={`
            flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 border
            ${isSnowing
              ? 'bg-blue-500 text-white border-blue-400'
              : 'bg-blue-500/20 text-blue-700 border-blue-400/50 hover:border-blue-500'}
          `}
          title={isSnowing ? "Turn off Snow" : "Let it snow!"}
        >
          <Snowflake size={14} className={`${isSnowing ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
        </button>
      </>
    );
  }

  // Desktop: original layout with wrapper
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      {/* Happy New Year message with celebrate button */}
      <button
        onClick={handleCelebrate}
        disabled={isActive}
        className={`
          flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-bold transition-all duration-300 border
          ${isActive
            ? 'bg-linear-to-r from-purple-600 to-pink-500 text-white border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
            : 'bg-linear-to-r from-amber-500/20 to-orange-500/20 text-amber-200 border-amber-400/50 hover:border-amber-300 hover:from-amber-500/30 hover:to-orange-500/30'}
          ${isActive ? 'cursor-not-allowed' : ''}
        `}
        title="Celebrate New Year!"
      >
        <span className="text-amber-300">🎆</span>
        <span className="hidden sm:inline">Happy New Year</span>
        <span className="font-black text-amber-300">2026!</span>
        <PartyPopper size={12} className={`shrink-0 ml-0.5 ${isActive ? 'animate-bounce' : ''}`} />
      </button>

      {/* Snow toggle - smaller, secondary */}
      <button
        onClick={toggleSnow}
        className={`
          flex items-center justify-center w-8 h-8 rounded-full text-xs transition-all duration-300 border
          ${isSnowing
            ? 'bg-blue-500 text-white border-white shadow-[0_0_8px_rgba(255,255,255,0.4)]'
            : 'bg-white/10 text-gray-400 border-gray-500 hover:text-white hover:border-white hover:bg-white/20'}
        `}
        title={isSnowing ? "Turn off Snow" : "Let it snow!"}
      >
        <Snowflake size={14} className={`${isSnowing ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
      </button>
    </div>
  );
};

// --- Combined Toggle for utility bar ---
// Only renders during festive season (December + first two weeks of January)
export const FestiveToggle = ({ className, isMobile = false }: { className?: string; isMobile?: boolean }) => {
  if (!isFestiveSeason()) return null;
  return <NewYearBanner className={className} isMobile={isMobile} />;
};
