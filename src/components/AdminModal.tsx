import React, { useState, useEffect } from 'react';
import { AppUser, BannerSettings, BannerDisplayMode, CustomerJackpotData } from '../types';
import {
  authenticateUser,
  isAdminUser,
  setStoredUser,
  setStoredAppsScriptUrl,
  setStoredBannerSettings,
  fetchCustomerJackpotData,
  formatSAR,
} from '../utils/customerService';
import { PromoVideoBanner } from './PromoVideoBanner';
import {
  Settings,
  Shield,
  Lock,
  User,
  Film,
  Database,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Copy,
  Check,
  RotateCw,
  Sparkles,
  Sliders,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  Play,
  Layers,
  FileCode,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onUserUpdate: (user: AppUser | null) => void;
  appsScriptUrl: string;
  onAppsScriptUrlChange: (newUrl: string) => void;
  bannerSettings: BannerSettings;
  onBannerSettingsChange: (newSettings: BannerSettings) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  appsScriptUrl,
  onAppsScriptUrlChange,
  bannerSettings,
  onBannerSettingsChange,
}) => {
  const [activeTab, setActiveTab] = useState<'banner' | 'bigquery' | 'users' | 'queryTester'>('banner');

  // Admin Login State (if not already admin)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // BigQuery URL state
  const [urlInput, setUrlInput] = useState(appsScriptUrl);
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [urlTestResult, setUrlTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Banner settings local editor state
  const [localBannerSettings, setLocalBannerSettings] = useState<BannerSettings>(bannerSettings);
  const [bannerSaveSuccess, setBannerSaveSuccess] = useState(false);

  // Query Tester State
  const [testMobileInput, setTestMobileInput] = useState('0550023188');
  const [isTestingQuery, setIsTestingQuery] = useState(false);
  const [queryTestResult, setQueryTestResult] = useState<CustomerJackpotData | null>(null);
  const [queryTestError, setQueryTestError] = useState<string | null>(null);

  // Sync prop changes
  useEffect(() => {
    if (isOpen) {
      setUrlInput(appsScriptUrl);
      setLocalBannerSettings(bannerSettings);
      setLoginError(null);
      setUrlTestResult(null);
      setBannerSaveSuccess(false);
    }
  }, [isOpen, appsScriptUrl, bannerSettings]);

  if (!isOpen) return null;

  const isUserAdmin = isAdminUser(currentUser);

  // Handle Admin Login submission
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both Admin username and password.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const result = await authenticateUser(loginUsername, loginPassword, appsScriptUrl);
      if (result.success && result.user) {
        if (isAdminUser(result.user)) {
          onUserUpdate(result.user);
          setLoginUsername('');
          setLoginPassword('');
        } else {
          setLoginError(
            `Access Denied: Account '${result.user.username}' has role '${result.user.role || 'User'}'. Admin Settings are restricted strictly to users with the 'Admin' or 'Administrator' role.`
          );
        }
      } else {
        setLoginError(result.message || 'Invalid admin credentials.');
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle BigQuery URL Test & Save
  const handleSaveAndTestUrl = async () => {
    const trimmed = urlInput.trim();
    setIsTestingUrl(true);
    setUrlTestResult(null);

    try {
      if (!trimmed) {
        setStoredAppsScriptUrl('');
        onAppsScriptUrlChange('');
        setUrlTestResult({
          success: true,
          message: 'Saved in offline simulation mode.',
        });
        return;
      }

      if (!trimmed.startsWith('https://script.google.com/macros/s/')) {
        setUrlTestResult({
          success: false,
          message: 'Invalid URL format',
          details: 'The URL must start with "https://script.google.com/macros/s/.../exec"',
        });
        return;
      }

      const testResult = await fetchCustomerJackpotData('0550023188', trimmed);
      setStoredAppsScriptUrl(trimmed);
      onAppsScriptUrlChange(trimmed);

      setUrlTestResult({
        success: true,
        message: '🟢 BigQuery & Google Apps Script Connection Verified!',
        details: `Verified response for 0550023188: Spending SAR ${testResult.customerTotalSpending}, Orders: ${testResult.customerOrderCount}, Source: ${testResult.dataSource}`,
      });
    } catch (err) {
      setUrlTestResult({
        success: false,
        message: 'Could not connect to Google Apps Script Web App',
        details: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsTestingUrl(false);
    }
  };

  // Handle Banner Settings Save
  const handleSaveBannerSettings = () => {
    setStoredBannerSettings(localBannerSettings);
    onBannerSettingsChange(localBannerSettings);
    setBannerSaveSuccess(true);
    setTimeout(() => setBannerSaveSuccess(false), 3000);
  };

  // Handle Query Tester
  const handleRunQueryTest = async () => {
    if (!testMobileInput.trim()) return;
    setIsTestingQuery(true);
    setQueryTestError(null);
    setQueryTestResult(null);

    try {
      const data = await fetchCustomerJackpotData(testMobileInput, appsScriptUrl);
      setQueryTestResult(data);
    } catch (err) {
      setQueryTestError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsTestingQuery(false);
    }
  };

  const appsScriptCodeSnippet = `/**
 * LuLu Jackpot Engine - Google Apps Script (Code.gs)
 * BigQuery Integration with Reduced Schema:
 * - amount: FLOAT64
 * - date_placed: TIMESTAMP
 * - number: INT64
 * - shipping_address_phone_number: INT64
 * - customer__email: STRING
 * - customer__first_name: STRING
 * - customer__last_name: STRING
 * - shipping_address_city_name: STRING
 * - status: STRING
 */

// Replace with your GCP Project ID and Dataset/Table
const BIGQUERY_PROJECT_ID = 'YOUR_GCP_PROJECT_ID';
const BIGQUERY_TABLE = '\`YOUR_PROJECT.YOUR_DATASET.orders\`';

function doGet(e) {
  // 1. API: Login verification from 'Users' sheet
  if (e && e.parameter && e.parameter.action === 'login') {
    try {
      const username = e.parameter.username || '';
      const password = e.parameter.password || '';
      const result = verifyUserFromSheet(username, password);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, message: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 2. API: Jackpot Customer Check from BigQuery
  if (e && e.parameter && (e.parameter.mobile || e.parameter.checkCustomer)) {
    try {
      const rawMobile = e.parameter.mobile || e.parameter.checkCustomer;
      const result = checkCustomerJackpot(rawMobile);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, message: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return HtmlService.createHtmlOutput('<h3>LuLu Jackpot BigQuery Web App is Running</h3>');
}

/**
 * Queries BigQuery for the given customer phone number using the reduced schema
 */
function checkCustomerJackpot(rawMobile) {
  // Normalize phone number (keep last 9 digits for Saudi numbers)
  let cleanMobile = String(rawMobile || '').replace(/\\D/g, '');
  if (cleanMobile.startsWith('966')) cleanMobile = cleanMobile.substring(3);
  if (cleanMobile.startsWith('0')) cleanMobile = cleanMobile.substring(1);
  if (cleanMobile.length > 9) cleanMobile = cleanMobile.slice(-9);

  // BigQuery SQL query using the 9 schema columns
  const sql = \`
    WITH filtered_orders AS (
      SELECT
        number,
        amount,
        date_placed,
        shipping_address_phone_number,
        customer__first_name,
        customer__last_name,
        customer__email,
        status,
        -- Extract date and last 9 digits of phone
        DATE(date_placed) AS order_date,
        RIGHT(CAST(shipping_address_phone_number AS STRING), 9) AS phone_9
      FROM \${BIGQUERY_TABLE}
      WHERE 
        date_placed >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
        AND (status IS NULL OR LOWER(status) NOT IN ('cancelled', 'refunded', 'failed'))
    ),
    all_spenders AS (
      SELECT
        phone_9,
        SUM(amount) AS total_spent
      FROM filtered_orders
      GROUP BY phone_9
    ),
    highest_benchmark AS (
      SELECT COALESCE(MAX(total_spent), 14890.50) AS max_spend FROM all_spenders
    ),
    customer_summary AS (
      SELECT
        phone_9,
        MAX(CONCAT(COALESCE(customer__first_name, ''), ' ', COALESCE(customer__last_name, ''))) AS customer_name,
        SUM(amount) AS total_spending,
        COUNT(DISTINCT number) AS total_orders,
        COUNT(DISTINCT order_date) AS days_30,
        COUNT(DISTINCT CASE 
          WHEN date_placed >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY) 
          THEN order_date 
        END) AS days_7,
        -- Array of all distinct order dates in YYYY-MM-DD
        ARRAY_AGG(DISTINCT CAST(order_date AS STRING)) AS order_dates
      FROM filtered_orders
      WHERE phone_9 = '\${cleanMobile}'
      GROUP BY phone_9
    )
    SELECT
      c.customer_name,
      COALESCE(c.total_spending, 0) AS customerTotalSpending,
      COALESCE(c.total_orders, 0) AS customerOrderCount,
      COALESCE(c.days_30, 0) AS customerDays30,
      COALESCE(c.days_7, 0) AS customerDays7,
      b.max_spend AS highestTotalSpending,
      c.order_dates
    FROM highest_benchmark b
    LEFT JOIN customer_summary c ON TRUE
  \`;

  const request = {
    query: sql,
    useLegacySql: false
  };

  const queryResults = BigQuery.Jobs.query(request, BIGQUERY_PROJECT_ID);
  const rows = queryResults.rows;

  if (!rows || rows.length === 0 || !rows[0].f[0].v) {
    return {
      success: true,
      customerName: 'Customer (+966 ' + cleanMobile + ')',
      customerTotalSpending: 0,
      highestTotalSpending: 14890.50,
      customerOrderCount: 0,
      customerDays30: 0,
      customerDays7: 0,
      highestOrder: false,
      monthly: false,
      weekly: false,
      any: false,
    };
  }

  const f = rows[0].f;
  const name = f[0].v || ('Customer (+966 ' + cleanMobile + ')');
  const spending = parseFloat(f[1].v || '0');
  const orderCount = parseInt(f[2].v || '0', 10);
  const days30 = parseInt(f[3].v || '0', 10);
  const days7 = parseInt(f[4].v || '0', 10);
  const highestSpend = parseFloat(f[5].v || '14890.50');

  return {
    success: true,
    customerName: name.trim() || ('Customer (+966 ' + cleanMobile + ')'),
    customerTotalSpending: spending,
    highestTotalSpending: highestSpend,
    customerOrderCount: orderCount,
    customerDays30: days30,
    customerDays7: days7,
    highestOrder: spending > 0 && spending >= highestSpend,
    monthly: days30 >= 30,
    weekly: days7 >= 7,
    any: days30 > 0 || orderCount > 0,
  };
}

function verifyUserFromSheet(username, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users') || ss.getSheets()[0];
  const data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    var u = String(data[i][0] || '').trim().toLowerCase();
    var p = String(data[i][1] || '').trim();
    var name = String(data[i][2] || data[i][0] || 'User');
    var role = String(data[i][3] || 'Agent').trim();
    var mob = String(data[i][4] || '');

    if (u === String(username).toLowerCase() && p === password) {
      return {
        success: true,
        user: { username: u, name: name, role: role, mobile: mob }
      };
    }
  }
  return { success: false, message: 'Invalid username or password in spreadsheet.' };
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0d1222] border-2 border-amber-500/40 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#171d33] via-[#12172a] to-[#171d33] border-b border-amber-500/25 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(255,215,0,0.25)]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                  Admin Control Center
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase">
                  Spreadsheet &amp; BigQuery Admin
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Manage BigQuery sync, promotional banner display mode, and spreadsheet security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUserAdmin && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin: {currentUser?.name || currentUser?.username}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Close Admin Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ADMIN AUTHENTICATION GATE (Shown if user is not an Admin) */}
        {!isUserAdmin ? (
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center flex-1 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-400/40 flex items-center justify-center text-amber-300 mb-4 shadow-[0_0_30px_rgba(255,215,0,0.2)]">
              <Lock className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white uppercase tracking-tight">
              Admin Access Required
            </h3>
            <p className="text-sm text-gray-300 mt-1 max-w-md">
              Enter your Administrator credentials. Authentication is verified directly from the{' '}
              <strong className="text-amber-300">Users</strong> tab in your Google Spreadsheet.
            </p>

            <form onSubmit={handleAdminLogin} className="w-full max-w-sm mt-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-200/90 mb-1">
                  Admin Username / ID
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-amber-400" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="e.g. admin or luluecom"
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 focus:border-amber-400 text-white text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-200/90 mb-1">
                  Admin Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-amber-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 focus:border-amber-400 text-white text-sm outline-none transition-all"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>{loginError}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-gray-950 font-black text-sm uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(255,215,0,0.3)] cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying with Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Unlock Admin Panel</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-gray-500">
                Default offline demo: username <code className="text-amber-300">admin</code> / password <code className="text-amber-300">admin123</code>
              </div>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN CONTENT WITH TABS */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* TABS NAVIGATION */}
            <div className="flex items-center gap-1 sm:gap-2 px-4 pt-3 border-b border-white/10 bg-[#090d18] overflow-x-auto">
              <button
                onClick={() => setActiveTab('banner')}
                className={`px-3.5 py-2 rounded-t-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'banner'
                    ? 'bg-[#131a30] text-amber-300 border-t-2 border-amber-400 shadow'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Banner &amp; Video / Carousel</span>
              </button>

              <button
                onClick={() => setActiveTab('bigquery')}
                className={`px-3.5 py-2 rounded-t-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'bigquery'
                    ? 'bg-[#131a30] text-amber-300 border-t-2 border-amber-400 shadow'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>BigQuery Connection &amp; API</span>
              </button>

              <button
                onClick={() => setActiveTab('queryTester')}
                className={`px-3.5 py-2 rounded-t-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'queryTester'
                    ? 'bg-[#131a30] text-amber-300 border-t-2 border-amber-400 shadow'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Query Tester Sandbox</span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`px-3.5 py-2 rounded-t-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'bg-[#131a30] text-amber-300 border-t-2 border-amber-400 shadow'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Spreadsheet Role Matrix</span>
              </button>
            </div>

            {/* TAB BODY */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0c1020]">
              {/* TAB 1: BANNER & VIDEO / CAROUSEL SETTINGS */}
              {activeTab === 'banner' && (
                <div className="space-y-6">
                  {/* Mode Selector */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
                    <label className="block text-xs font-black uppercase tracking-wider text-amber-300 mb-2">
                      Select Promo Banner Display Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Option 1: Animated Reel */}
                      <div
                        onClick={() => setLocalBannerSettings({ ...localBannerSettings, mode: 'animation' })}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          localBannerSettings.mode === 'animation'
                            ? 'bg-amber-500/15 border-amber-400 text-white ring-2 ring-amber-400/40 shadow-lg'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base font-black">⚡ Kinetic Animation</span>
                          {localBannerSettings.mode === 'animation' && (
                            <CheckCircle2 className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          6-Scene animated LuLu commercial with scooter delivery, grocery finds &amp; app callout.
                        </p>
                      </div>

                      {/* Option 2: Custom Video File / URL */}
                      <div
                        onClick={() => setLocalBannerSettings({ ...localBannerSettings, mode: 'video' })}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          localBannerSettings.mode === 'video'
                            ? 'bg-amber-500/15 border-amber-400 text-white ring-2 ring-amber-400/40 shadow-lg'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base font-black">📹 Direct Video URL</span>
                          {localBannerSettings.mode === 'video' && (
                            <CheckCircle2 className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          Stream an external MP4/WebM video in a continuous loop in the banner.
                        </p>
                      </div>

                      {/* Option 3: Deals & Offers Carousel */}
                      <div
                        onClick={() => setLocalBannerSettings({ ...localBannerSettings, mode: 'carousel' })}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          localBannerSettings.mode === 'carousel'
                            ? 'bg-amber-500/15 border-amber-400 text-white ring-2 ring-amber-400/40 shadow-lg'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base font-black">🖼️ Deals Carousel</span>
                          {localBannerSettings.mode === 'carousel' && (
                            <CheckCircle2 className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          Multi-slide promotional carousel with custom offers, tags, colors, and timing.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mode-Specific Settings */}
                  {localBannerSettings.mode === 'video' && (
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                      <label className="block text-xs font-black uppercase tracking-wider text-amber-300">
                        Custom Video Stream URL (.mp4 / .webm or Google Drive Link)
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          value={localBannerSettings.customVideoUrl}
                          onChange={(e) =>
                            setLocalBannerSettings({ ...localBannerSettings, customVideoUrl: e.target.value })
                          }
                          placeholder="https://drive.google.com/file/d/.../view or https://example.com/promo.mp4"
                          className="flex-1 px-3 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-white text-xs sm:text-sm font-mono outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setLocalBannerSettings({
                              ...localBannerSettings,
                              mode: 'video',
                              customVideoUrl: 'https://drive.google.com/file/d/1y0NmZuguM3-10aHofVS1i7FTQsjVx0Sl/view?usp=drive_link',
                            })
                          }
                          className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold whitespace-nowrap cursor-pointer"
                          title="Use provided Google Drive Promo Video"
                        >
                          Use Google Drive Video
                        </button>
                      </div>

                      {/* Video Audio & Loop Defaults */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">Default Video Audio</span>
                            <span className="text-[10px] text-gray-400">Audio can also be toggled anytime on banner</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setLocalBannerSettings({
                                ...localBannerSettings,
                                videoMuted: !localBannerSettings.videoMuted,
                              })
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                              !localBannerSettings.videoMuted
                                ? 'bg-emerald-500 text-black font-black'
                                : 'bg-red-500/30 text-red-300 border border-red-500/50'
                            }`}
                          >
                            {!localBannerSettings.videoMuted ? '🔊 Sound ON' : '🔇 Muted'}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">Continuous Video Loop</span>
                            <span className="text-[10px] text-emerald-400 font-semibold">Enabled (Infinite Replay)</span>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold">
                            🔁 Always Active
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Continuous Loop &amp; Audio Toggle Active!</span>
                        </div>
                        <p className="text-gray-300">
                          The video will seamlessly loop infinitely with zero pause. Viewers can click the <strong>AUDIO ON / MUTED</strong> toggle button directly on the banner to listen to the promotional audio anytime.
                        </p>
                      </div>
                    </div>
                  )}

                  {localBannerSettings.mode === 'carousel' && (
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-wider text-amber-300">
                          Carousel Slides &amp; Speed
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Auto-Slide Speed:</span>
                          <select
                            value={localBannerSettings.autoPlayIntervalMs}
                            onChange={(e) =>
                              setLocalBannerSettings({
                                ...localBannerSettings,
                                autoPlayIntervalMs: Number(e.target.value),
                              })
                            }
                            className="bg-black/80 border border-white/20 rounded-lg px-2 py-1 text-xs text-amber-300"
                          >
                            <option value={1500}>Fast (1.5s)</option>
                            <option value={2500}>Normal (2.5s)</option>
                            <option value={4000}>Slow (4.0s)</option>
                          </select>
                        </div>
                      </div>

                      {/* Slides list */}
                      <div className="space-y-2.5">
                        {localBannerSettings.slides.map((slide, idx) => (
                          <div
                            key={slide.id || idx}
                            className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row gap-2 items-center"
                          >
                            <span className="text-xs font-black text-amber-400 px-2 py-1 rounded bg-black/40">
                              #{idx + 1}
                            </span>
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(e) => {
                                const next = [...localBannerSettings.slides];
                                next[idx].title = e.target.value;
                                setLocalBannerSettings({ ...localBannerSettings, slides: next });
                              }}
                              placeholder="Slide Title (e.g. HOT DEALS)"
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs"
                            />
                            <input
                              type="text"
                              value={slide.subtitle}
                              onChange={(e) => {
                                const next = [...localBannerSettings.slides];
                                next[idx].subtitle = e.target.value;
                                setLocalBannerSettings({ ...localBannerSettings, slides: next });
                              }}
                              placeholder="Subtitle"
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs"
                            />
                            <input
                              type="text"
                              value={slide.tag}
                              onChange={(e) => {
                                const next = [...localBannerSettings.slides];
                                next[idx].tag = e.target.value;
                                setLocalBannerSettings({ ...localBannerSettings, slides: next });
                              }}
                              placeholder="Tag (e.g. 50% OFF)"
                              className="w-28 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Live Preview Window */}
                  <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col items-center">
                    <span className="text-xs font-black text-amber-300/80 uppercase tracking-widest mb-2">
                      Live Banner Preview (as shown to customers on home screen)
                    </span>
                    <PromoVideoBanner settings={localBannerSettings} />
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center justify-between pt-2">
                    {bannerSaveSuccess ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Banner Settings Saved &amp; Live on Home Screen!
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Changes apply immediately to all visitors</span>
                    )}

                    <button
                      onClick={handleSaveBannerSettings}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-gray-950 font-black text-xs uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(255,215,0,0.3)] cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Save Banner Configuration
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: BIGQUERY & GOOGLE APPS SCRIPT CONNECTION */}
              {activeTab === 'bigquery' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <label className="block text-xs font-black uppercase tracking-wider text-amber-300">
                      Google Apps Script Web App Endpoint URL
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className="flex-1 px-3 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-white text-xs sm:text-sm font-mono outline-none focus:border-amber-400"
                      />
                      <button
                        onClick={handleSaveAndTestUrl}
                        disabled={isTestingUrl}
                        className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {isTestingUrl ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Database className="w-4 h-4" />
                        )}
                        <span>{isTestingUrl ? 'Pinging BigQuery...' : 'Save & Test Connection'}</span>
                      </button>
                    </div>

                    {urlTestResult && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                          urlTestResult.success
                            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                            : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                        }`}
                      >
                        {urlTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold">{urlTestResult.message}</div>
                          {urlTestResult.details && (
                            <div className="text-[11px] opacity-90 mt-0.5 font-mono">
                              {urlTestResult.details}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Code Snippet Box */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <FileCode className="w-4 h-4" />
                        Google Apps Script Code.gs (BigQuery + Users Handler)
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(appsScriptCodeSnippet);
                          setCopiedScript(true);
                          setTimeout(() => setCopiedScript(false), 2500);
                        }}
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedScript ? 'Copied!' : 'Copy Code.gs'}</span>
                      </button>
                    </div>

                    <pre className="p-3 rounded-xl bg-black/80 border border-white/10 text-emerald-300 text-[11px] font-mono overflow-x-auto max-h-52">
                      {appsScriptCodeSnippet}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 3: QUERY TESTER SANDBOX */}
              {activeTab === 'queryTester' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <label className="block text-xs font-black uppercase tracking-wider text-amber-300">
                      Test Live Mobile Query with BigQuery
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={testMobileInput}
                        onChange={(e) => setTestMobileInput(e.target.value)}
                        placeholder="e.g. 0550023188"
                        className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-white text-sm font-mono outline-none"
                      />
                      <button
                        onClick={handleRunQueryTest}
                        disabled={isTestingQuery}
                        className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {isTestingQuery ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        <span>Fetch BigQuery Metrics</span>
                      </button>
                    </div>
                  </div>

                  {queryTestResult && (
                    <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 text-xs">
                      <div className="text-emerald-300 font-bold text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        BigQuery Customer Record Retrieved Successfully
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                        <div className="p-2 rounded-lg bg-black/40 border border-white/10">
                          <span className="text-gray-400 text-[10px]">Total Spending</span>
                          <div className="font-bold text-amber-300">{formatSAR(queryTestResult.customerTotalSpending)}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-black/40 border border-white/10">
                          <span className="text-gray-400 text-[10px]">30-Day Orders</span>
                          <div className="font-bold text-cyan-300">{queryTestResult.customerActiveDays} / 30 Days</div>
                        </div>
                        <div className="p-2 rounded-lg bg-black/40 border border-white/10">
                          <span className="text-gray-400 text-[10px]">7-Day Orders</span>
                          <div className="font-bold text-purple-300">{queryTestResult.customerDays7} / 7 Days</div>
                        </div>
                        <div className="p-2 rounded-lg bg-black/40 border border-white/10">
                          <span className="text-gray-400 text-[10px]">Highest Spender Win</span>
                          <div className="font-bold text-emerald-300">{queryTestResult.highestOrder ? 'YES 🏆' : 'NO ✕'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {queryTestError && (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
                      {queryTestError}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SPREADSHEET USER ROLE MATRIX */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                    <h4 className="text-sm font-black text-amber-300 uppercase">
                      How Username &amp; Password are Managed in Google Spreadsheet
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      All login credentials and permissions are stored inside the <code className="text-amber-300 font-bold">Users</code> sheet in your Google Spreadsheet. The Google Apps Script verifies credentials securely on each sign-in.
                    </p>

                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs border border-white/10 rounded-lg overflow-hidden">
                        <thead className="bg-[#171e35] text-amber-300 font-black uppercase text-[10px]">
                          <tr>
                            <th className="p-2 border-b border-white/10">Username</th>
                            <th className="p-2 border-b border-white/10">Password</th>
                            <th className="p-2 border-b border-white/10">Name</th>
                            <th className="p-2 border-b border-white/10">Role</th>
                            <th className="p-2 border-b border-white/10">Permission</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300 font-mono text-[11px]">
                          <tr className="bg-amber-500/10">
                            <td className="p-2 font-bold text-white">admin</td>
                            <td className="p-2 text-gray-400">••••••••</td>
                            <td className="p-2">Operations Admin</td>
                            <td className="p-2 text-amber-300 font-bold">Admin</td>
                            <td className="p-2 text-emerald-400">Full Access (Admin Panel + BigQuery Config)</td>
                          </tr>
                          <tr className="bg-white/5">
                            <td className="p-2 font-bold text-white">luluecom</td>
                            <td className="p-2 text-gray-400">••••••••</td>
                            <td className="p-2">LuLu E-Commerce Manager</td>
                            <td className="p-2 text-cyan-300 font-bold">Manager</td>
                            <td className="p-2 text-gray-300">Operator Access (Customer Scanner &amp; Logs; Admin Settings Restricted)</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold text-white">cashier1</td>
                            <td className="p-2 text-gray-400">••••••••</td>
                            <td className="p-2">Al-Riyadh Branch Agent</td>
                            <td className="p-2 text-cyan-300">Auditor / Agent</td>
                            <td className="p-2 text-gray-400">Operator Only (Check customer luck)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Current Logged-in Operator</div>
                      <div className="text-xs text-amber-300">
                        {currentUser?.name || currentUser?.username} ({currentUser?.role || 'Administrator'})
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setStoredUser(null);
                        onUserUpdate(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Lock &amp; Logout Admin</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
