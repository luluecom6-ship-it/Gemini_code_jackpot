export interface CustomerJackpotData {
  highestOrder: boolean;
  monthly: boolean;
  weekly: boolean;
  any: boolean;
  customerTotalSpending: number;
  highestTotalSpending: number;
  customerOrderCount: number;
  customerActiveDays: number;
  customerDays30: number;
  customerDays7: number;
  dailyOrders30: boolean[]; // 30 days true/false
  dailyOrders7: boolean[];  // 7 days true/false
  mobile: string;
  customerName?: string;
  vipTier?: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  lastOrderDate?: string;
  dataSource?: 'apps-script-run' | 'apps-script-api' | 'demo-simulation';
}

export type PhaseType = 'highest' | 'monthly' | 'weekly' | 'surprise';

export interface PhaseInfo {
  id: PhaseType;
  title: string;
  sub: string;
  icon: string;
  badge: string;
  durationMs: number;
}

export interface AppUser {
  username: string;
  name?: string;
  role?: string;
  mobile?: string;
}

export type BannerDisplayMode = 'animation' | 'video' | 'carousel';

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  imageUrl?: string;
  accentColor?: string;
}

export interface BannerSettings {
  mode: BannerDisplayMode;
  customVideoUrl: string;
  autoPlayIntervalMs: number;
  slides: BannerSlide[];
  showLoopBadge: boolean;
  videoMuted?: boolean;
  videoLoop?: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: AppUser;
  message?: string;
}
