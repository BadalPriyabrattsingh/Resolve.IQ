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
      label: 'Operations Center',
      icon: LayoutDashboard,
    },
    {
      id: 'incidents',
      label: 'Incident Directory',
      icon: AlertOctagon,
      badge: stats ? stats.openIncidentsCount : undefined,
      badgeColor: stats && stats.openIncidentsCount > 0 ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' : undefined,
    },
    {
      id: 'services',
      label: 'Service Catalog',
      icon: Server,
      badge: stats && stats.servicesHealth.degraded + stats.servicesHealth.outage > 0 ? `${stats.servicesHealth.degraded + stats.servicesHealth.outage}` : undefined,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      id: 'timeline',
      label: 'Audit Timeline',
      icon: Activity,
    },
    {
      id: 'roles',
      label: 'RBAC & Access',
      icon: Users,
    },
  ];

  return (
    <aside
      id="resolveiq-sidebar"
      className="w-56 bg-white dark:bg-[#121820] border-r border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 select-none transition-colors"
    >
      <div className="p-3 space-y-5">
        {/* Navigation Category */}
        <div>
          <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
            Navigation
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
                      ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-medium ${
                        item.badgeColor || 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 border-slate-200 dark:border-white/[0.06]'
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

        {/* System Status Summary */}
        {stats && (
          <div className="px-3 py-2.5 rounded-lg bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-medium">
                Cluster Health
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                99.94%
              </span>
            </div>

            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Active SEV-1</span>
                <span className={`font-semibold ${stats.sev1Count > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
                  {stats.sev1Count}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Active SEV-2</span>
                <span className={`font-semibold ${stats.sev2Count > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'}`}>
                  {stats.sev2Count}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Degraded</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">{stats.servicesHealth.degraded}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Avg MTTR</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{stats.avgResolutionTimeMinutes}m</span>
              </div>
            </div>
          </div>
        )}

        {/* Guided Tour Launcher Card */}
        {onOpenTutorial && (
          <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
              <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Interactive Guide</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Step through live incident triage and AI hypotheses.
            </p>
            <button
              id="sidebar-btn-tour"
              onClick={onOpenTutorial}
              className="w-full py-1 px-2 rounded-md bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-white/[0.08] text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
            >
              <span>Explore Tour</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.08] text-[11px] text-slate-400 dark:text-slate-500 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>RBAC Guarded</span>
        </span>
        <span>v1.2</span>
      </div>
    </aside>
  );
};
