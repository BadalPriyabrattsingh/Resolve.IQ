import React, { useState, useEffect } from 'react';
import {
  Activity,
  ChevronRight,
  Shield,
  Building,
  UserPlus,
  LogIn,
  AlertCircle,
  Crown,
  Sparkles,
} from 'lucide-react';
import { User, Organization, RolePermissions } from '../types';
import { api } from '../api';

interface LoginGatewayProps {
  onAuthSuccess: (data: {
    token: string;
    user: User;
    organization: Organization;
    permissions: RolePermissions;
  }) => void;
  onWakeServers?: () => void;
}

export const LoginGateway: React.FC<LoginGatewayProps> = ({
  onAuthSuccess,
  onWakeServers,
}) => {
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [setupStatus, setSetupStatus] = useState<{ hasUsers: boolean; userCount: number } | null>(null);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOrgName, setRegOrgName] = useState('');
  const [regTitle, setRegTitle] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Check if the system has any users registered yet
    api
      .getSetupStatus()
      .then((status) => {
        setSetupStatus(status);
        if (!status.hasUsers) {
          setTab('register');
        }
      })
      .catch(() => {
        // quiet error
      });
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword.trim()) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const data = await api.login({
        email: signInEmail.trim(),
        password: signInPassword.trim(),
      });
      onAuthSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regOrgName.trim()) {
      setErrorMsg('Please provide your name, email, password, and organization name.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    setIsRegistering(true);
    setErrorMsg(null);
    try {
      const data = await api.register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword.trim(),
        organizationName: regOrgName.trim(),
        title: regTitle.trim() || undefined,
      });
      onAuthSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const isInitialPlatformSetup = setupStatus && !setupStatus.hasUsers;

  return (
    <div
      id="resolveiq-login-view"
      className="min-h-screen bg-slate-50 dark:bg-[#080D11] text-slate-900 dark:text-slate-100 flex flex-col justify-between items-center px-4 py-8 md:py-12 relative overflow-hidden font-sans transition-colors"
    >
      {/* Background subtle atmospheric depth */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-20 my-auto z-10">
        {/* Left Side: Brand Identity */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6 max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 dark:bg-teal-500 flex items-center justify-center shadow-xs">
              <Activity className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
              <span>RESOLVE</span>
              <span className="text-teal-600 dark:text-teal-400 ml-0.5">IQ</span>
            </div>
          </div>

          <h1 className="text-2xl lg:text-3xl font-semibold text-slate-800 dark:text-slate-200 tracking-tight leading-snug">
            Autonomous Incident Intelligence & Multi-Org RBAC.
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Multi-tiered site reliability platform. First user initializes platform ownership; organization creators govern organizational teams and responder privileges.
          </p>

          {/* 5-Bar Signal Waveform Graphic */}
          <div className="flex items-center gap-2 pt-2 pb-1">
            <div className="w-2.5 h-8 bg-teal-500/80 rounded-full" />
            <div className="w-2.5 h-12 bg-teal-500/90 rounded-full" />
            <div className="w-2.5 h-16 bg-orange-500 rounded-full shadow-xs" />
            <div className="w-2.5 h-10 bg-teal-500/90 rounded-full" />
            <div className="w-2.5 h-14 bg-teal-500/80 rounded-full" />
          </div>

          <div className="text-[11px] font-mono tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase">
            SECURE ACCESS GATEWAY / 2026
          </div>
        </div>

        {/* Right Side: Authentication Card */}
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#0D151C] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 md:p-8 shadow-xl dark:shadow-2xl dark:shadow-black/60 relative">
            {/* Tab Selector */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-white/[0.04] p-1 mb-6 border border-slate-200/60 dark:border-white/[0.06]">
              <button
                type="button"
                id="tab-btn-signin"
                onClick={() => {
                  setTab('signin');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tab === 'signin'
                    ? 'bg-white dark:bg-[#16222C] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                id="tab-btn-register"
                onClick={() => {
                  setTab('register');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tab === 'register'
                    ? 'bg-white dark:bg-[#16222C] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Org / User</span>
              </button>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Platform Init Banner (when 0 users registered) */}
            {isInitialPlatformSetup && (
              <div className="mb-5 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Crown className="w-4 h-4 text-amber-500" />
                  Initial Platform Setup
                </div>
                The first registered user automatically becomes the <strong>Product Owner</strong> with full platform-wide administration privileges.
              </div>
            )}

            {tab === 'signin' ? (
              /* ================= SIGN IN FORM ================= */
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Sign in to ResolveIQ
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
                    Enter your organization credentials.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-1.5">
                    Email address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#070D12] border border-slate-200 dark:border-[#1A2935] focus:border-teal-500 dark:focus:border-teal-400 text-slate-900 dark:text-slate-200 text-xs font-mono transition-all outline-none"
                    placeholder="name@company.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-1.5">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#070D12] border border-slate-200 dark:border-[#1A2935] focus:border-teal-500 dark:focus:border-teal-400 text-slate-900 dark:text-slate-200 text-xs font-mono transition-all outline-none"
                    placeholder="••••••••••••"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-enter-console"
                  disabled={isSigningIn}
                  className="w-full mt-2 py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  {isSigningIn ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter Console</span>
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ================= REGISTER FORM ================= */
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Create Account & Organization
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-2">
                    The first user of each organization is assigned as <strong>Org Admin</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Your Full Name *
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#070D12] border border-slate-200 dark:border-[#1A2935] focus:border-teal-500 dark:focus:border-teal-400 text-slate-900 dark:text-slate-200 text-xs transition-all outline-none"
                    placeholder="e.g. Jordan Lee"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Organization Name *
                  </label>
                  <div className="relative">
                    <input
                      id="reg-org"
                      type="text"
                      required
                      value={regOrgName}
                      onChange={(e) => setRegOrgName(e.target.value)}
                      className="w-full px-3.5 py-2 pl-9 rounded-lg bg-slate-50 dark:bg-[#070D12] border border-slate-200 dark:border-[#1A2935] focus:border-teal-500 dark:focus:border-teal-400 text-slate-900 dark:text-slate-200 text-xs transition-all outline-none"
                      placeholder="e.g. Apex Technologies"
                    />
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Work Email Address *
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#070D12] border border-slate-200 dark:border-[#1A2935] focus:border-teal-500 dark:focus:border-teal-400 text-slate-900 dark:text-slate-200 text-xs font-mono transition-all outline-none"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Password * (min 6 characters)
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#070D12] border border-slate-200 dark:border-[#1A2935] focus:border-teal-500 dark:focus:border-teal-400 text-slate-900 dark:text-slate-200 text-xs font-mono transition-all outline-none"
                    placeholder="••••••••••••"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Job Title / Specialty (Optional)
                  </label>
                  <input
                    id="reg-title"
                    type="text"
                    value={regTitle}
                    onChange={(e) => setRegTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#070D12] border border-slate-200 dark:border-[#1A2935] focus:border-teal-500 dark:focus:border-teal-400 text-slate-900 dark:text-slate-200 text-xs transition-all outline-none"
                    placeholder="e.g. Lead SRE / Platform Architect"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-register-submit"
                  disabled={isRegistering}
                  className="w-full mt-2 py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  {isRegistering ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="w-full max-w-xl z-10 pt-4 text-center">
        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
          ResolveIQ Enterprise Operational Intelligence · Role Based Access Control Active
        </div>
      </div>
    </div>
  );
};
