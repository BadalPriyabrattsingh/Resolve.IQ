import React from 'react';
import {
  LayoutDashboard,
  AlertOctagon,
  Server,
  Activity,
  Users,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { DashboardStats } from '../types';

export type NavigationTab = 'dashboard' | 'incidents' | 'services' | 'timeline' | 'roles';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  stats: DashboardStats | null;
  onOpenTutorial?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  stats,
  onOpenTutorial,
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
      className="w-56 bg-[#0D1117] border-r border-[#1E2631] flex flex-col justify-between shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 select-none"
    >
      <div className="p-3 space-y-5">
        {/* Navigation Category */}
        <div>
          <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Menu
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#16202B] text-[#2dd4bf]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121820]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-[#2dd4bf]' : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                        item.badgeColor || 'bg-[#111720] text-slate-400 border-[#1E2631]'
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
          <div className="px-3 py-2.5 rounded-lg bg-[#111720] border border-[#1E2631] text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Cluster Health
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-[#2dd4bf]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]"></span>
                Online
              </span>
            </div>

            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>Active SEV-1:</span>
                <span className={`font-semibold ${stats.sev1Count > 0 ? 'text-[#e07a5f]' : 'text-slate-400'}`}>
                  {stats.sev1Count}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Active SEV-2:</span>
                <span className={`font-semibold ${stats.sev2Count > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {stats.sev2Count}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Degraded:</span>
                <span className="text-amber-400 font-medium">{stats.servicesHealth.degraded}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Avg MTTR:</span>
                <span className="text-slate-300 font-medium">{stats.avgResolutionTimeMinutes}m</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Tour Launcher Card */}
        {onOpenTutorial && (
          <div className="p-2.5 rounded-lg bg-[#111720] border border-[#1E2631] text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-300">
              <Compass className="w-3.5 h-3.5 text-[#2dd4bf]" />
              <span>Need a Quick Tour?</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Explore key features and the AI investigation workflow.
            </p>
            <button
              id="sidebar-btn-tour"
              onClick={onOpenTutorial}
              className="w-full py-1 px-2 rounded bg-[#16202B] hover:bg-[#1d2937] text-[#2dd4bf] text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span>Start Tour</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#1E2631] text-[11px] text-slate-500 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2dd4bf]" />
          <span>RBAC Protected</span>
        </span>
        <span className="text-slate-500">v1.2</span>
      </div>
    </aside>
  );
};
