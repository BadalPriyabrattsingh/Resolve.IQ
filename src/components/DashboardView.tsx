import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Server,
  Activity,
  Flame,
  ArrowUpRight,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Compass } from 'lucide-react';
import { DashboardStats, Incident, Service } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { useTheme } from '../context/ThemeContext';

interface DashboardViewProps {
  stats: DashboardStats | null;
  incidents: Incident[];
  services: Service[];
  onSelectIncident: (incidentId: string) => void;
  onOpenDeclareIncident: () => void;
  onSelectService: (serviceId: string) => void;
  onOpenTutorial?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  incidents,
  services,
  onSelectIncident,
  onOpenDeclareIncident,
  onSelectService,
  onOpenTutorial,
}) => {
  const { resolvedTheme } = useTheme();

  // Filters & Search
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (filterSeverity === 'OPEN') {
        if (!['DETECTED', 'TRIAGED', 'INVESTIGATING', 'MITIGATING'].includes(inc.status)) {
          return false;
        }
      } else if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) {
        return false;
      }

      if (filterStatus !== 'ALL' && inc.status !== filterStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = inc.incidentNumber.toLowerCase().includes(q);
        const matchesTitle = inc.title.toLowerCase().includes(q);
        const matchesService = inc.serviceName.toLowerCase().includes(q);
        const matchesEngineer = (inc.assignedEngineer || '').toLowerCase().includes(q);
        const matchesImpact = (inc.impactSummary || '').toLowerCase().includes(q);
        if (!matchesNum && !matchesTitle && !matchesService && !matchesEngineer && !matchesImpact) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, filterSeverity, filterStatus, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / pageSize));
  const paginatedIncidents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredIncidents.slice(startIndex, startIndex + pageSize);
  }, [filteredIncidents, currentPage, pageSize]);

  const handleFilterSeverity = (tab: string) => {
    setFilterSeverity(tab);
    setCurrentPage(1);
  };

  const handleFilterStatus = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  // Top Critical Active SEV-1 Callout
  const activeSev1 = useMemo(() => {
    return incidents.find(
      (i) => i.severity === 'SEV-1' && ['DETECTED', 'TRIAGED', 'INVESTIGATING', 'MITIGATING'].includes(i.status)
    );
  }, [incidents]);

  if (!stats) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Loading cluster metrics...
        </div>
      </div>
    );
  }

  // Exact severity colors
  const getSevColor = (sev: string) => {
    switch (sev) {
      case 'SEV-1':
        return resolvedTheme === 'dark' ? '#EF4444' : '#DC2626';
      case 'SEV-2':
        return resolvedTheme === 'dark' ? '#F97316' : '#EA580C';
      case 'SEV-3':
        return resolvedTheme === 'dark' ? '#EAB308' : '#CA8A04';
      case 'SEV-4':
        return resolvedTheme === 'dark' ? '#06B6D4' : '#0891B2';
      default:
        return resolvedTheme === 'dark' ? '#64748B' : '#94A3B8';
    }
  };

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Operations Center
            </h1>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time incident response, cluster reliability status, and automated root-cause analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenTutorial && (
            <button
              id="btn-tutorial-dash-header"
              onClick={onOpenTutorial}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-white/[0.08] transition-colors cursor-pointer shadow-2xs"
            >
              <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Tour</span>
            </button>
          )}

          <button
            id="btn-declare-incident-dash"
            onClick={onOpenDeclareIncident}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Declare Incident</span>
          </button>
        </div>
      </div>

      {/* 2. Active Incident Banner (Clean minimal morphism) */}
      {activeSev1 && (
        <div
          id="active-sev1-callout"
          onClick={() => onSelectIncident(activeSev1.id)}
          className="rounded-lg border border-red-500/25 bg-red-500/[0.03] dark:bg-red-500/[0.05] p-4 transition-all duration-150 cursor-pointer group hover:border-red-500/40"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5 text-red-600 dark:text-red-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <SeverityBadge severity={activeSev1.severity} size="sm" />
                  <StatusBadge status={activeSev1.status} size="sm" />
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
                    {activeSev1.incidentNumber}
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                    {activeSev1.serviceName}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  {activeSev1.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {activeSev1.impactSummary || activeSev1.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">Incident Commander</div>
                <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                  {activeSev1.incidentManager || 'Sarah Chen'}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-500/10 text-red-700 dark:text-red-300 text-xs font-medium border border-red-500/20 group-hover:bg-red-500/15 transition-colors">
                <span>War Room</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Six KPI Cards (Minimal morphism with soft shadow and subtle border) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Active Incidents */}
        <div
          className="p-3.5 rounded-lg bg-white dark:bg-[#121820] border border-slate-200/80 dark:border-white/[0.08] transition-colors"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Active</span>
            <AlertTriangle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-semibold font-mono text-slate-900 dark:text-slate-100">
            {stats.openIncidentsCount}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">In mitigation queue</div>
        </div>

        {/* SEV-1 Outages */}
        <div
          className="p-3.5 rounded-lg bg-white dark:bg-[#121820] border border-slate-200/80 dark:border-white/[0.08] transition-colors"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-medium text-red-600 dark:text-red-400">SEV-1</span>
            <Flame className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-2xl font-semibold font-mono text-red-600 dark:text-red-400">
            {stats.sev1Count}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Critical customer blast</div>
        </div>

        {/* SEV-2 Major */}
        <div
          className="p-3.5 rounded-lg bg-white dark:bg-[#121820] border border-slate-200/80 dark:border-white/[0.08] transition-colors"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400">SEV-2</span>
            <Activity className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-2xl font-semibold font-mono text-orange-600 dark:text-orange-400">
            {stats.sev2Count}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Degraded services</div>
        </div>

        {/* MTTA */}
        <div
          className="p-3.5 rounded-lg bg-white dark:bg-[#121820] border border-slate-200/80 dark:border-white/[0.08] transition-colors"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">MTTA</span>
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-2xl font-semibold font-mono text-slate-800 dark:text-slate-200">
            {stats.avgAcknowledgeTimeMinutes}m
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Target &lt; 5m (Good)</div>
        </div>

        {/* MTTR */}
        <div
          className="p-3.5 rounded-lg bg-white dark:bg-[#121820] border border-slate-200/80 dark:border-white/[0.08] transition-colors"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">MTTR</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-semibold font-mono text-teal-600 dark:text-teal-400">
            {stats.avgResolutionTimeMinutes}m
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Target &lt; 60m (98%)</div>
        </div>

        {/* AI Analyses */}
        <div
          className="p-3.5 rounded-lg bg-white dark:bg-[#121820] border border-slate-200/80 dark:border-white/[0.08] transition-colors"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">AI Analyses</span>
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-semibold font-mono text-teal-600 dark:text-teal-400">
            {stats.activeInvestigationsCount}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {stats.activeHypothesesCount || 3} verified hypotheses
          </div>
        </div>
      </div>

      {/* 4. Incident Trend & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Incident Trend Chart (7 cols) */}
        <div
          className="lg:col-span-7 p-4 rounded-lg bg-white dark:bg-[#121820] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Incident Volume & Severity Trend
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-teal-500" />
                  Total
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  SEV-1/2
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  Resolved
                </span>
              </div>
            </div>

            {/* Recharts Area Container */}
            <div className="h-[210px] w-full min-w-0 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    stats.incidentTrend && stats.incidentTrend.length > 0
                      ? stats.incidentTrend
                      : [
                          { date: '2026-09-13', label: 'Sep 13', count: 1, sev1Sev2: 1, resolved: 1 },
                          { date: '2026-09-14', label: 'Sep 14', count: 2, sev1Sev2: 1, resolved: 2 },
                          { date: '2026-09-15', label: 'Sep 15', count: 1, sev1Sev2: 0, resolved: 1 },
                          { date: '2026-09-16', label: 'Sep 16', count: 3, sev1Sev2: 2, resolved: 2 },
                          { date: '2026-09-17', label: 'Sep 17', count: 2, sev1Sev2: 1, resolved: 1 },
                          { date: '2026-09-18', label: 'Sep 18', count: 5, sev1Sev2: 3, resolved: 2 },
                        ]
                  }
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isDark ? '#14B8A6' : '#0D9488'} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={isDark ? '#14B8A6' : '#0D9488'} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="sevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isDark ? '#EF4444' : '#DC2626'} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={isDark ? '#EF4444' : '#DC2626'} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke={isDark ? '#64748B' : '#94A3B8'}
                    tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={isDark ? '#64748B' : '#94A3B8'}
                    tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#18202A' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      borderRadius: '8px',
                      color: isDark ? '#F1F5F9' : '#0F172A',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Total Incidents"
                    stroke={isDark ? '#14B8A6' : '#0D9488'}
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#totalGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="sev1Sev2"
                    name="Critical (SEV-1/2)"
                    stroke={isDark ? '#EF4444' : '#DC2626'}
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#sevGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Derived from immutable timeline records</span>
            <span>Last 7 Days</span>
          </div>
        </div>

        {/* Severity Distribution (5 cols) */}
        <div
          className="lg:col-span-5 p-4 rounded-lg bg-white dark:bg-[#121820] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Severity Distribution
              </h3>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                {incidents.length} total logged
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {stats.severityDistribution.map((item) => {
                const percentage = Math.round((item.count / Math.max(1, incidents.length)) * 100);
                const barColor = getSevColor(item.severity);

                return (
                  <div key={item.severity} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: barColor }} />
                        <span className="text-slate-800 dark:text-slate-200 font-mono font-medium">
                          {item.severity}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {item.severity === 'SEV-1'
                            ? 'Critical Outage'
                            : item.severity === 'SEV-2'
                            ? 'Major Impact'
                            : item.severity === 'SEV-3'
                            ? 'Minor Impact'
                            : 'Low Priority'}
                        </span>
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {item.count}{' '}
                        <span className="text-slate-400 dark:text-slate-500">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(4, percentage)}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>SEV-1 SLA: 15m Ack / 60m Resolve</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">SLO Healthy</span>
          </div>
        </div>
      </div>

      {/* 5. Core Service Health Matrix & AI Investigations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Service Health Directory (7 cols) */}
        <div
          className="lg:col-span-7 p-4 rounded-lg bg-white dark:bg-[#121820] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Core Service Health & Criticality Matrix
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {stats.servicesHealth.healthy}/{stats.servicesHealth.total} Operational
              </span>
            </div>

            {services.length === 0 ? (
              <div className="p-8 rounded-md bg-slate-50/60 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/[0.08] text-center text-xs text-slate-500 space-y-1">
                <div className="font-medium text-slate-700 dark:text-slate-300">No Services Registered Yet</div>
                <div>Register your first service to begin topology mapping and incident correlation.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {services.map((srv) => {
                  const isDegraded = srv.healthStatus === 'DEGRADED';
                  const isOutage = srv.healthStatus === 'OUTAGE';

                  return (
                    <div
                      key={srv.id}
                      id={`service-card-${srv.id}`}
                      onClick={() => onSelectService(srv.id)}
                      className={`p-3 rounded-md border transition-all cursor-pointer ${
                        isOutage
                          ? 'bg-red-500/[0.04] border-red-500/30 hover:border-red-500/50'
                          : isDegraded
                          ? 'bg-amber-500/[0.04] border-amber-500/30 hover:border-amber-500/50'
                          : 'bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.06] hover:border-teal-500/40 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {srv.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                          {srv.criticality}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
                        {srv.description}
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-slate-200/60 dark:border-white/[0.06]">
                        <span className="text-slate-400 dark:text-slate-500">{srv.owningTeam}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              srv.healthStatus === 'HEALTHY'
                                ? 'bg-emerald-500'
                                : srv.healthStatus === 'DEGRADED'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              srv.healthStatus === 'HEALTHY'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : srv.healthStatus === 'DEGRADED'
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-red-700 dark:text-red-400'
                            }`}
                          >
                            {srv.healthStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Automated dependency propagation</span>
            <span
              onClick={() => onSelectService(services[0]?.id || '')}
              className="text-teal-600 dark:text-teal-400 hover:underline cursor-pointer font-medium"
            >
              View Service Topology →
            </span>
          </div>
        </div>

        {/* Active AI Investigations Hub (5 cols) */}
        <div
          className="lg:col-span-5 p-4 rounded-lg bg-white dark:bg-[#121820] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Active AI Investigations
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 font-medium">
                Human-in-the-loop
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3.5">
              Automated agents analyze logs and stack traces, correlating deployment history with telemetry anomalies to formulate root-cause hypotheses.
            </p>

            {/* Active investigation callout item */}
            {activeSev1 ? (
              <div
                onClick={() => onSelectIncident(activeSev1.id)}
                className="p-3.5 rounded-md bg-slate-50 dark:bg-white/[0.02] border border-teal-500/30 hover:border-teal-500/60 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400">
                    {activeSev1.incidentNumber}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium">
                    Hypotheses Proposed
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors line-clamp-1">
                  {activeSev1.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  Database pool connection exhaustion identified with 88% telemetry confidence on Aurora replicas.
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-teal-600 dark:text-teal-400 group-hover:underline font-medium">
                    Open Investigation Workspace →
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">3 Hypotheses</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-md bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-center text-xs text-slate-500">
                All open investigations currently resolved or awaiting new alerts.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Requires SRE Commander Confirmation</span>
            <span className="text-teal-600 dark:text-teal-400 font-medium">Strict Guardrails</span>
          </div>
        </div>
      </div>

      {/* 6. Recent Incidents Directory (Central Queue) */}
      <div
        className="p-4 rounded-lg bg-white dark:bg-[#121820] border border-slate-200/80 dark:border-white/[0.08] space-y-4"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Operational Incident Directory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Filter by severity, lifecycle status, or search across incident records.
            </p>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                id="dash-incident-search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search incident, title, service, lead..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-md text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-teal-500/50"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="text-[11px] font-mono text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Severity tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {['ALL', 'OPEN', 'SEV-1', 'SEV-2', 'SEV-3', 'SEV-4'].map((tab) => (
              <button
                key={tab}
                id={`filter-dash-${tab.toLowerCase()}`}
                onClick={() => handleFilterSeverity(tab)}
                className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors cursor-pointer ${
                  filterSeverity === tab
                    ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 font-semibold'
                    : 'bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Status dropdown */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => handleFilterStatus(e.target.value)}
              className="bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-teal-500/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="DETECTED">Detected</option>
              <option value="TRIAGED">Triaged</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="MITIGATING">Mitigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {/* Table / List Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px] border-b border-slate-200/80 dark:border-white/[0.08]">
              <tr>
                <th className="py-2.5 px-3">Incident #</th>
                <th className="py-2.5 px-3">Title & Summary</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">Assigned Lead</th>
                <th className="py-2.5 px-3">Detected</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] font-sans">
              {paginatedIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500 font-mono">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500/80" />
                    <div className="font-sans font-medium text-slate-700 dark:text-slate-300">
                      {incidents.length === 0
                        ? 'No incidents recorded yet. All systems operational.'
                        : 'No incidents found matching current filter criteria.'}
                    </div>
                    {incidents.length === 0 ? (
                      <button
                        onClick={onOpenDeclareIncident}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-500 text-white font-sans text-xs font-medium cursor-pointer transition-colors"
                      >
                        <span>Declare Incident</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setFilterSeverity('ALL');
                          setFilterStatus('ALL');
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                        className="mt-2 text-xs text-teal-600 dark:text-teal-400 hover:underline cursor-pointer font-medium"
                      >
                        Reset all filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedIncidents.map((incident) => {
                  const isPrimary =
                    incident.severity === 'SEV-1' &&
                    ['DETECTED', 'TRIAGED', 'INVESTIGATING'].includes(incident.status);

                  return (
                    <tr
                      key={incident.id}
                      id={`incident-row-${incident.id}`}
                      onClick={() => onSelectIncident(incident.id)}
                      className={`group hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer ${
                        isPrimary ? 'bg-red-500/[0.03] dark:bg-red-500/[0.05]' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-medium text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isPrimary && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          )}
                          <span>{incident.incidentNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-xs md:max-w-md">
                        <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {incident.title}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {incident.impactSummary || incident.description}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <SeverityBadge severity={incident.severity} size="sm" />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={incident.status} size="sm" />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {incident.serviceName}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {incident.assignedEngineer || (
                          <span className="text-slate-400 dark:text-slate-600 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-400 dark:text-slate-500">
                        {new Date(incident.detectedTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 font-medium group-hover:underline">
                          <span>Investigate</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between text-xs">
            <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              Showing{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {Math.min(filteredIncidents.length, (currentPage - 1) * pageSize + 1)}
              </span>
              -
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {Math.min(filteredIncidents.length, currentPage * pageSize)}
              </span>{' '}
              of {filteredIncidents.length} incidents
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-xs text-slate-600 dark:text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
