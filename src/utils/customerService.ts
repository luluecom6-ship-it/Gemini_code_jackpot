import { CustomerJackpotData, AppUser, LoginResult } from '../types';

export function normalizeMobile(value: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  let digits = String(value || '').replace(/\D/g, '');

  // Remove Saudi country code
  if (digits.startsWith('966')) {
    digits = digits.substring(3);
  }

  // Remove leading zero
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // Keep last 9 digits for Saudi mobile matching
  if (digits.length > 9) {
    digits = digits.slice(-9);
  }

  return digits;
}

export function formatSaudiMobile(mobile: string): string {
  const norm = normalizeMobile(mobile);
  if (norm.length === 9) {
    return `+966 ${norm.slice(0, 2)} ${norm.slice(2, 5)} ${norm.slice(5)}`;
  }
  return mobile;
}

export function formatSAR(value: number): string {
  return 'SAR ' + Number(value || 0).toLocaleString('en-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Builds a deterministic boolean array of size `totalDays` where exactly
 * `activeCount` days are true (ordered = ⭐) and the rest are false (missed = 😔).
 * For 30 days, it ensures any recent weekly active days are aligned into the last 7 days.
 */
export function buildDailyOrderMap(
  totalDays: number,
  activeCount: number,
  isWin: boolean,
  seedNumber: number = 42,
  recentWeekActiveCount: number = 0
): boolean[] {
  const clampedCount = Math.max(0, Math.min(totalDays, activeCount));
  
  if (isWin || clampedCount >= totalDays) {
    return Array(totalDays).fill(true);
  }
  if (clampedCount <= 0) {
    return Array(totalDays).fill(false);
  }

  // If 30 days and recentWeekActiveCount is specified, ensure recent week days (last 7 slots: index 23..29) get placed first
  if (totalDays === 30 && recentWeekActiveCount > 0) {
    const res = Array(30).fill(false);
    const weekCount = Math.min(7, Math.min(clampedCount, recentWeekActiveCount));
    
    // Pick slots in the last 7 days (indices 23..29)
    const weekIndices = [23, 24, 25, 26, 27, 28, 29];
    for (let i = weekIndices.length - 1; i > 0; i--) {
      const j = Math.abs((seedNumber * 41 + i * 13 + 5) % (i + 1));
      const temp = weekIndices[i];
      weekIndices[i] = weekIndices[j];
      weekIndices[j] = temp;
    }
    for (let i = 0; i < weekCount; i++) {
      res[weekIndices[i]] = true;
    }

    // Remaining active days to distribute in the earlier 23 days (indices 0..22)
    const remainingCount = clampedCount - weekCount;
    if (remainingCount > 0) {
      const earlierIndices = Array.from({ length: 23 }, (_, i) => i);
      for (let i = earlierIndices.length - 1; i > 0; i--) {
        const j = Math.abs((seedNumber * 37 + i * 19 + 7) % (i + 1));
        const temp = earlierIndices[i];
        earlierIndices[i] = earlierIndices[j];
        earlierIndices[j] = temp;
      }
      for (let i = 0; i < remainingCount && i < earlierIndices.length; i++) {
        res[earlierIndices[i]] = true;
      }
    }
    return res;
  }

  // Deterministically shuffle indices to scatter the active days across the window
  const indices = Array.from({ length: totalDays }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.abs((seedNumber * 37 + i * 19 + 7) % (i + 1));
    const temp = indices[i];
    indices[i] = indices[j];
    indices[j] = temp;
  }

  const selectedIndices = new Set(indices.slice(0, clampedCount));
  return Array.from({ length: totalDays }, (_, i) => selectedIndices.has(i));
}

const APPS_SCRIPT_STORAGE_KEY = 'LUCKY_JACKPOT_APPS_SCRIPT_URL';
const USER_STORAGE_KEY = 'LUCKY_JACKPOT_AUTH_USER';

export const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxjqxe-I26Ouprbd8EW-GHnGze9nTxgJ8kSgdNAJYs9sosnnmCgG3Yu23iKHAw07FmypQ/exec';

export function getStoredUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AppUser | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY);
  } else {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
}

