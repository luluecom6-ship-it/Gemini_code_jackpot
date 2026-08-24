import React, { useState, useEffect, useRef } from 'react';
import { CustomerJackpotData, PhaseInfo, PhaseType, AppUser, BannerSettings } from './types';
import { MarqueeLights } from './components/MarqueeLights';
import { SlotReels } from './components/SlotReels';
import { CalendarSlotGrid } from './components/CalendarSlotGrid';
import { CustomerStats } from './components/CustomerStats';
import { AdminModal } from './components/AdminModal';
import { LoginPage } from './components/LoginPage';
import { PromoVideoBanner } from './components/PromoVideoBanner';
import { FinalOverviewCards } from './components/FinalOverviewCards';
import {
  fetchCustomerJackpotData,
  normalizeMobile,
  getStoredAppsScriptUrl,
  getStoredUser,
  setStoredUser,
  getStoredBannerSettings,
  isAdminUser,
} from './utils/customerService';
import { sound } from './utils/audio';
import {
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Gift,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowRight,
  RefreshCw,
  Database,
  Link2,
  LogOut,
  UserCheck,
  Settings,
  Shield,
} from 'lucide-react';

const PHASES: PhaseInfo[] = [
  {
    id: 'highest',
    title: 'HIGHEST ORDER JACKPOT',
    sub: 'Checking who holds the #1 total spending record in BigQuery (Last 30 Days)',
    icon: '🏆',
    badge: 'STAGE 1 OF 4',
    durationMs: 10000,
  },
  {
    id: 'monthly',
    title: 'MONTHLY MEGA HAMPER (30 DAYS)',
    sub: 'Did you place an order on every single day during the last 30 days?',
    icon: '📅',
    badge: 'STAGE 2 OF 4',
    durationMs: 10000,
  },
  {
    id: 'weekly',
    title: 'WEEKLY SUPER HAMPER (7 DAYS)',
    sub: 'Did you place an order on every single day during the last 7 days?',
    icon: '⭐',
    badge: 'STAGE 3 OF 4',
    durationMs: 10000,
  },
  {
    id: 'surprise',
    title: 'SURPRISE LOYALTY GIFT',
    sub: 'Checking if the jackpot vault has an exclusive surprise reward for you...',
    icon: '🎁',
    badge: 'FINAL STAGE',
    durationMs: 7000,
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(getStoredUser());
  const [mobileInput, setMobileInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerJackpotData | null>(null);
  const [calcDone, setCalcDone] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(getStoredAppsScriptUrl());
  const [bannerSettings, setBannerSettings] = useState<BannerSettings>(getStoredBannerSettings());

  // Result dialog display
  const [resultBanner, setResultBanner] = useState<{
    icon: string;
    title: string;
    message: string;
    isWin: boolean;
  } | null>(null);

  // Stage transition countdown & delay review timer (gives ample time to inspect green stars)
  const [nextStageCountdown, setNextStageCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingTransitionCallbackRef = useRef<(() => void) | null>(null);

  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseStartTimeRef = useRef<number>(0);
  const calcDoneRef = useRef(false);
  const customerDataRef = useRef<CustomerJackpotData | null>(null);

  const handleLogout = () => {
    setStoredUser(null);
    setCurrentUser(null);
    handleCheckAnother();
  };

  // Update sound engine preference
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  const clearAllTimers = () => {
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    phaseTimerRef.current = null;
    progressTimerRef.current = null;
    countdownIntervalRef.current = null;
    pendingTransitionCallbackRef.current = null;
    setNextStageCountdown(null);
  };

  // Helper to start review countdown timer (allows users to read dates comfortably, or skip anytime)
  const startTransitionCountdown = (seconds: number, onComplete: () => void) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    pendingTransitionCallbackRef.current = onComplete;
    setNextStageCountdown(seconds);

    let remaining = seconds;
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setNextStageCountdown(remaining);
      if (remaining <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setNextStageCountdown(null);
        const cb = pendingTransitionCallbackRef.current;
        pendingTransitionCallbackRef.current = null;
        if (cb) cb();
      }
    }, 1000);
  };

  // Skip countdown immediately if user clicks continue
  const handleSkipCountdown = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = null;
    setNextStageCountdown(null);
    const cb = pendingTransitionCallbackRef.current;
    pendingTransitionCallbackRef.current = null;
    if (cb) cb();
  };

  // Reset to Home / Check Another Customer
  const handleCheckAnother = () => {
    clearAllTimers();
    setIsChecking(false);
    setCustomerData(null);
    setCalcDone(false);
    setCurrentPhaseIndex(0);
    setPhaseProgress(0);
    setSecondsRemaining(10);
    setIsRevealed(false);
    setIsFinished(false);
    setErrorMessage(null);
    setResultBanner(null);
    calcDoneRef.current = false;
    customerDataRef.current = null;
    setMobileInput('');
  };

  // Begin Jackpot Check
  const startJackpot = async (overrideMobile?: string) => {
    const targetMobile = overrideMobile || mobileInput;
    const cleanMobile = normalizeMobile(targetMobile);

    if (!cleanMobile || cleanMobile.length < 8) {
      setErrorMessage('Please enter a valid Saudi mobile number (e.g. 0501112233 or 501112233)');
      return;
    }

    setErrorMessage(null);
    setIsChecking(true);
    setIsFinished(false);
    setIsRevealed(false);
    setCalcDone(false);
    setResultBanner(null);
    setNextStageCountdown(null);
    calcDoneRef.current = false;
    customerDataRef.current = null;

    // Start background BigQuery check using configured Live Apps Script endpoint or native
    fetchCustomerJackpotData(cleanMobile, appsScriptUrl, currentUser?.username)
      .then((data) => {
        setCustomerData(data);
        customerDataRef.current = data;
        setCalcDone(true);
        calcDoneRef.current = true;
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : 'Unable to query BigQuery.');
      });

    // Run first stage: Highest Order
    executePhase(0);
  };

  // Execute a specific stage (0 = highest, 1 = monthly, 2 = weekly, 3 = surprise)
  const executePhase = (stageIndex: number) => {
    clearAllTimers();
    setCurrentPhaseIndex(stageIndex);
    setIsRevealed(false);
    setResultBanner(null);
    setNextStageCountdown(null);

    const phase = PHASES[stageIndex];
    const duration = phase.durationMs;
    const startTime = Date.now();
    phaseStartTimeRef.current = startTime;

    setPhaseProgress(0);
    setSecondsRemaining(Math.ceil(duration / 1000));

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setPhaseProgress(pct);
      setSecondsRemaining(Math.max(0, Math.ceil((duration - elapsed) / 1000)));

      // If duration completed AND BigQuery data is ready -> resolve phase
      if (elapsed >= duration && calcDoneRef.current) {
        completeCurrentPhase(stageIndex);
      }
    }, 80);
  };

  // Complete phase and determine win vs next stage with ample reading delay for calendar dates
  const completeCurrentPhase = (stageIndex: number) => {
    clearAllTimers();
    setPhaseProgress(100);
    setSecondsRemaining(0);
    setIsRevealed(true);

    const data = customerDataRef.current;
    if (!data) return;

    const phase = PHASES[stageIndex];

    // STAGE 0: HIGHEST ORDER
    if (phase.id === 'highest') {
      if (data.highestOrder) {
        sound.playWinFanfare();
        setResultBanner({
          icon: '🏆',
          title: 'JACKPOT WINNER!',
          message: 'Congratulations! You are the #1 highest total spender in LuLu Online database!',
          isWin: true,
        });
        startTransitionCountdown(4, () => {
          setIsFinished(true);
        });
      } else {
        sound.playLoseChime();
        setResultBanner({
          icon: '😔',
          title: 'HIGHEST SPENDER NOT WON',
          message: 'The highest total spending jackpot belongs to another customer. Moving to Monthly Mega Hamper...',
          isWin: false,
        });
        startTransitionCountdown(3, () => {
          executePhase(1);
        });
      }
      return;
    }

    // STAGE 1: MONTHLY (30 DAYS) - Delay 6 seconds so user can see which dates turned green
    if (phase.id === 'monthly') {
      if (data.monthly) {
        sound.playWinFanfare();
        setResultBanner({
          icon: '🎁',
          title: '30-DAY MONTHLY HAMPER WON!',
          message: 'Extraordinary loyalty! You placed orders on ALL 30 consecutive days in the last month!',
          isWin: true,
        });
        // Give 6 full seconds of celebration on the 30-day green star grid before finishing
        startTransitionCountdown(6, () => {
          setIsFinished(true);
        });
      } else {
        sound.playLoseChime();
        setResultBanner({
          icon: '😔',
          title: 'MONTHLY HAMPER NOT WON',
          message: `You ordered on ${data.customerActiveDays} of 30 days. Review dates above before moving to Weekly Super Hamper...`,
          isWin: false,
        });
        // Give 6 full seconds so cashier and customer can read all dates ordered (green stars)
        startTransitionCountdown(6, () => {
          executePhase(2);
        });
      }
      return;
    }

    // STAGE 2: WEEKLY (7 DAYS) - Delay 6 seconds so user can see which dates turned green
    if (phase.id === 'weekly') {
      if (data.weekly) {
        sound.playWinFanfare();
        setResultBanner({
          icon: '⭐',
          title: 'WEEKLY SUPER HAMPER WON!',
          message: 'Incredible dedication! You ordered on ALL 7 days during this week!',
          isWin: true,
        });
        startTransitionCountdown(6, () => {
          setIsFinished(true);
        });
      } else {
        sound.playLoseChime();
        setResultBanner({
          icon: '😔',
          title: 'WEEKLY HAMPER NOT WON',
          message: `You ordered on ${data.customerDays7} of 7 days. Checking final surprise gift...`,
          isWin: false,
        });
        startTransitionCountdown(6, () => {
          executePhase(3);
        });
      }
      return;
    }

    // STAGE 3: SURPRISE GIFT
    if (phase.id === 'surprise') {
      if (data.any) {
        sound.playWinFanfare();
        setResultBanner({
          icon: '🎉',
          title: 'SURPRISE LOYALTY REWARD!',
          message: `Thank you for shopping with us! You have unlocked an exclusive discount voucher on your ${data.customerOrderCount} orders!`,
          isWin: true,
        });
      } else {
        sound.playLoseChime();
        setResultBanner({
          icon: '🛒',
          title: 'NO ACTIVE ORDERS FOUND',
          message: 'Place an order today to participate in the daily, weekly, and monthly jackpot rewards!',
          isWin: false,
        });
      }
      startTransitionCountdown(4, () => {
        setIsFinished(true);
      });
    }
  };

  const activePhase = PHASES[currentPhaseIndex];

  // If user is not logged in, show the Operator Login Page
  if (!currentUser) {
    return (
      <LoginPage
        appsScriptUrl={appsScriptUrl}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#05070e] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black relative overflow-x-hidden">
      {/* Dynamic Background Spotlights */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* TOP BAR */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-500 flex items-center justify-center text-black font-black text-lg shadow-[0_0_15px_rgba(255,215,0,0.5)] ring-2 ring-amber-300/50">
            🎰
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
              LUCKY <span className="text-white">JACKPOT</span>
            </div>
            <div className="text-[9px] sm:text-[10px] font-semibold text-amber-300/70 tracking-widest uppercase">
              VIP Customer Rewards Engine
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Operator logged-in badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-200 font-bold text-xs">{currentUser.username}</span>
            <span className="hidden sm:inline text-[10px] text-gray-400">({currentUser.role || 'Operator'})</span>
          </div>

          {/* Admin Settings Gear Icon Button (Strictly restricted to Admin role) */}
          {isAdminUser(currentUser) && (
            <button
              id="btn-admin-settings"
              onClick={() => setIsAdminModalOpen(true)}
              className="p-1.5 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm"
              title="Admin Settings & BigQuery Sync"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400 animate-[spin_10s_linear_infinite]" />
              <span className="hidden sm:inline">Admin Settings</span>
            </button>
          )}

          {/* Audio toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-gray-500" />}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
            title={`Logout (${currentUser.username})`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 py-1 sm:py-2 flex flex-col items-center justify-center">
        <MarqueeLights
          isSpinning={isChecking && !isRevealed}
          isWinning={isFinished && Boolean(resultBanner?.isWin)}
        >
          {/* VIEW 1: HOME ENTRY SCREEN (Compact & Single-View) */}
          {!isChecking && (
            <div className="p-4 sm:p-6 text-center flex flex-col items-center justify-center">
              {/* Grand Banner Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] sm:text-xs font-black tracking-widest uppercase mb-2 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                BIGQUERY REWARDS SCANNER
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
                🎰 CHECK YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">LUCK</span>
              </h1>

              <p className="max-w-lg text-gray-300 text-xs sm:text-sm mb-4 leading-normal">
                Enter customer mobile number to check for <strong>Highest Spender (VIP)</strong>, <strong>30-Day Mega Hamper</strong>, and <strong>Weekly Super Hamper</strong>.
              </p>

              {/* Mobile Input Box */}
              <div className="w-full max-w-md bg-black/60 p-3 sm:p-4 rounded-2xl border border-amber-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
                <label className="block text-left text-[11px] font-bold uppercase tracking-wider text-amber-300/80 mb-1.5">
                  Saudi Mobile Number
                </label>

                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-black text-sm text-gray-400 font-mono select-none">
                    🇸🇦 +966
                  </span>
                  <input
                    id="input-mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={14}
                    value={mobileInput}
                    onChange={(e) => setMobileInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') startJackpot();
                    }}
                    placeholder="5X XXX XXXX"
                    autoFocus
                    className="w-full pl-22 pr-3 py-2.5 sm:py-3 rounded-xl bg-[#111628] border-2 border-amber-500/40 focus:border-amber-400 focus:shadow-[0_0_20px_rgba(255,215,0,0.4)] text-white text-lg sm:text-xl font-bold font-mono tracking-wider outline-none transition-all placeholder:text-gray-600"
                  />
                </div>

                {errorMessage && (
                  <div className="mt-2.5 p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  id="btn-check-luck"
                  onClick={() => startJackpot()}
                  className="w-full mt-3 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-gray-950 text-base sm:text-lg font-black tracking-wider uppercase transition-all shadow-[0_8px_25px_rgba(255,190,0,0.4)] hover:shadow-[0_12px_35px_rgba(255,215,0,0.6)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-gray-950" />
                  CHECK MY LUCK
                  <ArrowRight className="w-4 h-4 text-gray-950" />
                </button>
              </div>

              {/* Promotional Video / Carousel Banner - Managed from Admin Page */}
              <PromoVideoBanner settings={bannerSettings} />
            </div>
          )}

          {/* VIEW 2: ACTIVE JACKPOT STAGES & REVEALS (Compact Layout) */}
          {isChecking && (
            <div className="p-3 sm:p-5 flex flex-col items-center">
              {/* Stage Header (during active scanning phases) */}
              {!isFinished && (
                <div className="w-full text-center pb-2 border-b border-white/10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black tracking-wider uppercase mb-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    {activePhase.badge}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
                    <span>{activePhase.icon}</span> {activePhase.title}
                  </h2>
                  <p className="text-gray-300 text-xs mt-0.5 max-w-md mx-auto truncate">
                    {activePhase.sub}
                  </p>
                </div>
              )}

              {/* STAGE VISUALS (during active scanning phases) */}
              {!isFinished && (
                <div className="w-full my-2 flex items-center justify-center min-h-[140px] sm:min-h-[160px]">
                  {activePhase.id === 'highest' && (
                    <SlotReels
                      isSpinning={!isRevealed}
                      isRevealed={isRevealed}
                      isJackpotWin={Boolean(customerData?.highestOrder)}
                    />
                  )}

                  {activePhase.id === 'monthly' && (
                    <CalendarSlotGrid
                      totalDays={30}
                      dailyOrders={customerData?.dailyOrders30 || Array(30).fill(false)}
                      isRevealed={isRevealed}
                      isSpinning={!isRevealed}
                      nextStageSecondsRemaining={nextStageCountdown}
                      onContinueNext={handleSkipCountdown}
                    />
                  )}

                  {activePhase.id === 'weekly' && (
                    <CalendarSlotGrid
                      totalDays={7}
                      dailyOrders={customerData?.dailyOrders7 || Array(7).fill(false)}
                      isRevealed={isRevealed}
                      isSpinning={!isRevealed}
                      nextStageSecondsRemaining={nextStageCountdown}
                      onContinueNext={handleSkipCountdown}
                    />
                  )}

                  {activePhase.id === 'surprise' && (
                    <div className="flex flex-col items-center justify-center py-3 text-center">
                      <div className="text-5xl sm:text-6xl animate-bounce">
                        {isRevealed ? (customerData?.any ? '🎁' : '🛍️') : '🎁'}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-amber-300 mt-2">
                        {isRevealed
                          ? customerData?.any
                            ? '🎉 Exclusive Surprise Gift Unlocked!'
                            : 'No orders found to grant surprise reward'
                          : 'Unlocking secret jackpot loyalty reward...'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STAGE RESULT BANNER (during stage evaluation) */}
              {resultBanner && !isFinished && (
                <div
                  className={`w-full my-2 p-3.5 rounded-2xl border text-center transition-all ${
                    resultBanner.isWin
                      ? 'bg-gradient-to-r from-emerald-950/80 via-emerald-900/70 to-emerald-950/80 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)] animate-pulse'
                      : 'bg-white/5 border-white/10 text-gray-300'
                  }`}
                >
                  <div className="text-2xl sm:text-3xl mb-1">{resultBanner.icon}</div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    {resultBanner.title}
                  </h3>
                  <p className="text-xs text-gray-300 mt-0.5 max-w-md mx-auto">
                    {resultBanner.message}
                  </p>

                  {/* Stage Transition Delay Action & Countdown */}
                  {nextStageCountdown !== null && nextStageCountdown > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-center gap-3">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        Next stage in {nextStageCountdown}s
                      </span>
                      <button
                        type="button"
                        onClick={handleSkipCountdown}
                        className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider transition-all shadow cursor-pointer"
                      >
                        Skip Wait ⏭️
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* FINAL ZOOMED-OUT 4-STAGE COMPARISON & COLLECT YOUR GIFT OVERVIEW */}
              {isFinished && customerData && (
                <FinalOverviewCards
                  data={customerData}
                  onCheckAnother={handleCheckAnother}
                />
              )}

              {/* PROGRESS BAR & TIMER */}
              {!isRevealed && (
                <div className="w-full mt-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 mb-1">
                    <span className="text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      JACKPOT SCANNING
                    </span>
                    <span className="font-mono text-amber-400">
                      {secondsRemaining}s
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-black/60 border border-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-rose-500 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                      style={{ width: `${phaseProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* DETAILED CUSTOMER STATS BREAKDOWN (Compact - during active scan) */}
              {customerData && !isFinished && (
                <CustomerStats
                  data={customerData}
                  onCheckAnother={handleCheckAnother}
                />
              )}
            </div>
          )}
        </MarqueeLights>
      </main>

      {/* Admin Control Center Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
        onUserUpdate={setCurrentUser}
        appsScriptUrl={appsScriptUrl}
        onAppsScriptUrlChange={(newUrl) => setAppsScriptUrl(newUrl)}
        bannerSettings={bannerSettings}
        onBannerSettingsChange={(newSettings) => setBannerSettings(newSettings)}
      />
    </div>
  );
}
