import React, { useEffect, useState } from 'react';
import { sound } from '../utils/audio';

interface SlotReelsProps {
  isSpinning: boolean;
  isRevealed: boolean;
  isJackpotWin: boolean;
}

const REEL_SYMBOLS = ['7', '👑', '💎', '⭐', '💰', '7', '🔔', '🍒'];

export const SlotReels: React.FC<SlotReelsProps> = ({
  isSpinning,
  isRevealed,
  isJackpotWin,
}) => {
  const [reel1, setReel1] = useState('7');
  const [reel2, setReel2] = useState('7');
  const [reel3, setReel3] = useState('7');

  useEffect(() => {
    if (!isSpinning && isRevealed) {
      if (isJackpotWin) {
        setReel1('7');
        setReel2('7');
        setReel3('7');
      } else {
        setReel1('7');
        setReel2('👑');
        setReel3('🍒');
      }
      return;
    }

    const interval = setInterval(() => {
      setReel1(REEL_SYMBOLS[Math.floor(Math.random() * REEL_SYMBOLS.length)]);
      setReel2(REEL_SYMBOLS[Math.floor(Math.random() * REEL_SYMBOLS.length)]);
      setReel3(REEL_SYMBOLS[Math.floor(Math.random() * REEL_SYMBOLS.length)]);
      sound.playSlotBeep();
    }, 90);

    return () => clearInterval(interval);
  }, [isSpinning, isRevealed, isJackpotWin]);

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {/* Jackpots Reels Housing */}
      <div className="flex gap-3 sm:gap-6 p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-[#181c2e] via-[#0b0e1b] to-[#05070e] border-2 border-amber-400/50 shadow-[0_15px_50px_rgba(0,0,0,0.8),inset_0_0_30px_rgba(255,215,0,0.15)]">
        {[reel1, reel2, reel3].map((sym, idx) => (
          <div
            key={`reel-${idx}`}
            className={`w-20 h-28 sm:w-28 sm:h-38 rounded-2xl bg-gradient-to-b from-[#2d354b] via-[#101422] to-[#1c2235] border-2 ${
              isRevealed && isJackpotWin
                ? 'border-amber-300 shadow-[0_0_30px_rgba(255,215,0,0.8)] animate-pulse'
                : 'border-amber-400/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]'
            } flex items-center justify-center text-4xl sm:text-6xl font-black text-amber-300 select-none overflow-hidden relative ${
              isSpinning ? 'animate-bounce' : ''
            }`}
          >
            {/* Reel Glass Reflection */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/40 pointer-events-none" />
            <span className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
              {sym}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs sm:text-sm font-bold text-amber-200/90 tracking-wide uppercase">
        {isSpinning
          ? '🎰 Spinning for Highest Spender in BigQuery...'
          : isRevealed
          ? isJackpotWin
            ? '🎉 7-7-7 HIGHEST ORDER JACKPOT CHAMPION!'
            : 'Highest Spender Jackpot belongs to another customer'
          : 'Ready to Spin'}
      </div>
    </div>
  );
};