export async function authenticateUser(
  usernameInput: string,
  passwordInput: string,
  customApiUrl?: string
): Promise<LoginResult> {
  const username = String(usernameInput || '').trim();
  const password = String(passwordInput || '').trim();

  if (!username || !password) {
    return { success: false, message: 'Please enter both username and password.' };
  }

  // Built-in verified Master & Staff credentials (guaranteed immediate access on Vercel and offline)
  const demoUsers: Record<string, { pass: string; name: string; role: string; mobile: string }> = {
    'admin': { pass: 'admin123', name: 'Admin Operations', role: 'Administrator', mobile: '0550000001' },
    'luluecom': { pass: 'lulu@2026', name: 'LuLu E-Commerce Team', role: 'Manager', mobile: '0550023188' },
    'cashier1': { pass: '1234', name: 'Al-Riyadh Branch Agent', role: 'Auditor', mobile: '0501112233' },
    'agent': { pass: '1234', name: 'Customer Service Agent', role: 'Agent', mobile: '0512345678' },
  };

  const lowerUser = username.toLowerCase();
  const localMatch = demoUsers[lowerUser];
  const isLocalPassMatch = Boolean(localMatch && localMatch.pass === password);

  // 1. Google Apps Script native environment
  if (
    typeof window !== 'undefined' &&
    (window as unknown as { google?: { script?: { run?: { withSuccessHandler: (s: (data: unknown) => void) => { withFailureHandler: (f: (err: unknown) => void) => { loginUser: (u: string, p: string) => void } } } } } }).google?.script?.run
  ) {
    const google = (window as unknown as { google: { script: { run: { withSuccessHandler: (s: (data: unknown) => void) => { withFailureHandler: (f: (err: unknown) => void) => { loginUser: (u: string, p: string) => void } } } } } }).google;

    return new Promise((resolve) => {
      google.script.run
        .withSuccessHandler((res: unknown) => {
          const data = res as LoginResult;
          if (data && data.success && data.user) {
            setStoredUser(data.user);
            resolve(data);
          } else if (isLocalPassMatch && localMatch) {
            const user: AppUser = {
              username: username,
              name: localMatch.name,
              role: localMatch.role,
              mobile: localMatch.mobile,
            };
            setStoredUser(user);
            resolve({ success: true, user });
          } else {
            resolve({ success: false, message: data?.message || 'Invalid username or password.' });
          }
        })
        .withFailureHandler((_err: unknown) => {
          if (isLocalPassMatch && localMatch) {
            const user: AppUser = {
              username: username,
              name: localMatch.name,
              role: localMatch.role,
              mobile: localMatch.mobile,
            };
            setStoredUser(user);
            resolve({ success: true, user });
          } else {
            resolve({ success: false, message: 'Invalid username or password.' });
          }
        })
        .loginUser(username, password);
    });
  }

  // 2. Direct HTTP API connection to Apps Script Web App
  const webAppUrl = (customApiUrl || getStoredAppsScriptUrl()).trim();
  if (webAppUrl && webAppUrl.startsWith('http')) {
    try {
      const separator = webAppUrl.includes('?') ? '&' : '?';
      const endpoint = `${webAppUrl}${separator}action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as LoginResult;
        if (data && data.success && data.user) {
          setStoredUser(data.user);
          return data;
        }
      }
    } catch (err) {
      console.warn('Apps Script login API check failed, falling back to local credentials:', err);
    }
  }

  // 3. Fallback / Built-in Admin & Staff credentials for offline & Vercel deployment
  if (isLocalPassMatch && localMatch) {
    const user: AppUser = {
      username: username,
      name: localMatch.name,
      role: localMatch.role,
      mobile: localMatch.mobile,
    };
    setStoredUser(user);
    return { success: true, user };
  }

  return {
    success: false,
    message: 'Invalid username or password. (Demo Admin: "admin" / "admin123" | Manager: "luluecom" / "lulu@2026")',
  };
}

export function isAdminUser(user: AppUser | null | undefined): boolean {
  if (!user) return false;
  const role = String(user.role || '').trim().toLowerCase();
  const username = String(user.username || '').trim().toLowerCase();
  // Strictly restricted to Admin/Administrator/Superadmin role or the 'admin' account.
  // Managers, auditors, agents, and cashiers are operational roles and restricted from Admin Settings.
  return role === 'admin' || role === 'administrator' || role === 'superadmin' || username === 'admin';
}

const BANNER_SETTINGS_KEY = 'LUCKY_JACKPOT_BANNER_SETTINGS';

export const DEFAULT_BANNER_SETTINGS: import('../types').BannerSettings = {
  mode: 'animation',
  customVideoUrl: 'https://drive.google.com/file/d/1y0NmZuguM3-10aHofVS1i7FTQsjVx0Sl/view?usp=drive_link',
  autoPlayIntervalMs: 2500,
  showLoopBadge: true,
  videoMuted: false,
  videoLoop: true,
  slides: [
    {
      id: 'slide-1',
      title: 'HOT DEALS & SAVERS',
      subtitle: 'Get Express Groceries in 45-60 Mins',
      tag: '🔥 EXPRESS DEALS',
      accentColor: '#c8102e',
    },
    {
      id: 'slide-2',
      title: 'EXPLORE WIDER CHOICES',
      subtitle: 'Gaming • Electronics • Fresh Fish • Fashion',
      tag: '⭐ 10,000+ PRODUCTS',
      accentColor: '#0284c7',
    },
    {
      id: 'slide-3',
      title: 'FRESHER FINDS DAILY',
      subtitle: 'Fresh Milk, LuLu Rusk, Farm Fruits & Vegetables',
      tag: '🍎 FARM FRESH',
      accentColor: '#15803d',
    },
    {
      id: 'slide-4',
      title: 'ORDER NOW IN MINUTES',
      subtitle: 'Fast delivery straight to your doorstep across KSA',
      tag: '🛵 FAST DELIVERY',
      accentColor: '#b45309',
    },
  ],
};

export function getStoredBannerSettings(): import('../types').BannerSettings {
  if (typeof window === 'undefined') return DEFAULT_BANNER_SETTINGS;
  try {
    const raw = localStorage.getItem(BANNER_SETTINGS_KEY);
    if (!raw) return DEFAULT_BANNER_SETTINGS;
    return { ...DEFAULT_BANNER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BANNER_SETTINGS;
  }
}

export function setStoredBannerSettings(settings: import('../types').BannerSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BANNER_SETTINGS_KEY, JSON.stringify(settings));
}

export function getStoredAppsScriptUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_APPS_SCRIPT_URL;
  const stored = localStorage.getItem(APPS_SCRIPT_STORAGE_KEY);
  if (stored !== null) return stored;
  return DEFAULT_APPS_SCRIPT_URL;
}

export function setStoredAppsScriptUrl(url: string): void {
  if (typeof window === 'undefined') return;
  if (!url) {
    localStorage.setItem(APPS_SCRIPT_STORAGE_KEY, '');
  } else {
    localStorage.setItem(APPS_SCRIPT_STORAGE_KEY, url.trim());
  }
}

// Preset demo accounts for quick testing
export const DEMO_CUSTOMERS: { label: string; mobile: string; desc: string; type: string }[] = [
  { label: '🛒 1 Single Order (0550023188)', mobile: '0550023188', desc: '1 order placed in 30 days (Surprise Gift)', type: 'single' },
  { label: '🏆 Highest Spender (VIP)', mobile: '501112233', desc: 'No.1 Spender in BigQuery (SAR 14,890)', type: 'highest' },
  { label: '⭐ 30-Day Star Champion', mobile: '555444333', desc: 'Ordered all 30 consecutive days (Monthly Win)', type: 'monthly' },
  { label: '🎁 7-Day Weekly Winner', mobile: '512345678', desc: 'Ordered all 7 days this week (Weekly Win)', type: 'weekly' },
  { label: '🛍️ Active Regular Buyer', mobile: '599887766', desc: '22 active days / Surprise gift eligible', type: 'surprise' },
  { label: '🛒 New Customer (0 orders)', mobile: '500000000', desc: 'No prior orders in the last 30 days', type: 'none' },
];

/**
 * Parses order_dates from various possible API response formats.
 * Handles: JSON arrays, stringified JSON arrays, comma-separated strings,
 * BigQuery ARRAY format, and timestamp strings.
 */
function parseOrderDates(data: Record<string, unknown>): string[] | null {
  const rawDates = data.order_dates ?? data.orderDates ?? data.dates ?? data.order_date_list;

  if (!rawDates) return null;

  // Unwraps a single array element which may be:
  // - a plain string: "2026-08-05" or "2026-08-05T00:00:00.000Z"
  // - a BigQuery REST-style wrapper: { v: "2026-08-05" }
  // - a generic wrapper: { value: "2026-08-05" } or { date: "2026-08-05" }
  const unwrap = (item: unknown): string => {
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const inner = obj.v ?? obj.value ?? obj.date ?? obj.date_value;
      if (inner !== undefined && inner !== null) return String(inner).trim();
      return '';
    }
    return String(item ?? '').trim();
  };

  const toIsoDate = (s: string): string => {
    // Extract YYYY-MM-DD from timestamps like "2026-08-05T00:00:00.000Z"
    return s.length >= 10 ? s.substring(0, 10) : s;
  };

  // If already an array of dates (or wrapped date objects)
  if (Array.isArray(rawDates)) {
    const dates = rawDates
      .map((d: unknown) => toIsoDate(unwrap(d)))
      .filter((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d));
    return dates.length > 0 ? dates : null;
  }

  // If it's a single wrapped/plain date object (not an array)
  if (rawDates && typeof rawDates === 'object') {
    const single = toIsoDate(unwrap(rawDates));
    return /^\d{4}-\d{2}-\d{2}$/.test(single) ? [single] : null;
  }

  // If it's a string (stringified JSON array, single date, or comma-separated)
  if (typeof rawDates === 'string') {
    const trimmed = rawDates.trim();
    if (!trimmed) return null;

    // Try JSON parse first
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const dates = parsed
          .map((d: unknown) => toIsoDate(unwrap(d)))
          .filter((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d));
        return dates.length > 0 ? dates : null;
      }
      if (parsed && typeof parsed === 'object') {
        const single = toIsoDate(unwrap(parsed));
        return /^\d{4}-\d{2}-\d{2}$/.test(single) ? [single] : null;
      }
    } catch {
      // Not valid JSON, try comma-separated / single-date below
    }

    // Try comma-separated (with or without brackets/quotes)
    const cleaned = trimmed.replace(/[\[\]"']/g, '');
    if (cleaned.includes(',')) {
      const dates = cleaned
        .split(',')
        .map((d: string) => toIsoDate(d.trim()))
        .filter((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d));
      return dates.length > 0 ? dates : null;
    }

    // Single bare date string, e.g. "2026-08-05" or "2026-08-05T00:00:00.000Z"
    const single = toIsoDate(cleaned.trim());
    if (/^\d{4}-\d{2}-\d{2}$/.test(single)) {
      return [single];
    }
  }

  return null;
}

/**
 * Maps an array of YYYY-MM-DD date strings into 30-day and 7-day boolean arrays
 * aligned to today's calendar. Used for the CalendarSlotGrid component.
 */
/**
 * Returns "today" as a YYYY-MM-DD string in Asia/Riyadh, regardless of the
 * browser's local timezone. The backend's 30-day window and order_date
 * values are all computed via DATE(date_placed, 'Asia/Riyadh'), so the
 * frontend grid must anchor to the same calendar day or dates near the
 * midnight boundary will land in the wrong cell (or fall off the grid
 * entirely) for staff viewing this outside UTC+3.
 */
function getRiyadhDateParts(offsetDays: number): string {
  const now = new Date();
  // en-CA locale formats as YYYY-MM-DD, which is what we need directly.
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayRiyadh = formatter.format(now); // "YYYY-MM-DD" for Riyadh "now"

  // Shift by offsetDays using a UTC-based Date to avoid DST/local drift,
  // since Riyadh has no DST this is a safe, simple day-level shift.
  const [y, m, d] = todayRiyadh.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d));
  shifted.setUTCDate(shifted.getUTCDate() + offsetDays);
  return shifted.toISOString().split('T')[0];
}

function mapOrderDatesToDailyArrays(orderDates: string[]): { daily30: boolean[]; daily7: boolean[] } {
  const orderDateSet = new Set(orderDates);
  const daily30: boolean[] = [];

  for (let i = 29; i >= 0; i--) {
    const yyyyMmDd = getRiyadhDateParts(-i);
    daily30.push(orderDateSet.has(yyyyMmDd));
  }

  const daily7 = daily30.slice(23); // Last 7 days of the 30-day window
  return { daily30, daily7 };
}

export async function fetchCustomerJackpotData(
  rawMobile: string,
  customApiUrl?: string,
  checkedBy?: string
): Promise<CustomerJackpotData> {
  const mobile = normalizeMobile(rawMobile);
  const seed = parseInt(mobile, 10) || 54321;
  const operatorUser = checkedBy || getStoredUser()?.username || 'admin';

  // 1. Direct integration with Google Apps Script environment:
  // (when running natively inside deployed Google Apps Script HtmlService)
  if (
    typeof window !== 'undefined' &&
    (window as unknown as { google?: { script?: { run?: { withSuccessHandler: (s: (data: unknown) => void) => { withFailureHandler: (f: (err: unknown) => void) => { checkCustomer: (m: string, u?: string) => void } } } } } }).google?.script?.run
  ) {
    const google = (window as unknown as { google: { script: { run: { withSuccessHandler: (s: (data: unknown) => void) => { withFailureHandler: (f: (err: unknown) => void) => { checkCustomer: (m: string, u?: string) => void } } } } } }).google;

    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((res: unknown) => {
          const data = res as Record<string, unknown>;
          if (!data || !data.success) {
            reject(new Error(String(data?.message || 'Unable to calculate jackpot.')));
            return;
          }

          const active30Count = Number(data.customerDays30 ?? data.customerActiveDays ?? data.customer_days_30 ?? 0);
          const active7Count = Number(data.customerDays7 ?? data.customer_days_7 ?? 0);
          const isMonthlyWin = Boolean(data.monthly);
          const isWeeklyWin = Boolean(data.weekly);

          // Use real order_dates if the API returned them, otherwise fall back to buildDailyOrderMap
          const gsParsedDates = parseOrderDates(data);
          let daily30: boolean[];
          let daily7: boolean[];
          if (gsParsedDates && gsParsedDates.length > 0) {
            const mapped = mapOrderDatesToDailyArrays(gsParsedDates);
            daily30 = mapped.daily30;
            daily7 = mapped.daily7;
          } else {
            daily30 = buildDailyOrderMap(30, active30Count, isMonthlyWin, seed);
            daily7 = buildDailyOrderMap(7, active7Count, isWeeklyWin, seed + 99);
          }

          const finalDays30 = daily30.filter(Boolean).length;
          const finalDays7 = daily7.filter(Boolean).length;

          resolve({
            highestOrder: Boolean(data.highestOrder),
            monthly: isMonthlyWin,
            weekly: isWeeklyWin,
            any: Boolean(data.any ?? data.anyOrder ?? active30Count > 0),
            customerTotalSpending: Number(data.customerTotalSpending ?? data.customer_total_spending ?? 0),
            highestTotalSpending: Number(data.highestTotalSpending ?? data.highest_total_spending ?? 0),
            customerOrderCount: Number(data.customerOrderCount ?? data.customer_order_count ?? 0),
            customerActiveDays: finalDays30,
            customerDays30: finalDays30,
            customerDays7: finalDays7,
            dailyOrders30: daily30,
            dailyOrders7: daily7,
            mobile: mobile,
            customerName: String(data.customerName || `Customer (+966 ${mobile.slice(0, 2)}***)`),
            vipTier: Number(data.customerTotalSpending || 0) > 5000 ? 'Gold' : Number(data.customerTotalSpending || 0) > 2000 ? 'Silver' : 'Bronze',
            dataSource: 'apps-script-run',
          });
        })
        .withFailureHandler((err: unknown) => {
          const errorMsg = err instanceof Error ? err.message : String(err || 'BigQuery connection failure');
          reject(new Error(errorMsg));
        })
        .checkCustomer(mobile, operatorUser);
    });
  }

  // 2. Direct HTTP API connection to deployed Google Apps Script Web App:
  // (allows live real BigQuery queries right from AI Studio preview or any browser)
  const webAppUrl = (customApiUrl || getStoredAppsScriptUrl()).trim();
  if (webAppUrl && webAppUrl.startsWith('http')) {
    try {
      const separator = webAppUrl.includes('?') ? '&' : '?';
      const endpoint = `${webAppUrl}${separator}mobile=${encodeURIComponent(mobile)}&user=${encodeURIComponent(operatorUser)}&checkedBy=${encodeURIComponent(operatorUser)}&phone=${encodeURIComponent(mobile)}&checkCustomer=${encodeURIComponent(mobile)}&include_dates=true`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Apps Script responded with status: ${response.status}`);
      }

      const text = await response.text();
      let rawData: Record<string, unknown>;
      try {
        rawData = JSON.parse(text) as Record<string, unknown>;
      } catch {
        // If response is HTML (e.g. default doGet serving index.html)
        throw new Error('Apps Script returned HTML instead of JSON. Ensure your doGet(e) returns ContentService.createTextOutput(...) when parameter.mobile is present.');
      }

      // Handle if nested under data or direct object
      const data = (rawData.data && typeof rawData.data === 'object' ? rawData.data : rawData) as Record<string, unknown>;

      if (data.success === false) {
        throw new Error(String(data.message || 'BigQuery query returned no matching data.'));
      }

      const active30Count = Number(
        data.customerDays30 ??
        data.customerActiveDays ??
        data.customer_days_30 ??
        data.customer_active_days ??
        data.active_days_30 ??
        data.days30 ??
        0
      );
      const active7Count = Number(
        data.customerDays7 ??
        data.customer_days_7 ??
        data.active_days_7 ??
        data.days7 ??
        0
      );
      const isMonthlyWin = Boolean(data.monthly ?? active30Count >= 30);
      const isWeeklyWin = Boolean(data.weekly ?? active7Count >= 7);

      const customerSpend = Number(
        data.customerTotalSpending ??
        data.customer_total_spending ??
        data.totalSpending ??
        data.total_spending ??
        data.total_amount ??
        data.amount ??
        data.spending ??
        0
      );
      const highestSpend = Number(
        data.highestTotalSpending ??
        data.highest_total_spending ??
        data.highestSpending ??
        data.highest_spending ??
        14890.50
      );
      const orderCount = Number(
        data.customerOrderCount ??
        data.customer_order_count ??
        data.orderCount ??
        data.orders ??
        data.total_orders ??
        data.order_count ??
        (active30Count > 0 ? active30Count : 0)
      );

      const isHighestWin = Boolean(
        data.highestOrder ??
        data.highest_order ??
        (customerSpend > 0 && customerSpend >= highestSpend)
      );

      // Parse order_dates from various API response formats (JSON array, stringified, comma-separated)
      const parsedOrderDates = parseOrderDates(data);
      let daily30: boolean[];
      let daily7: boolean[];

      if (parsedOrderDates && parsedOrderDates.length > 0) {
        // Real dates from BigQuery — map precisely to 30-day calendar
        const mapped = mapOrderDatesToDailyArrays(parsedOrderDates);
        daily30 = mapped.daily30;
        daily7 = mapped.daily7;
      } else {
        // Fallback: use pre-built boolean arrays or algorithmic placement
        daily30 = Array.isArray(data.dailyOrders30)
          ? (data.dailyOrders30 as boolean[])
          : buildDailyOrderMap(30, active30Count, isMonthlyWin, seed, active7Count);

        daily7 = Array.isArray(data.dailyOrders7) && data.dailyOrders7.length === 7 && Array.isArray(data.dailyOrders30)
          ? (data.dailyOrders7 as boolean[])
          : daily30.slice(23);
      }

      const finalDays7 = daily7.filter(Boolean).length;
      const finalDays30 = daily30.filter(Boolean).length;

      // Extract customer name from customer__first_name and customer__last_name if provided
      // Skip hashed/anonymized names (long hex strings from BigQuery MAX() aggregation)
      const isHashedName = (val: unknown) => {
        const s = String(val || '').trim();
        return s.length > 20 && /^[a-f0-9]+$/i.test(s);
      };

      let derivedName = '';
      if (data.customerName || data.name) {
        const raw = String(data.customerName || data.name);
        derivedName = isHashedName(raw) ? '' : raw;
      } else if (data.customer__first_name || data.customer__last_name) {
        const first = isHashedName(data.customer__first_name) ? '' : String(data.customer__first_name || '');
        const last = isHashedName(data.customer__last_name) ? '' : String(data.customer__last_name || '');
        derivedName = `${first} ${last}`.trim();
      } else if (data.first_name || data.last_name) {
        const first = isHashedName(data.first_name) ? '' : String(data.first_name || '');
        const last = isHashedName(data.last_name) ? '' : String(data.last_name || '');
        derivedName = `${first} ${last}`.trim();
      }

      return {
        highestOrder: isHighestWin,
        monthly: isMonthlyWin,
        weekly: isWeeklyWin,
        any: Boolean(data.any ?? data.anyOrder ?? ((active30Count > 0) || (orderCount > 0))),
        customerTotalSpending: customerSpend,
        highestTotalSpending: highestSpend,
        customerOrderCount: orderCount,
        customerActiveDays: finalDays30,
        customerDays30: finalDays30,
        customerDays7: finalDays7,
        dailyOrders30: daily30,
        dailyOrders7: daily7,
        mobile: mobile,
        customerName: derivedName || `Customer (+966 ${mobile.slice(0, 2)}***)`,
        vipTier: customerSpend > 5000 ? 'Gold' : customerSpend > 2000 ? 'Silver' : 'Bronze',
        dataSource: 'apps-script-api',
      };
    } catch (apiErr) {
      console.warn('Direct Apps Script API fetch failed, falling back to simulator:', apiErr);
      // If user explicitly configured an API URL and it errored, let the user know
      if (customApiUrl) {
        throw new Error(`Failed to query Google Apps Script Web App: ${apiErr instanceof Error ? apiErr.message : String(apiErr)}`);
      }
    }
  }

  // 3. Deterministic & Demo Simulator for standalone/preview environment
  // Simulates real BigQuery query latency (600ms - 1100ms)
  await new Promise((r) => setTimeout(r, 650 + Math.random() * 450));

  // Handle specific customer 0550023188 (1 single order)
  if (mobile === '550023188') {
    const daily30 = buildDailyOrderMap(30, 1, false, 55002, 0);
    const daily7 = daily30.slice(23);
    return {
      highestOrder: false,
      monthly: false,
      weekly: false,
      any: true, // Has placed 1 order in 30 days -> eligible for surprise gift!
      customerTotalSpending: 185.50,
      highestTotalSpending: 14890.50,
      customerOrderCount: 1,
      customerActiveDays: 1,
      customerDays30: 1,
      customerDays7: daily7.filter(Boolean).length,
      dailyOrders30: daily30,
      dailyOrders7: daily7,
      mobile,
      customerName: 'Customer (+966 55 002 3188)',
      vipTier: 'Bronze',
      dataSource: 'demo-simulation',
    };
  }

  if (mobile === '501112233') {
    // Highest Spender VIP
    const daily30 = buildDailyOrderMap(30, 28, false, 111, 6);
    const daily7 = daily30.slice(23);
    return {
      highestOrder: true,
      monthly: false,
      weekly: false,
      any: true,
      customerTotalSpending: 14890.50,
      highestTotalSpending: 14890.50,
      customerOrderCount: 68,
      customerActiveDays: 28,
      customerDays30: 28,
      customerDays7: daily7.filter(Boolean).length,
      dailyOrders30: daily30,
      dailyOrders7: daily7,
      mobile,
      customerName: 'Sheikh Mansoor A. (VIP Diamond)',
      vipTier: 'Diamond',
      dataSource: 'demo-simulation',
    };
  }

  if (mobile === '555444333') {
    // 30-Day Monthly Winner
    const daily30 = buildDailyOrderMap(30, 30, true, 333, 7);
    const daily7 = daily30.slice(23);
    return {
      highestOrder: false,
      monthly: true,
      weekly: true,
      any: true,
      customerTotalSpending: 9420.00,
      highestTotalSpending: 14890.50,
      customerOrderCount: 52,
      customerActiveDays: 30,
      customerDays30: 30,
      customerDays7: 7,
      dailyOrders30: daily30,
      dailyOrders7: daily7,
      mobile,
      customerName: 'Fatima Al-Harbi (Star Champion)',
      vipTier: 'Gold',
      dataSource: 'demo-simulation',
    };
  }

  if (mobile === '512345678') {
    // Weekly Winner
    const daily30 = buildDailyOrderMap(30, 21, false, 555, 7);
    const daily7 = daily30.slice(23);
    return {
      highestOrder: false,
      monthly: false,
      weekly: true,
      any: true,
      customerTotalSpending: 4180.75,
      highestTotalSpending: 14890.50,
      customerOrderCount: 26,
      customerActiveDays: 21,
      customerDays30: 21,
      customerDays7: 7,
      dailyOrders30: daily30,
      dailyOrders7: daily7,
      mobile,
      customerName: 'Khalid Al-Otaibi',
      vipTier: 'Silver',
      dataSource: 'demo-simulation',
    };
  }

  if (mobile === '500000000') {
    // Zero Orders
    const daily30 = buildDailyOrderMap(30, 0, false, 777, 0);
    const daily7 = daily30.slice(23);
    return {
      highestOrder: false,
      monthly: false,
      weekly: false,
      any: false,
      customerTotalSpending: 0,
      highestTotalSpending: 14890.50,
      customerOrderCount: 0,
      customerActiveDays: 0,
      customerDays30: 0,
      customerDays7: 0,
      dailyOrders30: daily30,
      dailyOrders7: daily7,
      mobile,
      customerName: 'New Shopper',
      vipTier: 'Bronze',
      dataSource: 'demo-simulation',
    };
  }

  // Algorithmic profile based on phone number hash
  const num = parseInt(mobile.slice(-4), 10) || 5432;
  const isVip = num % 11 === 0;
  const activeDays30 = Math.min(30, Math.max(1, (num % 28) + 2));
  const activeDays7 = Math.min(7, Math.min(activeDays30, num % 8));
  const spend = Number(((num * 1.85) + 320).toFixed(2));
  const orders = Math.max(1, Math.floor(activeDays30 * 1.3));

  const monthWins = activeDays30 === 30;
  const weekWins = activeDays7 === 7;

  const daily30 = buildDailyOrderMap(30, activeDays30, monthWins, num, activeDays7);
  const daily7 = daily30.slice(23);
  const actualDays7 = daily7.filter(Boolean).length;
  const actualDays30 = daily30.filter(Boolean).length;

  return {
    highestOrder: isVip,
    monthly: monthWins,
    weekly: weekWins,
    any: spend > 0,
    customerTotalSpending: spend,
    highestTotalSpending: Math.max(14890.50, spend + 1200),
    customerOrderCount: orders,
    customerActiveDays: actualDays30,
    customerDays30: actualDays30,
    customerDays7: actualDays7,
    dailyOrders30: daily30,
    dailyOrders7: daily7,
    mobile,
    customerName: `Customer (+966 ${mobile.slice(0, 2)}***)`,
    vipTier: spend > 5000 ? 'Gold' : spend > 2000 ? 'Silver' : 'Bronze',
    dataSource: 'demo-simulation',
  };
}
