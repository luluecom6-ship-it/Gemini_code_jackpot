import React, { useState, useMemo } from 'react';
import { CustomerJackpotData } from '../types';
import {
  Award,
  Calendar,
  Gift,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatSAR } from '../utils/customerService';

interface FinalOverviewCardsProps {
  data: CustomerJackpotData;
  onCheckAnother: () => void;
}

export const FinalOverviewCards: React.FC<FinalOverviewCardsProps> = ({ data, onCheckAnother }) => {
  // Determine if any reward was won
  const hasWonAny = data.highestOrder || data.monthly || data.weekly || data.any;

  // Toggle calendar dates detail view (default to open if customer has orders)
  const [showCalendarDetail, setShowCalendarDetail] = useState(true);

  // Filter mode in calendar detail: 'all' | 'ordered' | 'missed'
  const [filterMode, setFilterMode] = useState<'all' | 'ordered' | 'missed'>('all');

  // Find the primary winning reward title
  const winningRewardTitle = data.highestOrder
    ? '🏆 #1 HIGHEST SPENDER JACKPOT'
    : data.monthly
    ? '🎁 30-DAY MEGA HAMPER'
    : data.weekly
    ? '⭐ WEEKLY SUPER HAMPER'
    : data.any
    ? '🎉 EXCLUSIVE SURPRISE LOYALTY GIFT'
    : null;

  // Calculate actual calendar dates going back 30 days
  const calendarDates30 = useMemo(() => {
    const dates: { dayNum: number; monthName: string; weekday: string; dateLabel: string; fullDate: string }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
      const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' });

      dates.push({
        dayNum,
        monthName: monthShort,
        weekday: weekdayShort,
        dateLabel: `${dayNum} ${monthShort}`,
        fullDate: `${weekdayShort}, ${dayNum} ${monthShort}`,
      });
    }
    return dates;
  }, []);

  const dailyOrders30 = data.dailyOrders30 || Array(30).fill(false);
  const orderedDatesList = useMemo(() => {
    return calendarDates30
      .map((d, idx) => ({ ...d, isOrdered: Boolean(dailyOrders30[idx]), dayIndex: idx }))
      .filter((d) => d.isOrdered);
  }, [calendarDates30, dailyOrders30]);

  const placedCount = orderedDatesList.length;
  const missedCount = 30 - placedCount;

  return (
    <div className="w-full mt-2 flex flex-col items-center animate-fadeIn">
      {/* QUALIFICATION / WINNING ANNOUNCEMENT BANNER */}
      <div
        className={`w-full p-3 sm:p-4 rounded-2xl border text-center transition-all ${
          hasWonAny
            ? 'bg-gradient-to-r from-emerald-950/80 via-emerald-900/70 to-emerald-950/80 border-emerald-400/90 shadow-[0_0_35px_rgba(16,185,129,0.4)]'
            : 'bg-black/60 border-white/15 text-gray-300'
        }`}
      >
        {hasWonAny ? (
          <div className="flex flex-col items-center">
            {/* Pulsing Green Star / Gift Icon */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/80 text-emerald-300 text-xs font-black tracking-widest uppercase mb-1.5 animate-pulse">
              <span className="text-sm">⭐</span>
              CUSTOMER QUALIFIED FOR REWARD!
              <span className="text-sm">⭐</span>
            </div>

            <div className="text-3xl sm:text-4xl my-1 animate-bounce">
              🎁
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-amber-200 to-emerald-400 uppercase tracking-tight">
              COLLECT YOUR GIFT!
            </h3>

            <p className="text-xs sm:text-sm text-emerald-200 mt-1 max-w-lg font-medium">
              Congratulations! {data.customerName || 'Customer'} has qualified for:{' '}
              <strong className="text-amber-300 font-black">{winningRewardTitle}</strong>
            </p>

            <div className="mt-2.5 px-4 py-1.5 rounded-xl bg-emerald-500 text-black font-black text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(16,185,129,0.5)] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-black" />
              <span>GIFT READY FOR COLLECTION AT CASHIER / DESK</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-1">
            <div className="text-3xl mb-1">🛒</div>
            <h3 className="text-lg font-black text-white uppercase">
              NO REWARD QUALIFIED THIS TIME
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 max-w-md">
              Order with LuLu Online today to qualify for our daily, weekly, and 30-day jackpot rewards!
            </p>
          </div>
        )}
      </div>

      {/* ZOOMED-OUT 4-BLOCK COMPARISON GRID */}
      <div className="w-full mt-3">
        <div className="text-left text-[11px] font-bold text-amber-300/80 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>All 4 Jackpot Category Results</span>
          <span className="text-[10px] text-gray-400 lowercase">stage breakdown</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* BLOCK 1: HIGHEST SPENDER */}
          <div
            className={`relative p-2.5 rounded-xl border flex flex-col justify-between transition-all transform ${
              data.highestOrder
                ? 'bg-gradient-to-b from-emerald-950/80 to-[#0a1a12] border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/50 scale-102'
                : 'bg-white/[0.03] border-white/10 opacity-90'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="p-1 rounded-md bg-amber-400/10 text-amber-300">
                <Award className="w-4 h-4" />
              </div>
              {data.highestOrder ? (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/60 text-[9px] font-black uppercase">
                  <span className="text-[10px]">⭐</span> QUALIFIED
                </span>
              ) : (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-bold uppercase">
                  <XCircle className="w-2.5 h-2.5" /> NOT WON
                </span>
              )}
            </div>

            <div>
              <div className="text-[11px] font-black text-white uppercase tracking-tight">
                Highest Spender
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Target: #1 Top Store Spender
              </div>
              <div className="text-xs font-black text-amber-300 mt-0.5">
                {data.highestOrder ? '🏆 #1 Record Champion' : 'Rank Evaluated'}
              </div>
            </div>

            <div className="mt-1.5 pt-1.5 border-t border-white/5 text-[9px] font-bold">
              {data.highestOrder ? (
                <span className="text-emerald-400 flex items-center gap-1 font-black">
                  ⭐ #1 RECORD HOLDER
                </span>
              ) : (
                <span className="text-gray-400">Not #1 Spender</span>
              )}
            </div>
          </div>

          {/* BLOCK 2: MONTHLY MEGA HAMPER */}
          <div
            className={`relative p-2.5 rounded-xl border flex flex-col justify-between transition-all transform ${
              data.monthly
                ? 'bg-gradient-to-b from-emerald-950/80 to-[#0a1a12] border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/50 scale-102'
                : 'bg-white/[0.03] border-white/10 opacity-90'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="p-1 rounded-md bg-cyan-400/10 text-cyan-300">
                <Calendar className="w-4 h-4" />
              </div>
              {data.monthly ? (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/60 text-[9px] font-black uppercase">
                  <span className="text-[10px]">⭐</span> QUALIFIED
                </span>
              ) : (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-bold uppercase">
                  <XCircle className="w-2.5 h-2.5" /> NOT WON
                </span>
              )}
            </div>

            <div>
              <div className="text-[11px] font-black text-white uppercase tracking-tight">
                30-Day Monthly
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Target: 30 / 30 Days
              </div>
              <div className="text-xs font-black text-cyan-300 mt-0.5">
                {data.customerActiveDays} / 30 Days Ordered
              </div>
            </div>

            <div className="mt-1.5 pt-1.5 border-t border-white/5 text-[9px] font-bold">
              {data.monthly ? (
                <span className="text-emerald-400 flex items-center gap-1 font-black">
                  ⭐ PERFECT 30/30 WIN!
                </span>
              ) : (
                <span className="text-rose-400/80">{30 - data.customerActiveDays} days missing</span>
              )}
            </div>
          </div>

          {/* BLOCK 3: WEEKLY SUPER HAMPER */}
          <div
            className={`relative p-2.5 rounded-xl border flex flex-col justify-between transition-all transform ${
              data.weekly
                ? 'bg-gradient-to-b from-emerald-950/80 to-[#0a1a12] border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/50 scale-102'
                : 'bg-white/[0.03] border-white/10 opacity-90'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="p-1 rounded-md bg-purple-400/10 text-purple-300">
                <Gift className="w-4 h-4" />
              </div>
              {data.weekly ? (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/60 text-[9px] font-black uppercase">
                  <span className="text-[10px]">⭐</span> QUALIFIED
                </span>
              ) : (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-bold uppercase">
                  <XCircle className="w-2.5 h-2.5" /> NOT WON
                </span>
              )}
            </div>

            <div>
              <div className="text-[11px] font-black text-white uppercase tracking-tight">
                7-Day Weekly
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Target: 7 / 7 Days
              </div>
              <div className="text-xs font-black text-purple-300 mt-0.5">
                {data.customerDays7} / 7 Days Ordered
              </div>
            </div>

            <div className="mt-1.5 pt-1.5 border-t border-white/5 text-[9px] font-bold">
              {data.weekly ? (
                <span className="text-emerald-400 flex items-center gap-1 font-black">
                  ⭐ 7/7 CONSECUTIVE WIN!
                </span>
              ) : (
                <span className="text-rose-400/80">{7 - data.customerDays7} days missing</span>
              )}
            </div>
          </div>

          {/* BLOCK 4: SURPRISE LOYALTY REWARD */}
          <div
            className={`relative p-2.5 rounded-xl border flex flex-col justify-between transition-all transform ${
              data.any
                ? 'bg-gradient-to-b from-emerald-950/80 to-[#0a1a12] border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/50 scale-102'
                : 'bg-white/[0.03] border-white/10 opacity-90'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="p-1 rounded-md bg-amber-400/10 text-amber-300">
                <Sparkles className="w-4 h-4" />
              </div>
              {data.any ? (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/60 text-[9px] font-black uppercase">
                  <span className="text-[10px]">⭐</span> QUALIFIED
                </span>
              ) : (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-bold uppercase">
                  <XCircle className="w-2.5 h-2.5" /> NOT WON
                </span>
              )}
            </div>

            <div>
              <div className="text-[11px] font-black text-white uppercase tracking-tight">
                Surprise Reward
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Target: ≥1 Active Order
              </div>
              <div className="text-xs font-black text-emerald-300 mt-0.5">
                {data.customerOrderCount} Orders Found
              </div>
            </div>

            <div className="mt-1.5 pt-1.5 border-t border-white/5 text-[9px] font-bold">
              {data.any ? (
                <span className="text-emerald-400 flex items-center gap-1 font-black">
                  ⭐ VOUCHER UNLOCKED
                </span>
              ) : (
                <span className="text-gray-400">0 orders in 30 days</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED 30-DAY ORDER DATES EXPANDER (Shows which & all days customer ordered with Green Stars ⭐) */}
      <div className="w-full mt-3 p-3 rounded-2xl bg-gradient-to-b from-[#131728] to-[#0a0d18] border border-emerald-500/40 shadow-lg">
        <div
          onClick={() => setShowCalendarDetail(!showCalendarDetail)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <div>
              <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>Verified 30-Day Customer Order Calendar</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase">
                  {placedCount} / 30 Days Ordered
                </span>
              </div>
              <div className="text-[11px] text-gray-300">
                Green stars (⭐) show every date the customer placed an order
              </div>
            </div>
          </div>
          <button
            type="button"
            className="p-1 rounded-lg bg-white/10 text-amber-300 hover:bg-white/20 transition-all"
          >
            {showCalendarDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showCalendarDetail && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>30-Day Visual Timeline:</span>
              </div>

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
                  All (30)
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

            {/* 30-Day Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-1.5 p-2 rounded-xl bg-black/60 border border-white/10">
              {calendarDates30.map((d, index) => {
                const isOrdered = dailyOrders30[index] ?? false;
                const isHidden =
                  (filterMode === 'ordered' && !isOrdered) ||
                  (filterMode === 'missed' && isOrdered);

                return (
                  <div
                    key={`final-day-${index}`}
                    className={`relative flex flex-col items-center justify-between py-1.5 px-0.5 rounded-lg border transition-all ${
                      isHidden ? 'opacity-20 filter grayscale' : ''
                    } ${
                      isOrdered
                        ? 'bg-gradient-to-b from-emerald-900/90 to-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.5)] ring-1 ring-emerald-400/50'
                        : 'bg-black/40 border-rose-800/40 text-rose-400/80 opacity-60'
                    }`}
                  >
                    <div className="text-[9px] font-black text-white truncate pointer-events-none">
                      {d.dayNum} {d.monthName}
                    </div>
                    <div className="text-base my-0.5">
                      {isOrdered ? '⭐' : '😔'}
                    </div>
                    <div
                      className={`text-[8px] font-black uppercase truncate ${
                        isOrdered ? 'text-emerald-300' : 'text-rose-400'
                      }`}
                    >
                      {isOrdered ? 'ORDERED' : 'NO ORDER'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Exact List of Ordered Dates */}
            {orderedDatesList.length > 0 && (
              <div className="pt-2">
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>List of Exact Dates Customer Placed Orders:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {orderedDatesList.map((d) => (
                    <span
                      key={`final-ordered-date-${d.dayIndex}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-400/60 text-emerald-200 text-xs font-bold shadow-sm"
                    >
                      <span className="text-emerald-400">⭐</span>
                      <span className="font-mono text-white">{d.dayNum} {d.monthName}</span>
                      <span className="text-[10px] text-emerald-400/90 font-medium">({d.weekday})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CHECK ANOTHER CUSTOMER BUTTON */}
      <div className="w-full mt-3 flex justify-center">
        <button
          id="btn-check-another-final-overview"
          onClick={onCheckAnother}
          className="w-full max-w-md py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-gray-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_6px_20px_rgba(255,215,0,0.35)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4 text-gray-950" />
          CHECK ANOTHER CUSTOMER
        </button>
      </div>
    </div>
  );
};
