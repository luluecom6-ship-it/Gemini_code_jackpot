import React, { useState } from 'react';
import { AppUser } from '../types';
import { authenticateUser } from '../utils/customerService';
import { Lock, User, Sparkles, Shield, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: AppUser) => void;
  appsScriptUrl: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  appsScriptUrl,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in both username and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authenticateUser(username, password, appsScriptUrl);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setError(result.message || 'Invalid username or password.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-[#050811] via-[#090e1c] to-[#04060c] overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(255,215,0,0.2)]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            LuLu E-Commerce Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-tight">
            Jackpot Operator Login
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Sign in to check customer eligibility &amp; track audit logs
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0c1020]/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-200/90">
                Username / Agent ID
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-amber-400 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. luluecom or admin"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 bg-black/60 border border-amber-500/30 focus:border-amber-400 text-white rounded-xl text-sm font-medium outline-none transition-all placeholder:text-gray-600 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-200/90">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-amber-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 bg-black/60 border border-amber-500/30 focus:border-amber-400 text-white rounded-xl text-sm font-medium outline-none transition-all placeholder:text-gray-600 focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-white p-1 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-gray-950 font-black text-sm uppercase tracking-wider transition-all shadow-[0_10px_30px_rgba(255,215,0,0.3)] hover:shadow-[0_15px_40px_rgba(255,215,0,0.4)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Sign In &amp; Launch Jackpot
                  <ArrowRight className="w-4 h-4 text-gray-950" />
                </>
              )}
            </button>

            {/* Quick-fill Demo / Master Accounts */}
            <div className="pt-3 border-t border-white/10">
              <div className="text-[11px] font-semibold text-gray-400 mb-2 text-center">
                Quick Fill Verified Accounts:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUsername('admin');
                    setPassword('admin123');
                    setError(null);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all text-center cursor-pointer"
                >
                  👑 Admin (Full)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('luluecom');
                    setPassword('lulu@2026');
                    setError(null);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all text-center cursor-pointer"
                >
                  💼 Manager (Ops)
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Security Footer Note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Operator session is tracked in Google Sheet <code className="text-gray-400">Jackpot_Audit_Logs</code>
          </p>
        </div>
      </div>
    </div>
  );
};
