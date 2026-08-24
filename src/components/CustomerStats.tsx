import React from 'react';
import { CustomerJackpotData } from '../types';
import { formatSAR, formatSaudiMobile } from '../utils/customerService';
import { ShoppingBag, Calendar, Award, TrendingUp, UserCheck, ShieldCheck } from 'lucide-react';

interface CustomerStatsProps {
  data: CustomerJackpotData;
  onCheckAnother?: () => void;
}

export const CustomerStats: React.FC<CustomerStatsProps> = ({
  data,
  onCheckAnother,
}) => {
  const isLeader = data.customerTotalSpending >= data.highestTotalSpending && data.customerTotalSpending > 0;
  const spendPct = data.highestTotalSpending > 0
    ? Math.min(100, Math.round((data.customerTotalSpending / data.highestTotalSpending) * 100))
    : 0;

  return (
    <div className="w-full mt-2 p-3 sm:p-4 rounded-xl bg-gradient-to-b from-[#111628] to-[#0a0d18] border border-amber-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
      {/* Customer Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center font-black text-sm shadow-[0_0_10px_rgba(255,215,0,0.4)]">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white text-sm flex items-center gap-1.5">
              {data.customerName || 'Verified Customer'}
              {data.vipTier && (
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  {data.vipTier} VIP
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-400 font-mono">
              {formatSaudiMobile(data.mobile)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold">
          {data.dataSource === 'apps-script-run' ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Apps Script Live
            </span>
          ) : data.dataSource === 'apps-script-api' ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> BigQuery API Live
            </span>
          ) : (
            <span className="text-amber-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" /> Preview Sandbox
            </span>
          )}
        </div>
      </div>

      {/* 4-Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2.5">
        {/* Stat 1: Spending */}
        <div className="p-2 sm:p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
            <TrendingUp className="w-3 h-3 text-amber-400" />
            <span>Total Spending</span>
          </div>
          <div className="text-sm sm:text-base font-black text-amber-300 mt-0.5">
            {formatSAR(data.customerTotalSpending)}
          </div>
          <div className="text-[9px] text-gray-400">
            {spendPct}% of highest
          </div>
        </div>

        {/* Stat 2: Total Orders */}
        <div className="p-2 sm:p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
            <ShoppingBag className="w-3 h-3 text-emerald-400" />
            <span>Orders Placed</span>
          </div>
          <div className="text-sm sm:text-base font-black text-emerald-300 mt-0.5">
            {data.customerOrderCount} Orders
          </div>
          <div className="text-[9px] text-gray-400">
            Last 30 days
          </div>
        </div>

        {/* Stat 3: Active Days */}
        <div className="p-2 sm:p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>Active Days (30d)</span>
          </div>
          <div className="text-sm sm:text-base font-black text-cyan-300 mt-0.5">
            {data.customerActiveDays} / 30 Days
          </div>
          <div className="text-[9px] text-gray-400">
            {data.monthly ? '⭐ Perfect 30/30' : `${30 - data.customerActiveDays} missing`}
          </div>
        </div>

        {/* Stat 4: Highest Spending Benchmark */}
        <div className="p-2 sm:p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
            <Award className="w-3 h-3 text-purple-400" />
            <span>Highest Record</span>
          </div>
          <div className="text-sm sm:text-base font-black text-purple-300 mt-0.5">
            {formatSAR(data.highestTotalSpending)}
          </div>
          <div className="text-[9px] text-gray-400">
            {isLeader ? '🏆 Winner' : 'Benchmark'}
          </div>
        </div>
      </div>

      {/* Benchmark Progress Bar */}
      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
        <div className="flex justify-between text-[10px] font-semibold text-gray-400 mb-1">
          <span>Customer Spending Benchmark</span>
          <span className="text-amber-300 font-bold">{spendPct}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-1000"
            style={{ width: `${spendPct}%` }}
          />
        </div>
      </div>

      {/* Rewards Status Tags */}
      <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span
            className={`px-2 py-0.5 rounded font-bold border ${
              data.highestOrder
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/5 text-gray-400 border-white/10'
            }`}
          >
            {data.highestOrder ? '🏆 Spender Winner' : 'Spender: No'}
          </span>
          <span
            className={`px-2 py-0.5 rounded font-bold border ${
              data.monthly
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 text-gray-400 border-white/10'
            }`}
          >
            {data.monthly ? '🎁 Monthly (30/30)' : `Monthly: ${data.customerActiveDays}/30`}
          </span>
          <span
            className={`px-2 py-0.5 rounded font-bold border ${
              data.weekly
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-white/5 text-gray-400 border-white/10'
            }`}
          >
            {data.weekly ? '⭐ Weekly (7/7)' : `Weekly: ${data.customerDays7}/7`}
          </span>
        </div>

        {onCheckAnother && (
          <button
            id="btn-check-another-stats"
            onClick={onCheckAnother}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-gray-950 font-black text-[10px] uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(255,215,0,0.3)] hover:scale-105 cursor-pointer"
          >
            🔄 Check Another
          </button>
        )}
      </div>
    </div>
  );
};
