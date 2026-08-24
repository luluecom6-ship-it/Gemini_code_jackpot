import React, { useEffect, useState, useMemo } from 'react';
import { sound } from '../utils/audio';
import { Calendar, CheckCircle2, XCircle, Sparkles, Filter } from 'lucide-react';

interface CalendarSlotGridProps {
  totalDays: 30 | 7;
  dailyOrders: boolean[];
  isRevealed: boolean;
  isSpinning: boolean;
  onContinueNext?: () => void;
  nextStageSecondsRemaining?: number | null;
}

const RUNNING_SYMBOLS = ['⭐', '🎁', '💎', '👑', '💰', '🌟'];

export const CalendarSlotGrid: React.FC<CalendarSlotGridProps> = ({
  totalDays,
  dailyOrders,
  isRevealed,
  isSpinning,
  onContinueNext,
  nextStageSecondsRemaining,
}) => {
  // Array of current symbol index for each day during running phase
  const [runningSymbols, setRunningSymbols] = useState<string[]>(() =>
    Array(totalDays).fill('⭐').map((_, i) => RUNNING_SYMBOLS[i % RUNNING_SYMBOLS.length])
  );

  // Progressive reveal step (staggered cascade from 0 to totalDays)
  const [revealIndex, setRevealIndex] = useState<number>(0);

  // Active scanning highlight sweep
  const [activeScanDay, setActiveScanDay] = useState<number>(0);

  // Filter mode when revealed: 'all' | 'ordered' | 'missed'
  const [filterMode, setFilterMode] = useState<'all' | 'ordered' | 'missed'>('all');

  // Calculate actual calendar dates going back `totalDays` days from today
  const calendarDates = useMemo(() => {
    const dates: { dayLabel: string; dateLabel: string; fullDate: string; dayNum: number; monthName: string; weekday: string }[] = [];
    const now = new Date();
    
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
      const monthFull = d.toLocaleDateString('en-US', { month: 'long' });
      const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' });

      dates.push({
        dayNum,
        monthName: monthShort,
        weekday: weekdayShort,
        dayLabel: `${dayNum} ${monthShort}`,
        dateLabel: `${dayNum} ${monthShort}`,
        fullDate: `${weekdayShort}, ${dayNum} ${monthFull}`,
      });
    }
    return dates;
  }, [totalDays]);

  // Cycle running symbols when spinning
  useEffect(() => {
    if (!isSpinning && isRevealed) return;

    const interval = setInterval(() => {
      setRunningSymbols((prev) =>
        prev.map(() => RUNNING_SYMBOLS[Math.floor(Math.random() * RUNNING_SYMBOLS.length)])
      );
      setActiveScanDay(Math.floor(Math.random() * totalDays));
      sound.playTick();
    }, 90);

    return () => clearInterval(interval);
  }, [isSpinning, isRevealed, totalDays]);

  // Handle sequential cascade reveal when isRevealed becomes true with optimal reading speed
  useEffect(() => {
    if (!isRevealed) {
      setRevealIndex(0);
      return;
    }

    setRevealIndex(0);
    // Pacing: 85ms for 30 days (~2.5s cascade), 160ms for 7 days (~1.1s cascade)
    const delay = totalDays === 30 ? 85 : 160;
    const interval = setInterval(() => {
      setRevealIndex((prev) => {
        if (prev >= totalDays) {
          clearInterval(interval);
          return totalDays;
        }
        const hasOrder = dailyOrders[prev] ?? false;
        sound.playStarPop(hasOrder);
        return prev + 1;
      });
    }, delay);

    return () => clearInterval(interval);
  }, [isRevealed, totalDays, dailyOrders]);

  const placedCount = dailyOrders.slice(0, totalDays).filter(Boolean).length;
  const missedCount = totalDays - placedCount;
  const isAllOrdered = placedCount === totalDays;
  const isWeekly = totalDays === 7;

  // List of ordered dates for quick reading
  const orderedDatesList = useMemo(() => {
    return calendarDates
      .map((d, idx) => ({ ...d, isOrdered: Boolean(dailyOrders[idx]), dayIndex: idx }))
      .filter((d) => d.isOrdered);
  }, [calendarDates, dailyOrders]);

  const isCascadeFinished = isRevealed && revealIndex >= totalDays;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Tally & Live Status Bar */}
      <div className="w-full flex flex-wrap justify-between items-center px-3 py-2 mb-2 rounded-xl bg-black/60 border border-white/15 text-xs sm:text-sm shadow-md">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="font-black text-amber-300 tracking-tight">
            {isRevealed
              ? isAllOrdered
                ? `🏆 ALL ${totalDays} DATES QUALIFIED (100% ORDERS)!`
                : `RESULT: ${placedCount} OF ${totalDays} DATES ORDERED`
              : `🎰 SCANNING ${totalDays}-DAY CALENDAR TIMELINE...`}
          </span>
        </div>

        <div className="flex items-center gap-3 font-bold text-xs">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span className="text-sm">⭐</span>
            <span>{isRevealed ? `${placedCount} Ordered` : 'Green Star (Ordered)'}</span>
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <span className="text-sm">😔</span>
            <span>{isRevealed ? `${missedCount} Missed` : 'Sad Face (No Order)'}</span>
          </span>
        </div>
      </div>

      {/* Grid Container */}
      <div
        className={`w-full grid gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-2xl bg-gradient-to-b from-[#131728] to-[#0a0c16] border-2 border-amber-500/30 shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)] ${
          isWeekly ? 'grid-cols-7' : 'grid-cols-5 sm:grid-cols-6 md:grid-cols-10'
        }`}
      >
        {Array.from({ length: totalDays }).map((_, index) => {
          const dateObj = calendarDates[index] || {
            dateLabel: `Day ${index + 1}`,
            weekday: 'Day',
            dayNum: index + 1,
            monthName: '',
          };
          const hasRevealedThis = isRevealed && index < revealIndex;
          const isCurrentlyScanning = !isRevealed && activeScanDay === index;
          const isOrdered = dailyOrders[index] ?? false;

          // Filter condition
          const isHiddenByFilter =
            isCascadeFinished &&
            ((filterMode === 'ordered' && !isOrdered) ||
              (filterMode === 'missed' && isOrdered));

          let displaySymbol = runningSymbols[index] || '⭐';
          let cellStyle = 'bg-[#181d30] border-white/10 text-gray-400';
          let glowStyle = '';
          let subLabel = dateObj.dateLabel;

          if (hasRevealedThis) {
            if (isOrdered) {
              // High contrast glowing emerald green box with star
              displaySymbol = '⭐';
              cellStyle =
                'bg-gradient-to-b from-emerald-900/90 via-emerald-800/80 to-emerald-950/90 border-2 border-emerald-400 text-emerald-200';
              glowStyle =
                'shadow-[0_0_18px_rgba(16,185,129,0.7)] ring-2 ring-emerald-300/80 scale-[1.03] z-10';
              subLabel = 'ORDERED';
            } else {
              displaySymbol = '😔';
              cellStyle =
                'bg-gradient-to-b from-rose-950/40 via-black/70 to-black/80 border border-rose-800/50 text-rose-400/80 opacity-60';
              glowStyle = 'shadow-[inset_0_0_8px_rgba(255,0,50,0.2)]';
              subLabel = 'NO ORDER';
            }
          } else if (isCurrentlyScanning) {
            cellStyle = 'bg-amber-500/30 border-2 border-amber-400 text-amber-200';
            glowStyle = 'shadow-[0_0_20px_rgba(255,215,0,0.6)] scale-105 z-10';
          }

          if (isHiddenByFilter) {
            cellStyle += ' opacity-20 filter grayscale';
          }

          return (
            <div
              key={`day-${index}`}
              className={`relative flex flex-col items-center justify-between py-1.5 px-1 rounded-xl border transition-all duration-300 ${
                isWeekly ? 'h-24 sm:h-28' : 'h-16 sm:h-18 md:h-20'
              } ${cellStyle} ${glowStyle} overflow-hidden select-none`}
            >
              {/* Actual Calendar Date Header */}
              <div className="w-full flex items-center justify-between px-0.5 pointer-events-none">
                <span className="text-[9px] sm:text-[10px] font-black tracking-tight text-white drop-shadow truncate">
                  {dateObj.dayNum} {dateObj.monthName}
                </span>
                {hasRevealedThis && isOrdered && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-400 text-black leading-none shadow-sm">
                    ✓
                  </span>
                )}
              </div>

              {/* Main Symbol: Green Glowing Star when ordered, Sad face when missed */}
              <div
                className={`text-lg sm:text-xl md:text-2xl font-black transition-transform duration-150 ${
                  !hasRevealedThis && isSpinning ? 'animate-bounce' : ''
                } ${
                  hasRevealedThis && isOrdered
                    ? 'animate-pulse scale-125 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.9)]'
                    : ''
                }`}
              >
                {displaySymbol}
              </div>

              {/* Bottom Status Subtitle / Date */}
              <div
                className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tight text-center truncate w-full px-0.5 ${
                  hasRevealedThis
                    ? isOrdered
                      ? 'text-emerald-300 font-black drop-shadow'
                      : 'text-rose-400'
                    : 'text-white/50'
                }`}
              >
                {hasRevealedThis ? (isOrdered ? 'ORDERED' : 'NO ORDER') : dateObj.weekday}
              </div>

              {/* Laser Scan Sweep Light Effect */}
              {isCurrentlyScanning && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent pointer-events-none animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* READABLE ORDERED DATES SUMMARY BREAKDOWN (Shows clearly which days were ordered) */}
      {isCascadeFinished && (
        <div className="w-full mt-2.5 p-3 rounded-2xl bg-black/70 border border-emerald-500/40 shadow-lg animate-fadeIn space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-sm">
                ⭐
              </span>
              <div>
                <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <span>Customer Ordered on {placedCount} of {totalDays} Dates</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase">
                    {Math.round((placedCount / totalDays) * 100)}% Coverage
                  </span>
                </div>
                <div className="text-[11px] text-gray-300">
                  {isAllOrdered
                    ? '🎉 100% Complete Month Qualified!'
                    : `Dates with green stars (⭐) indicate placed orders. ${missedCount} dates missed.`}
                </div>
              </div>
            </div>

            {/* Quick Filter Pill Buttons */}
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-amber-400 text-black font-black'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                All ({totalDays})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('ordered')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'ordered'
                    ? 'bg-emerald-500 text-black font-black'
                    : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-500/30'
                }`}
              >
                ⭐ Ordered ({placedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('missed')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'missed'
                    ? 'bg-rose-500 text-white font-black'
                    : 'bg-rose-950/60 text-rose-300 hover:bg-rose-900/60 border border-rose-500/30'
                }`}
              >
                😔 Missed ({missedCount})
              </button>
            </div>
          </div>

          {/* Scannable list of ordered dates */}
          {orderedDatesList.length > 0 ? (
            <div className="pt-1">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Exact Dates Customer Placed Orders:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {orderedDatesList.map((d) => (
                  <span
                    key={`ordered-date-${d.dayIndex}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-400/60 text-emerald-200 text-xs font-bold shadow-sm"
                  >
                    <span className="text-emerald-400">⭐</span>
                    <span className="font-mono text-white">{d.dayNum} {d.monthName}</span>
                    <span className="text-[10px] text-emerald-400/90 font-medium">({d.weekday})</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-rose-300 py-1 font-semibold">
              No orders were recorded during this {totalDays}-day period.
            </div>
          )}

          {/* Reading Pause Countdown / Continue Action */}
          {nextStageSecondsRemaining !== undefined && nextStageSecondsRemaining !== null && nextStageSecondsRemaining > 0 && (
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Reviewing dates... Moving to next stage in {nextStageSecondsRemaining}s
              </span>
              {onContinueNext && (
                <button
                  type="button"
                  onClick={onContinueNext}
                  className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider transition-all shadow cursor-pointer"
                >
                  Continue to Next Stage ⏭️
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
