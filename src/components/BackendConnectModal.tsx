import React, { useState, useEffect } from 'react';
import { getStoredAppsScriptUrl, setStoredAppsScriptUrl, fetchCustomerJackpotData } from '../utils/customerService';
import { Link2, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, X, Database, Sparkles } from 'lucide-react';

interface BackendConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (url: string) => void;
}

export const BackendConnectModal: React.FC<BackendConnectModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const [url, setUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrl(getStoredAppsScriptUrl());
      setTestStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setStoredAppsScriptUrl('');
      setTestStatus({
        success: true,
        message: 'Saved in offline simulation mode.',
      });
      if (onConnected) onConnected('');
      return;
    }

    if (!trimmed.startsWith('https://script.google.com/macros/s/')) {
      setTestStatus({
        success: false,
        message: 'Invalid URL format',
        details: 'The URL must start with "https://script.google.com/macros/s/.../exec"',
      });
      return;
    }

    setIsTesting(true);
    setTestStatus(null);

    try {
      // Test by querying a sample mobile number through the Web App URL
      const testMobile = '0550023188';
      const result = await fetchCustomerJackpotData(testMobile, trimmed);
      setStoredAppsScriptUrl(trimmed);
      setTestStatus({
        success: true,
        message: '🟢 Successfully connected to BigQuery!',
        details: `Verified with 0550023188 -> Spending: SAR ${result.customerTotalSpending}, Orders: ${result.customerOrderCount}, Active 30d: ${result.customerDays30}`,
      });
      if (onConnected) onConnected(trimmed);
    } catch (err) {
      setTestStatus({
        success: false,
        message: 'Could not connect to Google Apps Script Web App',
        details: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const appsScriptSnippet = `/**
 * Update your Code.gs doGet(e) to support real live queries:
 */
function doGet(e) {
  // If called as API endpoint with ?mobile=550023188
  if (e && e.parameter && (e.parameter.mobile || e.parameter.checkCustomer)) {
    try {
      const mobile = e.parameter.mobile || e.parameter.checkCustomer;
      const result = checkCustomer(mobile);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, message: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Default: Serve Web UI
  return HtmlService
    .createTemplateFromFile('index')
    .evaluate()
    .setTitle('Lucky Customer Jackpot')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}`;

  const copySnippet = () => {
    navigator.clipboard.writeText(appsScriptSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0d1120] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-gray-950 font-black shadow-[0_0_20px_rgba(255,215,0,0.4)]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Connect Real BigQuery Backend
            </h3>
            <p className="text-xs text-amber-300/80">
              Live Google Apps Script &bull; Project: <code className="text-amber-200 font-mono">myecomlulu.jackpot.order_jackpot</code>
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-gray-200 space-y-2 mb-6">
          <p className="font-semibold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Why connect a Web App URL?
          </p>
          <p className="leading-relaxed">
            When running in this browser preview, the app needs the URL of your deployed Google Apps Script Web App to execute BigQuery queries in real time.
          </p>
        </div>

        {/* Input URL */}
        <div className="space-y-2 mb-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
            Deployed Google Apps Script Web App URL:
          </label>
          <div className="relative flex items-center">
            <Link2 className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-amber-500/40 focus:border-amber-400 text-white font-mono text-xs sm:text-sm outline-none transition-all placeholder:text-gray-600"
            />
          </div>
          <p className="text-[11px] text-gray-400">
            Obtained from Apps Script &gt; <strong>Deploy</strong> &gt; <strong>Manage deployments</strong> &gt; <strong>Web app URL</strong> (Access: Anyone).
          </p>
        </div>

        {/* Test / Save Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleSaveAndTest}
            disabled={isTesting}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-gray-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_5px_20px_rgba(255,215,0,0.3)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isTesting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-gray-950" />
                Save &amp; Test Live BigQuery
              </>
            )}
          </button>

          {url && (
            <button
              onClick={() => {
                setUrl('');
                setStoredAppsScriptUrl('');
                setTestStatus({
                  success: true,
                  message: 'Switched to offline preview simulation mode.',
                });
                if (onConnected) onConnected('');
              }}
              className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Test Result Message */}
        {testStatus && (
          <div
            className={`p-3.5 rounded-xl border text-xs mb-6 ${
              testStatus.success
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="font-bold flex items-center gap-2">
              {testStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span>{testStatus.message}</span>
            </div>
            {testStatus.details && (
              <div className="mt-1 text-[11px] text-gray-300 font-mono">
                {testStatus.details}
              </div>
            )}
          </div>
        )}

        {/* Step-by-step Apps Script configuration snippet */}
        <div className="border-t border-white/10 pt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Step: Enable JSON in Apps Script <code className="text-amber-300">Code.gs</code>
            </span>
            <button
              onClick={copySnippet}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-amber-300 font-bold transition-all cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied!' : 'Copy Snippet'}
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-black/80 border border-white/10 text-[11px] text-amber-200/90 font-mono overflow-x-auto max-h-48 leading-relaxed">
            {appsScriptSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
