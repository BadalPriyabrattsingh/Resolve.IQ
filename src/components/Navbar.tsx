import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  RotateCcw,
  Search,
  CheckCircle,
  ChevronDown,
  Info,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { User, UserRole } from '../types';

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
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showRbacModal, setShowRbacModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'INCIDENT_MANAGER':
        return 'bg-[#e07a5f]/20 text-[#fca5a5] border-[#e07a5f]/40';
      case 'ENGINEER':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'VIEWER':
        return 'bg-slate-700/40 text-slate-300 border-slate-600';
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
      className="sticky top-0 z-30 h-16 bg-[#090F14]/95 backdrop-blur border-b border-[#16232D] px-4 md:px-6 flex items-center justify-between gap-4"
    >
      {/* Left: Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2dd4bf] flex items-center justify-center shadow-lg shadow-teal-900/30">
            <Activity className="w-4 h-4 text-[#080d11] stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-base flex items-center">
                <span>RESOLVE</span>
                <span className="text-[#2dd4bf] ml-0.5">IQ</span>
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#101C25] text-teal-300 border border-teal-500/30 font-semibold">
                SRE Console
              </span>
            </div>
          </div>
        </div>

        {/* Live operational pulse */}
        <div className="hidden lg:flex items-center gap-2 pl-4 ml-4 border-l border-[#182631] text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2dd4bf] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2dd4bf]"></span>
          </span>
          <span className="font-mono text-[11px] text-[#2dd4bf] font-medium">CLUSTER TELEMETRY LIVE</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="global-incident-search"
            type="text"
            placeholder="Search INC-2026-..., service, keyword..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#070D12] border border-[#1A2833] rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]/40 font-mono"
          />
        </div>
      </div>

      {/* Right: Actions & User Switcher */}
      <div className="flex items-center gap-2.5">
        {/* Auth Gateway Button */}
        {onOpenAuthGateway && (
          <button
            id="btn-nav-auth-gate"
            onClick={onOpenAuthGateway}
            title="Open Sign In / Auth Gateway view"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border border-[#1E2E3C] bg-[#0E171F] hover:bg-[#13222D] text-slate-300 hover:text-[#2dd4bf] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-[#2dd4bf]" />
            <span>Sign In View</span>
          </button>
        )}

        {/* Reset Demo Button */}
        <button
          id="btn-reset-demo"
          onClick={handleReset}
          disabled={isResetting}
          title="Reset back to initial demo state"
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border border-[#1E2E3C] bg-[#0E171F] hover:bg-[#13222D] text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset Demo</span>
        </button>

        {/* Declare Incident Button */}
        <button
          id="btn-declare-incident-navbar"
          onClick={onOpenDeclareIncident}
          disabled={currentUser.role === 'VIEWER'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded shadow-sm border transition-all ${
            currentUser.role === 'VIEWER'
              ? 'bg-[#0E171F] text-slate-500 border-[#182631] cursor-not-allowed'
              : 'bg-[#e07a5f] hover:bg-[#ea580c] text-white border-[#e07a5f] shadow-lg shadow-orange-950/40 cursor-pointer'
          }`}
          title={currentUser.role === 'VIEWER' ? 'Viewers cannot declare incidents' : 'Declare New Incident'}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">Declare Incident</span>
        </button>

        {/* User / Role Switcher */}
        <div className="relative">
          <button
            id="user-profile-menu-trigger"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0D151C] border border-[#1A2833] hover:border-slate-700 text-left transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-[#121E27] border border-teal-500/30 flex items-center justify-center text-xs font-mono text-[#2dd4bf] font-bold overflow-hidden">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name[0]
              )}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-medium text-slate-200 leading-none">{currentUser.name}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded border font-semibold ${getRoleBadge(currentUser.role)}`}>
                  {currentUser.role}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* User selector dropdown */}
          {showUserDropdown && (
            <div
              id="user-profile-dropdown"
              className="absolute right-0 mt-2 w-72 bg-[#0D151C] border border-[#1A2833] rounded-lg shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-2.5 py-2 border-b border-[#182631] mb-1">
                <div className="text-[11px] font-mono text-teal-400 uppercase tracking-wider">Switch Active Persona / Role</div>
                <div className="text-xs text-slate-400 mt-0.5">Experience RBAC permissions in real time:</div>
              </div>

              <div className="space-y-1">
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
                      className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#12202A] text-white border border-teal-500/40'
                          : 'hover:bg-[#101921] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#121E27] border border-[#1E2E3C] flex items-center justify-center text-xs font-mono font-bold text-[#2dd4bf] overflow-hidden">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name[0]
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-200">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.title}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                        {isCurrent && <CheckCircle className="w-3.5 h-3.5 text-[#2dd4bf]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-[#182631] px-2 flex justify-between items-center text-[11px] text-slate-400">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    setShowRbacModal(true);
                  }}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-teal-300 hover:underline cursor-pointer"
                >
                  <Info className="w-3 h-3" />
                  <span>Role Matrix</span>
                </button>
                {onOpenAuthGateway && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenAuthGateway();
                    }}
                    className="inline-flex items-center gap-1 text-[#2dd4bf] hover:underline cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Role Info Modal */}
      {showRbacModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0D151C] border border-[#1A2833] rounded-xl max-w-lg w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2833]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#2dd4bf]" />
                <h3 className="text-sm font-bold text-slate-100 font-mono">ResolveIQ RBAC Authorization Matrix</h3>
              </div>
              <button
                onClick={() => setShowRbacModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1 rounded bg-[#101C25] hover:bg-[#182631] border border-[#1A2833] cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="p-2.5 rounded bg-[#070D12] border border-[#1A2833]">
                <div className="font-mono font-bold text-[#e07a5f] mb-1">ADMIN (Alex Turner)</div>
                <p className="text-slate-400">Full system authority. Create/edit/delete incidents, register/modify services, assign personnel, attach evidence, and adjust severities.</p>
              </div>
              <div className="p-2.5 rounded bg-[#070D12] border border-[#1A2833]">
                <div className="font-mono font-bold text-[#2dd4bf] mb-1">INCIDENT_MANAGER (Sarah Chen)</div>
                <p className="text-slate-400">Command & control. Can declare incidents, change statuses, escalate/downgrade severities, reassign engineers, add evidence/comments, and manage services.</p>
              </div>
              <div className="p-2.5 rounded bg-[#070D12] border border-[#1A2833]">
                <div className="font-mono font-bold text-teal-300 mb-1">ENGINEER (Marcus Vance)</div>
                <p className="text-slate-400">Investigation & mitigation. Can declare incidents, advance status (INVESTIGATING, MITIGATING, RESOLVED), assign incidents to self, and attach telemetry/logs.</p>
              </div>
              <div className="p-2.5 rounded bg-[#070D12] border border-[#1A2833]">
                <div className="font-mono font-bold text-slate-300 mb-1">VIEWER (Elena Rostova)</div>
                <p className="text-slate-400">Read-only stakeholder. Can view real-time incident dashboards, audit logs, service catalog, and evidence without mutation permissions.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
