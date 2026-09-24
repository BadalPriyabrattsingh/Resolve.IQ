import React, { useState } from 'react';
import { Activity, ChevronRight, CheckCircle2, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { User } from '../types';

interface LoginGatewayProps {
  onLogin: (userId: string) => void;
  allUsers: User[];
  onWakeServers?: () => void;
}

export const LoginGateway: React.FC<LoginGatewayProps> = ({
  onLogin,
  allUsers,
  onWakeServers,
}) => {
  const [email, setEmail] = useState('admin@resolveiq.dev');
  const [password, setPassword] = useState('••••••••••••••');
  const [selectedUserId, setSelectedUserId] = useState<string>(
    allUsers[0]?.id || 'usr-ic-1'
  );
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showWakeSuccess, setShowWakeSuccess] = useState(false);

  const handleEnterConsole = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => {
      onLogin(selectedUserId);
      setIsAuthenticating(false);
    }, 350);
  };

  const handleSelectRoleUser = (user: User) => {
    setSelectedUserId(user.id);
    setEmail(user.email);
  };

  const handleWakeUp = () => {
    setShowWakeSuccess(true);
    if (onWakeServers) onWakeServers();
    setTimeout(() => {
      setShowWakeSuccess(false);
    }, 2500);
  };

  return (
    <div
      id="resolveiq-login-view"
      className="min-h-screen bg-[#080D11] text-slate-100 flex flex-col justify-between items-center px-4 py-8 md:py-12 relative overflow-hidden select-none font-sans"
    >
      {/* Background subtle atmospheric glow */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#e07a5f]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Area: Brand Column (Left) + Auth Card (Right) */}
      <div className="flex-1 w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 my-auto z-10">
        {/* Left Side: Brand Identity & Signal Graphic */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6 max-w-sm">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2dd4bf] flex items-center justify-center shadow-lg shadow-teal-900/30">
              <Activity className="w-5 h-5 text-[#080d11] stroke-[2.5]" />
            </div>
            <div className="text-xl font-bold tracking-tight text-white flex items-center">
              <span>RESOLVE</span>
              <span className="text-[#2dd4bf] ml-0.5">IQ</span>
            </div>
          </div>

          {/* Brand Tagline */}
          <h1 className="text-2xl lg:text-3xl font-normal text-slate-300 tracking-tight leading-snug">
            Incident response, with signal.
          </h1>

          {/* 5-Bar Signal Waveform Graphic with Coral Center Accent */}
          <div className="flex items-center gap-2 pt-2 pb-1">
            {/* Bar 1: Teal */}
            <div className="w-2.5 h-8 bg-[#2dd4bf] rounded-full opacity-85 transition-all duration-300 hover:h-10" />
            {/* Bar 2: Teal */}
            <div className="w-2.5 h-12 bg-[#2dd4bf] rounded-full opacity-90 transition-all duration-300 hover:h-14" />
            {/* Bar 3: Warm Coral / Terracotta (Center Alert Signal) */}
            <div className="w-2.5 h-16 bg-[#e07a5f] rounded-full shadow-sm shadow-[#e07a5f]/30 transition-all duration-300 hover:h-18" />
            {/* Bar 4: Teal */}
            <div className="w-2.5 h-10 bg-[#2dd4bf] rounded-full opacity-90 transition-all duration-300 hover:h-12" />
            {/* Bar 5: Teal */}
            <div className="w-2.5 h-14 bg-[#2dd4bf] rounded-full opacity-85 transition-all duration-300 hover:h-16" />
          </div>

          {/* Monospace Subtitle */}
          <div className="text-[11px] font-mono tracking-[0.2em] text-slate-500 uppercase">
            OPERATIONS CONSOLE / 2026
          </div>
        </div>

        {/* Right Side: Secure Access Authentication Card */}
        <div className="w-full max-w-md">
          <div className="bg-[#0D151C] border border-[#1A2833] rounded-xl p-7 md:p-8 shadow-2xl shadow-black/60 relative backdrop-blur-sm">
            {/* Micro Eyebrow */}
            <div className="text-[11px] font-mono font-semibold tracking-wider text-[#2dd4bf] uppercase mb-2">
              SECURE ACCESS
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Welcome back
            </h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Sign in to your incident command center.
            </p>

            {/* SSO / Google Button */}
            <button
              type="button"
              id="btn-sso-login"
              onClick={() => handleEnterConsole()}
              className="w-full py-2.5 px-4 rounded-lg bg-[#121C24] hover:bg-[#16232D] border border-[#1F2E3A] hover:border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer group"
            >
              <span>Continue with Google</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#182631]" />
              </div>
              <div className="relative flex justify-center text-[11px] font-mono text-slate-500">
                <span className="bg-[#0D151C] px-3">or use email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleEnterConsole} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1.5">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070D12] border border-[#1A2935] focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf] text-slate-200 text-xs font-mono transition-all outline-none"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1.5">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070D12] border border-[#1A2935] focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf] text-slate-200 text-xs font-mono transition-all outline-none"
                />
              </div>

              {/* Primary Action: Solid Radiant Teal Button */}
              <button
                type="submit"
                id="btn-enter-console"
                disabled={isAuthenticating}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#48d5c4] hover:bg-[#5eead4] active:bg-[#2dd4bf] text-[#051c20] font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/10 transition-all cursor-pointer"
              >
                {isAuthenticating ? (
                  <div className="w-4 h-4 border-2 border-[#051c20] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter console</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Role Selector */}
            <div className="mt-6 pt-5 border-t border-[#182631]">
              <div className="text-[11px] text-slate-400 text-center mb-3">
                Demo access enabled · 4 role profiles available
              </div>

              <div className="grid grid-cols-2 gap-2">
                {allUsers.map((user) => {
                  const isSelected = user.id === selectedUserId;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      id={`role-select-${user.role.toLowerCase()}`}
                      onClick={() => handleSelectRoleUser(user)}
                      className={`text-left p-2 rounded-lg border transition-all text-xs ${
                        isSelected
                          ? 'bg-[#101C25] border-[#2dd4bf]/60 text-slate-100 ring-1 ring-[#2dd4bf]/40'
                          : 'bg-[#091117] border-[#182631] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold truncate flex items-center justify-between">
                        <span>{user.name.split(' ')[0]}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]" />}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 truncate">
                        {user.role.replace('_', ' ')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating Pill Bar */}
      <div className="w-full max-w-xl z-10 pt-6">
        <div className="rounded-full bg-[#0D161D]/90 border border-[#1E2F3D] px-4 py-2 flex items-center justify-between gap-3 text-xs shadow-xl backdrop-blur">
          <span className="text-slate-300 truncate">
            Frontend Preview Only. Please wake servers to enable backend functionality.
          </span>
          <button
            type="button"
            id="btn-wake-servers"
            onClick={handleWakeUp}
            className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold text-[#2dd4bf] hover:text-[#5eead4] hover:bg-[#12222d] transition-colors cursor-pointer"
          >
            {showWakeSuccess ? 'Servers Active ✓' : 'Wake up servers'}
          </button>
        </div>
      </div>
    </div>
  );
};
