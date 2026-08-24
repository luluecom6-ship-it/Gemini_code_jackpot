import React, { useEffect, useState } from 'react';

interface MarqueeLightsProps {
  isSpinning?: boolean;
  isWinning?: boolean;
  children: React.ReactNode;
}

export const MarqueeLights: React.FC<MarqueeLightsProps> = ({
  isSpinning = false,
  isWinning = false,
  children,
}) => {
  const [lightStep, setLightStep] = useState(0);

  // High speed chaser when spinning or winning, steady rhythmic chase in idle
  useEffect(() => {
    const speed = isWinning ? 60 : isSpinning ? 80 : 180;
    const interval = setInterval(() => {
      setLightStep((prev) => (prev + 1) % 24);
    }, speed);
    return () => clearInterval(interval);
  }, [isSpinning, isWinning]);

  // Color palette for classic casino marquee bulbs
  const bulbColors = ['#ffd700', '#ff3366', '#00ffcc', '#ff9900', '#59ff9a', '#ffea00'];

  const getBulbStyle = (index: number) => {
    const offset = (index + lightStep) % 6;
    const isActive = (index + lightStep) % 3 === 0 || isWinning;
    const color = bulbColors[offset % bulbColors.length];

    if (isWinning) {
      return {
        backgroundColor: '#ffd700',
        boxShadow: '0 0 12px 3px #ffd700, 0 0 20px 6px rgba(255,215,0,0.8)',
        transform: 'scale(1.25)',
      };
    }

    if (isActive) {
      return {
        backgroundColor: color,
        boxShadow: `0 0 10px 2px ${color}, 0 0 18px 4px rgba(255,215,0,0.5)`,
        transform: isSpinning ? 'scale(1.15)' : 'scale(1.05)',
      };
    }

    return {
      backgroundColor: '#2a2d3d',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
      opacity: 0.55,
      transform: 'scale(0.9)',
    };
  };

  // Generate bulbs for top, bottom, left, right
  const topBulbCount = 18;
  const sideBulbCount = 12;

  return (
    <div className="relative w-full max-w-4xl mx-auto my-3 p-3 sm:p-5 rounded-3xl bg-gradient-to-b from-[#1c1829] via-[#0d101d] to-[#080911] shadow-[0_20px_90px_rgba(0,0,0,0.85)] border-2 border-amber-500/40">
      {/* Grand Golden Outer Bevel Frame */}
      <div className="absolute inset-0 rounded-3xl pointer-events-none border border-amber-300/30 shadow-[inset_0_0_25px_rgba(255,215,0,0.12)]" />

      {/* TOP ROW RUNNING LIGHTS */}
      <div className="flex justify-between items-center px-4 -mt-1 sm:-mt-2 mb-3">
        {Array.from({ length: topBulbCount }).map((_, idx) => (
          <div
            key={`top-${idx}`}
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-100 ease-out border border-white/20"
            style={getBulbStyle(idx)}
          />
        ))}
      </div>

      {/* SIDES + MAIN CARD CONTENT */}
      <div className="relative flex items-stretch">
        {/* LEFT RUNNING LIGHTS COLUMN */}
        <div className="flex flex-col justify-between py-2 -ml-1 sm:-ml-2 mr-2">
          {Array.from({ length: sideBulbCount }).map((_, idx) => (
            <div
              key={`left-${idx}`}
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-100 ease-out border border-white/20 my-1"
              style={getBulbStyle(idx + 20)}
            />
          ))}
        </div>

        {/* INNER CONTENT CONTAINER */}
        <div className="flex-1 min-w-0 bg-[#0c0f1d]/90 backdrop-blur-md rounded-2xl border border-amber-400/20 overflow-hidden shadow-[inset_0_2px_15px_rgba(0,0,0,0.7)]">
          {children}
        </div>

        {/* RIGHT RUNNING LIGHTS COLUMN */}
        <div className="flex flex-col justify-between py-2 -mr-1 sm:-mr-2 ml-2">
          {Array.from({ length: sideBulbCount }).map((_, idx) => (
            <div
              key={`right-${idx}`}
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-100 ease-out border border-white/20 my-1"
              style={getBulbStyle(idx + 40)}
            />
          ))}
        </div>
      </div>

      {/* BOTTOM ROW RUNNING LIGHTS */}
      <div className="flex justify-between items-center px-4 mt-3 -mb-1 sm:-mb-2">
        {Array.from({ length: topBulbCount }).map((_, idx) => (
          <div
            key={`bot-${idx}`}
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-100 ease-out border border-white/20"
            style={getBulbStyle(idx + 60)}
          />
        ))}
      </div>
    </div>
  );
};
