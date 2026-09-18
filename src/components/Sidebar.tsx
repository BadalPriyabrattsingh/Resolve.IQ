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
      className="w-64 bg-[#0A0D14] border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none"
    >
      <div className="p-3 space-y-6">
        {/* Navigation Category */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800/90 text-slate-100 border border-slate-700/80 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                        item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
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
          <div className="px-3 py-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Cluster Health
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ACTIVE
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>Active SEV-1:</span>
                <span className={`font-bold ${stats.sev1Count > 0 ? 'text-red-400' : 'text-slate-400'}`}>
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
                <span className="text-blue-300 font-semibold">{stats.avgResolutionTimeMinutes}m</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Auth: RBAC Enforced</span>
          </span>
          <span className="text-slate-400 font-mono">v1.2-sre</span>
        </div>
        <div className="text-[10px] text-slate-400">Persistent JSON Engine</div>
      </div>
    </aside>
  );
};
