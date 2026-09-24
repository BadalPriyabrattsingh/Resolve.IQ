import React from 'react';
import {
  LayoutDashboard,
  AlertOctagon,
  Server,
  Activity,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { DashboardStats } from '../types';

export type NavigationTab = 'dashboard' | 'incidents' | 'services' | 'timeline' | 'roles';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  stats: DashboardStats | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  stats,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ElementType; badge?: string | number; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Ops Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'incidents',
      label: 'Incidents',
      icon: AlertOctagon,
      badge: stats ? stats.openIncidentsCount : undefined,
      badgeColor: stats && stats.openIncidentsCount > 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : undefined,
    },
    {
      id: 'services',
      label: 'Service Catalog',
      icon: Server,
      badge: stats && stats.servicesHealth.degraded + stats.servicesHealth.outage > 0 ? `${stats.servicesHealth.degraded + stats.servicesHealth.outage} Alert` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      id: 'timeline',
      label: 'Ops Timeline Feed',
      icon: Activity,
    },
    {
      id: 'roles',
      label: 'Team & RBAC Matrix',
      icon: Users,
    },
  ];

  return (
    <aside
      id="resolveiq-sidebar"
      className="w-64 bg-[#090E13] border-r border-[#16232D] flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none"
    >
      <div className="p-3 space-y-6">
        {/* Navigation Category */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Operations Workspace
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#101C25] text-[#2dd4bf] border border-teal-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D151C]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-[#2dd4bf]' : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                        item.badgeColor || 'bg-[#0E171F] text-slate-400 border-[#1A2833]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick System Telemetry pill box */}
        {stats && (
          <div className="px-3 py-3 rounded-lg bg-[#0D151C] border border-[#1A2833] text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Cluster Health
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-[#2dd4bf]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse"></span>
                ACTIVE
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>Active SEV-1:</span>
                <span className={`font-bold ${stats.sev1Count > 0 ? 'text-[#e07a5f]' : 'text-slate-400'}`}>
                  {stats.sev1Count}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Active SEV-2:</span>
                <span className={`font-bold ${stats.sev2Count > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
                  {stats.sev2Count}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Services Degraded:</span>
                <span className="text-amber-400 font-semibold">{stats.servicesHealth.degraded}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Avg Resolution (MTTR):</span>
                <span className="text-teal-300 font-semibold">{stats.avgResolutionTimeMinutes}m</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#16232D] text-[11px] text-slate-500 font-mono space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2dd4bf]" />
            <span>Auth: RBAC Enforced</span>
          </span>
          <span className="text-slate-500 font-mono">v1.2-sre</span>
        </div>
        <div className="text-[10px] text-slate-600">Signal Intelligence Engine</div>
      </div>
    </aside>
  );
};
