import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  RotateCcw,
  Search,
  ChevronDown,
  LogOut,
  Compass,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  onOpenDeclareIncident: () => void;
  onResetDemo: () => void;
  onSearchChange: (search: string) => void;
  searchQuery: string;
  onSelectIncidentById?: (id: string) => void;
  onOpenAuthGateway?: () => void;
  onOpenTutorial?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onOpenDeclareIncident,
  onResetDemo,
  onSearchChange,
  searchQuery,
  onOpenAuthGateway,
  onOpenTutorial,
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
      case 'INCIDENT_MANAGER':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'ENGINEER':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'VIEWER':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset database to realistic initial demo state?')) {
      setIsResetting(true);
      try {
        await onResetDemo();
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <header
      id="resolveiq-navbar"
      className="sticky top-0 z-30 h-14 bg-white/80 dark:bg-[#121820]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] px-4 md:px-6 flex items-center justify-between gap-4 transition-colors"
      style={{ boxShadow: 'var(--shadow-subtle)' }}
    >
      {/* Left: Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#0D9488] dark:bg-[#14B8A6] flex items-center justify-center text-white shadow-xs">
            <Activity className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100 tracking-tight text-sm flex items-center">
              <span>RESOLVE</span>
              <span className="text-[#0D9488] dark:text-[#2DD4BF] ml-0.5 font-bold">IQ</span>
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] font-medium">
              SRE
            </span>
          </div>
        </div>

        {/* Live operational pulse */}
        <div className="hidden lg:flex items-center gap-2 pl-3 ml-1 border-l border-slate-200 dark:border-white/[0.08] text-xs text-slate-500 dark:text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[11px]">Cluster Active</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-sm hidden sm:block">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="global-incident-search"
            type="text"
            placeholder="Search incidents, services, tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-md text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-colors font-mono"
          />
        </div>
      </div>

      {/* Right: Actions, Theme Switcher & User Profile */}
      <div className="flex items-center gap-2">
        {/* Theme Switcher Toggle */}
        <div className="relative">
          <button
            id="theme-switcher-button"
            onClick={() => setShowThemeDropdown(!showThemeDropdown)}
            title={`Current theme: ${theme}`}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Sun className="w-3.5 h-3.5" />
            )}
          </button>

          {showThemeDropdown && (
            <div
              className="absolute right-0 mt-1.5 w-32 bg-white dark:bg-[#18202A] border border-slate-200 dark:border-white/[0.1] rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-75 text-xs font-medium"
              style={{ boxShadow: 'var(--shadow-elevated)' }}
            >
              <button
                onClick={() => {
                  setTheme('light');
                  setShowThemeDropdown(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors ${
                  theme === 'light' ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                onClick={() => {
                  setTheme('dark');
                  setShowThemeDropdown(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors ${
                  theme === 'dark' ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => {
                  setTheme('system');
                  setShowThemeDropdown(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors ${
                  theme === 'system' ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
            </div>
          )}
        </div>

        {/* Interactive Guided Tour Button */}
        {onOpenTutorial && (
          <button
            id="btn-nav-tutorial"
            onClick={onOpenTutorial}
            title="Start interactive app tour & guide"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>
        )}

        {/* Auth Gateway Button */}
        {onOpenAuthGateway && (
          <button
            id="btn-nav-auth-gate"
            onClick={onOpenAuthGateway}
            title="Open Sign In / Auth Gateway view"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}

        {/* Reset Demo Button */}
        <button
          id="btn-reset-demo"
          onClick={handleReset}
          disabled={isResetting}
          title="Reset back to initial demo state"
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset</span>
        </button>

        {/* Declare Incident Button */}
        <button
          id="btn-declare-incident-navbar"
          onClick={onOpenDeclareIncident}
          disabled={currentUser.role === 'VIEWER'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all select-none ${
            currentUser.role === 'VIEWER'
              ? 'bg-slate-100 dark:bg-white/[0.03] text-slate-400 dark:text-slate-600 border-slate-200 dark:border-white/[0.06] cursor-not-allowed'
              : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-xs cursor-pointer active:scale-[0.98]'
          }`}
          title={currentUser.role === 'VIEWER' ? 'Viewers cannot declare incidents' : 'Declare New Incident'}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">Declare Incident</span>
        </button>

        {/* User / Persona Switcher */}
        <div className="relative">
          <button
            id="user-profile-menu-trigger"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 px-2 py-1 rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-left transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-xs font-mono text-teal-600 dark:text-teal-400 font-semibold overflow-hidden">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name[0]
              )}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-none">{currentUser.name}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[9px] font-mono px-1 py-0.2 rounded border font-medium ${getRoleBadge(currentUser.role)}`}>
                  {currentUser.role}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* User selector dropdown */}
          {showUserDropdown && (
            <div
              id="user-profile-dropdown"
              className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-[#18202A] border border-slate-200 dark:border-white/[0.1] rounded-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              style={{ boxShadow: 'var(--shadow-elevated)' }}
            >
              <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-white/[0.08] mb-1">
                <div className="text-[10px] font-mono text-teal-600 dark:text-teal-400 uppercase tracking-wider font-semibold">Active Persona</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Switch role to test live RBAC:</div>
              </div>

              <div className="space-y-0.5">
                {allUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      id={`switch-user-${u.role.toLowerCase()}`}
                      onClick={() => {
                        onSwitchUser(u.id);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer text-xs ${
                        isCurrent
                          ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/[0.08] flex items-center justify-center text-[10px] font-mono">
                          {u.name[0]}
                        </div>
                        <div>
                          <div className="text-xs">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.role}</div>
                        </div>
                      </div>
                      {isCurrent && <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400">Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
