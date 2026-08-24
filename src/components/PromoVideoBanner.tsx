import React, { useState, useEffect, useRef } from 'react';
import { BannerSettings } from '../types';
import { getStoredBannerSettings } from '../utils/customerService';
import {
  RotateCw,
  Bike,
  ShoppingBag,
  Smartphone,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Flame,
  Star,
  Play,
  Pause,
  Film,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  Radio,
} from 'lucide-react';

interface PromoVideoBannerProps {
  settings?: BannerSettings;
}

// Helper to extract Google Drive File ID
function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile && matchFile[1]) return matchFile[1];
  const matchOpen = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (matchOpen && matchOpen[1]) return matchOpen[1];
  return null;
}

// Generate Google Drive Direct Stream URL & Preview Embed URL
function getDriveUrls(url: string): { directStreamUrl: string; embedUrl: string } | null {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return null;
  return {
    directStreamUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
    embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
  };
}

export const PromoVideoBanner: React.FC<PromoVideoBannerProps> = ({ settings: propSettings }) => {
  const [settings, setSettings] = useState<BannerSettings>(propSettings || getStoredBannerSettings());
  const [hasDirectVideoError, setHasDirectVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(
    settings.videoMuted !== undefined ? settings.videoMuted : false
  );
  const [isPlaying, setIsPlaying] = useState(true);
  const [useIframeMode, setUseIframeMode] = useState(false);
  const [embedReloadKey, setEmbedReloadKey] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync prop changes
  useEffect(() => {
    if (propSettings) {
      setSettings(propSettings);
      setHasDirectVideoError(false);
      if (propSettings.videoMuted !== undefined) {
        setIsMuted(propSettings.videoMuted);
      }
    }
  }, [propSettings]);

  const driveUrls = getDriveUrls(settings.customVideoUrl);

  // Carousel slide index
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Scene state for animation recreation
  const [scene, setScene] = useState(0);
  const [ticker, setTicker] = useState(0);

  // Animation cycle for animated mode
  useEffect(() => {
    if (settings.mode === 'animation') {
      const sceneInterval = setInterval(() => {
        setScene((prev) => (prev + 1) % 6);
      }, 2200);

      const tickInterval = setInterval(() => {
        setTicker((prev) => (prev + 1) % 200);
      }, 40);

      return () => {
        clearInterval(sceneInterval);
        clearInterval(tickInterval);
      };
    } else if (settings.mode === 'carousel') {
      const slidesLength = settings.slides?.length || 1;
      const interval = setInterval(() => {
        setActiveSlideIndex((prev) => (prev + 1) % slidesLength);
      }, settings.autoPlayIntervalMs || 2800);

      return () => clearInterval(interval);
    }
  }, [settings.mode, settings.slides, settings.autoPlayIntervalMs]);

  // Video loop & audio sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.loop = true;
      if (!isMuted) {
        videoRef.current.volume = 1.0;
      }
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback: if browser blocks unmuted autoplay, mute and try again
        if (videoRef.current && !isMuted) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [settings.customVideoUrl, isMuted, useIframeMode]);

  // Handle continuous looping when video ends
  const handleVideoEnded = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  // Toggle Audio Mute / Unmute
  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  // Toggle Play / Pause
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Restart video loop
  const restartVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else if (useIframeMode) {
      setEmbedReloadKey((k) => k + 1);
    }
  };

  const activeSlide = settings.slides?.[activeSlideIndex] || settings.slides?.[0];

  // Determine video sources
  const videoSourceUrl = driveUrls ? driveUrls.directStreamUrl : settings.customVideoUrl;

  return (
    <div className="w-full max-w-md mt-2.5 relative rounded-2xl overflow-hidden border-2 border-red-500/50 shadow-[0_8px_30px_rgba(200,16,46,0.4)] bg-[#c8102e] text-white select-none">
      {/* MODE 1: NATIVE VIDEO OR GOOGLE DRIVE VIDEO */}
      {settings.mode === 'video' && settings.customVideoUrl ? (
        <div className="relative w-full aspect-[16/9] bg-black flex items-center justify-center overflow-hidden group">
          {/* Option A: Direct Video Stream (Continuous Looping with Native Audio Control) */}
          {!useIframeMode && !hasDirectVideoError ? (
            <video
              ref={videoRef}
              key={videoSourceUrl}
              src={videoSourceUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onEnded={handleVideoEnded}
              onError={() => {
                // If direct download stream fails (e.g. CORS on some Drive endpoints), fallback to embed
                if (driveUrls) {
                  setUseIframeMode(true);
                } else {
                  setHasDirectVideoError(true);
                }
              }}
              className="w-full h-full object-cover"
            />
          ) : driveUrls ? (
            /* Option B: Google Drive Embed Player */
            <div className="relative w-full h-full">
              <iframe
                key={`${driveUrls.embedUrl}-${embedReloadKey}`}
                src={driveUrls.embedUrl}
                title="Google Drive Video Player"
                className="w-full h-full border-0 pointer-events-auto"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center text-xs text-amber-200">
              <span>Could not load custom video stream.</span>
              <button
                onClick={() => setHasDirectVideoError(false)}
                className="mt-2 px-3 py-1 bg-white/20 rounded text-[11px] font-bold"
              >
                Retry Video
              </button>
            </div>
          )}

          {/* OVERLAY: Top Status & Audio Bar */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-30 pointer-events-auto">
            {/* Loop Indicator */}
            <div
              onClick={restartVideo}
              className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[9px] font-black tracking-wider text-amber-300 uppercase flex items-center gap-1.5 shadow-md cursor-pointer hover:bg-black/90 transition-all"
              title="Continuous Video Loop is Active. Click to replay."
            >
              <RotateCw className="w-3 h-3 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>CONTINUOUS LOOP</span>
            </div>

            {/* Audio ON / OFF Toggle Button */}
            <button
              type="button"
              onClick={toggleAudio}
              id="btn-video-audio-toggle"
              className={`px-3 py-1 rounded-full backdrop-blur-md border text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                !isMuted
                  ? 'bg-emerald-600/90 text-white border-emerald-400 ring-2 ring-emerald-400/50 shadow-emerald-900/40 hover:bg-emerald-500'
                  : 'bg-black/80 text-amber-300 border-amber-400/40 hover:bg-black/95'
              }`}
              title={isMuted ? 'Click to Turn Sound ON' : 'Click to Mute Video Sound'}
            >
              {!isMuted ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span>AUDIO ON</span>
                  {/* Equalizer animation indicator */}
                  <div className="flex items-end gap-0.5 h-2.5 ml-0.5">
                    <span className="w-0.5 bg-white h-2 animate-bounce" />
                    <span className="w-0.5 bg-white h-3 animate-bounce [animation-delay:150ms]" />
                    <span className="w-0.5 bg-white h-1.5 animate-bounce [animation-delay:300ms]" />
                  </div>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                  <span>MUTED (TAP FOR AUDIO)</span>
                </>
              )}
            </button>
          </div>

          {/* OVERLAY: Bottom Quick Controls (Replay & Drive Stream Switcher) */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-30 pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={restartVideo}
                className="p-1 px-2 rounded-lg bg-black/70 hover:bg-black/90 border border-white/20 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow"
                title="Restart Video from Beginning"
              >
                <RotateCcw className="w-3 h-3 text-amber-300" />
                <span>Replay</span>
              </button>

              {!useIframeMode && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1 px-2 rounded-lg bg-black/70 hover:bg-black/90 border border-white/20 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow"
                >
                  {isPlaying ? <Pause className="w-3 h-3 text-amber-300" /> : <Play className="w-3 h-3 text-emerald-400" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
              )}
            </div>

            {driveUrls && (
              <button
                type="button"
                onClick={() => setUseIframeMode(!useIframeMode)}
                className="px-2 py-0.5 rounded-lg bg-black/70 hover:bg-black/90 border border-white/20 text-[9px] font-bold text-amber-200 cursor-pointer transition-all"
                title="Switch between Direct Stream Mode & Drive Embed"
              >
                {useIframeMode ? 'Switch to Direct Player' : 'Drive Embed'}
              </button>
            )}
          </div>
        </div>
      ) : settings.mode === 'carousel' ? (
        /* MODE 2: CUSTOM DEALS & OFFERS CAROUSEL */
        <div
          className="relative w-full aspect-[16/9] overflow-hidden flex flex-col justify-between p-3.5 transition-colors duration-500"
          style={{
            backgroundColor: activeSlide?.accentColor || '#c8102e',
          }}
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_70%)]" />

          {/* Top Bar */}
          <div className="relative z-10 flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-[9px] font-black tracking-wider text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-white" />
              <span>{activeSlide?.tag || 'LULU EXCLUSIVE'}</span>
            </div>

            {settings.showLoopBadge && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-[8px] font-bold text-amber-300">
                <RotateCw className="w-2.5 h-2.5 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
                <span>CAROUSEL LOOP</span>
              </div>
            )}
          </div>

          {/* Carousel Slide Content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4 my-1 animate-fadeIn">
            {activeSlide?.imageUrl ? (
              <img
                src={activeSlide.imageUrl}
                alt={activeSlide.title}
                className="max-h-20 object-contain rounded-lg shadow-lg mb-1"
                referrerPolicy="no-referrer"
              />
            ) : null}

            <div className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              {activeSlide?.title}
            </div>
            <div className="text-xs sm:text-sm font-bold text-amber-300 mt-1 max-w-xs drop-shadow">
              {activeSlide?.subtitle}
            </div>
          </div>

          {/* Carousel Bottom Navigation & Indicators */}
          <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/20">
            <div className="flex items-center gap-1">
              {settings.slides?.map((slide, idx) => (
                <button
                  key={slide.id || idx}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeSlideIndex === idx ? 'w-5 bg-amber-300' : 'w-1.5 bg-white/40'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-white/90">
                luluhypermarket.com
              </span>
              <div className="px-2 py-0.5 rounded bg-white text-[#c8102e] text-[8px] font-black uppercase">
                Shop Now
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODE 3: KINETIC LULU COMMERCIAL RECREATION */
        <div className="relative w-full aspect-[16/9] bg-[#c8102e] overflow-hidden flex flex-col justify-between p-3.5">
          {/* Animated Concentric Background Wave Pattern */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, transparent 20%, rgba(255,255,255,0.4) 22%, transparent 24%, rgba(255,255,255,0.4) 34%, transparent 36%, rgba(255,255,255,0.4) 48%, transparent 50%, rgba(255,255,255,0.4) 62%, transparent 64%)`,
              backgroundSize: '100% 100%',
              transform: `scale(${1 + (ticker % 30) * 0.01})`,
            }}
          />

          {/* Top Status Bar */}
          <div className="relative z-10 flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm border border-white/15 text-[9px] font-black tracking-wider text-white">
              <span className="w-2 h-2 rounded-full bg-[#107c41] inline-block ring-1 ring-white" />
              <span>LuLu Online</span>
            </div>

            {settings.showLoopBadge && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-[8px] font-bold text-amber-300">
                <RotateCw className="w-2.5 h-2.5 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
                <span>CONTINUOUS LOOP</span>
              </div>
            )}
          </div>

          {/* DYNAMIC SCENE DISPLAY */}
          <div className="relative z-10 flex-1 flex items-center justify-center my-1">
            {/* SCENE 0: Mobile in Hand & Fast Scooter Delivery */}
            {scene === 0 && (
              <div className="w-full flex items-center justify-around animate-fadeIn">
                <div className="relative w-28 h-36 bg-gradient-to-b from-gray-900 to-black rounded-2xl border-2 border-white/80 p-1 shadow-2xl flex flex-col transform -rotate-6">
                  <div className="w-full bg-[#c8102e] rounded-t-lg p-1 flex items-center justify-between text-[7px] font-black text-white">
                    <span>LuLu Express</span>
                    <span className="bg-amber-400 text-black px-1 rounded font-bold">Quick</span>
                  </div>
                  <div className="w-full h-8 bg-gradient-to-r from-amber-400 to-yellow-500 rounded my-1 flex items-center justify-center text-[7px] text-black font-black">
                    🔥 HOT DEALS & SAVERS
                  </div>
                  <div className="grid grid-cols-3 gap-0.5 text-[6px] text-center text-gray-300">
                    <div className="bg-white/10 p-0.5 rounded">🍎 Fresh</div>
                    <div className="bg-white/10 p-0.5 rounded">🥛 Dairy</div>
                    <div className="bg-white/10 p-0.5 rounded">🍗 Meat</div>
                  </div>
                  <div className="mt-auto py-0.5 text-center text-[6px] text-amber-300 font-bold bg-white/5 rounded">
                    Get it in 45-60 mins
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div
                    className="relative text-white flex flex-col items-center"
                    style={{
                      transform: `translateY(${Math.sin(ticker / 3) * 3}px)`,
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-white text-[#c8102e] flex items-center justify-center shadow-lg ring-2 ring-amber-300">
                      <Bike className="w-7 h-7" />
                    </div>
                    <div className="mt-1 text-[11px] font-black tracking-wider uppercase text-white drop-shadow">
                      EXPRESS DELIVERY
                    </div>
                    <div className="text-[9px] text-amber-300 font-bold">
                      Right to Your Door
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 1: EXPLORE WIDER CHOICES */}
            {scene === 1 && (
              <div className="w-full flex flex-col items-center justify-center text-center animate-scaleUp">
                <div className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  EXPLORE
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-widest text-amber-300 uppercase mt-0.5 flex items-center gap-2">
                  <span>WIDER</span>
                  <span className="px-2 py-0.5 rounded bg-white text-[#c8102e] text-base sm:text-lg font-black shadow">
                    CHOICES
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-sm bg-black/30 px-3 py-1 rounded-full border border-white/20">
                  <span>🎮 Gaming</span>
                  <span>🐟 Fresh Fish</span>
                  <span>📱 Electronics</span>
                  <span>👗 Fashion</span>
                </div>
              </div>
            )}

            {/* SCENE 2: ENJOY FRESHER FINDS */}
            {scene === 2 && (
              <div className="w-full flex items-center justify-around animate-fadeIn">
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-black tracking-widest text-white/80 uppercase">
                    ENJOY
                  </div>
                  <div className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase drop-shadow">
                    FRESHER
                  </div>
                  <div className="text-xl sm:text-2xl font-black tracking-wider text-amber-300 uppercase">
                    FINDS
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="px-2.5 py-1 rounded-lg bg-white text-gray-900 font-black text-[10px] shadow-md flex items-center gap-1 transform -rotate-3">
                    <span>🥛</span> Fresh Milk
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-white text-gray-900 font-black text-[10px] shadow-md flex items-center gap-1 transform rotate-2">
                    <span>🍞</span> LuLu Rusk
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-white text-gray-900 font-black text-[10px] shadow-md flex items-center gap-1 transform rotate-3">
                    <span>☕</span> Coffee
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-white text-gray-900 font-black text-[10px] shadow-md flex items-center gap-1 transform -rotate-2">
                    <span>🍎</span> Fresh Fruits
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 3: GET FASTER DELIVERY */}
            {scene === 3 && (
              <div className="w-full flex flex-col items-center justify-center animate-fadeIn relative">
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                  GET <span className="text-amber-300">FASTER</span> DELIVERY
                </div>

                <div className="w-full relative my-2 h-10 flex items-center">
                  <div className="w-full h-1 bg-white shadow-[0_0_10px_white]" />
                  <div
                    className="absolute top-0 flex items-center gap-1 transition-all duration-75"
                    style={{
                      left: `${(ticker * 2) % 85}%`,
                    }}
                  >
                    <div className="p-1 rounded-full bg-white text-[#c8102e] shadow-lg ring-2 ring-amber-400">
                      <Bike className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black text-amber-300 bg-black/60 px-1 rounded">
                      Fast 💨
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-white/90">
                  Track your orders in real-time
                </div>
              </div>
            )}

            {/* SCENE 4: ORDER NOW IN MINUTES */}
            {scene === 4 && (
              <div className="w-full flex items-center justify-around animate-scaleUp">
                <div className="relative flex flex-col items-center">
                  <div className="text-4xl animate-bounce">
                    🛒
                  </div>
                  <div className="flex gap-1 -mt-2">
                    <span className="text-xl">🛍️</span>
                    <span className="text-xl">🛍️</span>
                  </div>
                </div>

                <div className="text-left pl-2">
                  <div className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase leading-none drop-shadow">
                    ORDER NOW
                  </div>
                  <div className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-widest mt-1 flex items-center gap-1">
                    <Bike className="w-4 h-4 text-white" />
                    <span>IN MINUTES</span>
                  </div>
                  <div className="mt-1 text-[10px] font-medium text-white/80">
                    Thousands of groceries & deals ready
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 5: LuLu Brand & App Download Screen */}
            {scene === 5 && (
              <div className="w-full flex flex-col items-center justify-center text-center animate-fadeIn bg-white rounded-xl p-2.5 text-gray-900 shadow-xl">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#c8102e] text-white flex items-center justify-center font-black text-sm">
                    L
                  </div>
                  <div className="text-xl sm:text-2xl font-black tracking-wider text-[#c8102e]">
                    <span className="text-[#107c41]">Lu</span>Lu
                  </div>
                </div>
                <div className="text-[9px] text-gray-600 font-bold italic -mt-0.5">
                  Where the world comes to shop
                </div>

                <div className="mt-2 px-4 py-1.5 rounded-lg bg-[#c8102e] text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-amber-300" />
                  <span>Download LuLu App Now</span>
                  <ChevronRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Progress Bar */}
          <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/20">
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    scene === s ? 'w-4 bg-amber-300' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>

            <div className="text-[9px] font-bold text-amber-200 tracking-wide">
              luluhypermarket.com
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
