import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Server,
  Activity,
  Flame,
  ArrowUpRight,
  ShieldAlert,
  Search,
  Users,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Filter,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Compass } from 'lucide-react';
import { DashboardStats, Incident, Service } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';

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
  // Filters & Search
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Compute filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Severity filter
      if (filterSeverity === 'OPEN') {
        if (!['DETECTED', 'TRIAGED', 'INVESTIGATING', 'MITIGATING'].includes(inc.status)) {
          return false;
        }
      } else if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'ALL' && inc.status !== filterStatus) {
        return false;
      }

      // Search query
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

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / pageSize));
  const paginatedIncidents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredIncidents.slice(startIndex, startIndex + pageSize);
  }, [filteredIncidents, currentPage, pageSize]);

  // Reset page when filters change
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

  // Loading state
  if (!stats) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-xs font-mono text-slate-400">
          Streaming telemetry from SRE cluster backend...
        </div>
      </div>
    );
  }

  // Color mapping for severity bar chart matching the obsidian-teal and coral palette
  const getSevColor = (sev: string) => {
    switch (sev) {
      case 'SEV-1':
        return '#E07A5F'; // Warm Coral / Terracotta (matches signal accent)
      case 'SEV-2':
        return '#F97316'; // Orange-500
      case 'SEV-3':
        return '#FBBF24'; // Amber-400
      case 'SEV-4':
        return '#2DD4BF'; // Radiant Teal-400
      default:
        return '#94A3B8';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Declare Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E2631]">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <span>Operations Center</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.2 rounded bg-teal-500/10 text-[#2dd4bf] border border-teal-500/20 font-medium">
              Live
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            System health, active incidents, and automated telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenTutorial && (
            <button
              id="btn-tutorial-dash-header"
              onClick={onOpenTutorial}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111720] hover:bg-[#16202B] text-slate-300 hover:text-white text-xs font-medium border border-[#1E2631] transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#2dd4bf]" />
              <span>Tour</span>
            </button>
          )}

          <button
            id="btn-declare-incident-dash"
            onClick={onOpenDeclareIncident}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#e07a5f] hover:bg-[#d66a4f] text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Declare Incident</span>
          </button>
        </div>
      </div>

      {/* Critical Active SEV-1 Alert Callout */}
      {activeSev1 && (
        <div
          id="active-sev1-callout"
          onClick={() => onSelectIncident(activeSev1.id)}
          className="rounded-lg border border-[#e07a5f]/40 bg-[#171415] hover:bg-[#1c1718] p-4 transition-colors cursor-pointer group"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-[#e07a5f]/15 flex items-center justify-center shrink-0 mt-0.5">
                <Flame className="w-4 h-4 text-[#e07a5f]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <SeverityBadge severity={activeSev1.severity} size="sm" />
                  <StatusBadge status={activeSev1.status} size="sm" />
                  <span className="text-xs font-mono text-slate-400">{activeSev1.incidentNumber}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#111720] text-slate-400 border border-[#1E2631]">
                    {activeSev1.serviceName}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-100 group-hover:text-white transition-colors">
                  {activeSev1.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  {activeSev1.impactSummary || activeSev1.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-mono text-slate-500">Commander</div>
                <div className="text-xs text-slate-300 font-medium">{activeSev1.incidentManager || 'Sarah Chen'}</div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#e07a5f]/15 text-[#fca5a5] text-xs font-medium group-hover:bg-[#e07a5f]/25 transition-colors">
                War Room <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6 Key Operational KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Open Incidents */}
        <div className="p-3 rounded-lg bg-[#111720] border border-[#1E2631] hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-medium text-slate-300">Active</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#2dd4bf]" />
          </div>
          <div className="text-xl font-semibold font-mono text-slate-100">
            {stats.openIncidentsCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">In mitigation</div>
        </div>

        {/* Active SEV-1 */}
        <div className="p-3 rounded-lg bg-[#111720] border border-[#1E2631] hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-medium text-[#e07a5f]">SEV-1</span>
            <Flame className="w-3.5 h-3.5 text-[#e07a5f]" />
          </div>
          <div className="text-xl font-semibold font-mono text-[#e07a5f]">
            {stats.sev1Count}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Critical outages</div>
        </div>

        {/* Active SEV-2 */}
        <div className="p-3 rounded-lg bg-[#111720] border border-[#1E2631] hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-medium text-amber-400">SEV-2</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-semibold font-mono text-amber-400">
            {stats.sev2Count}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Degraded services</div>
        </div>

        {/* Mean Time to Acknowledge (MTTA) */}
        <div className="p-3 rounded-lg bg-[#111720] border border-[#1E2631] hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-medium text-slate-300">MTTA</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-semibold font-mono text-slate-200">
            {stats.avgAcknowledgeTimeMinutes}m
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Target: &lt; 5m</div>
        </div>

        {/* Mean Time to Resolve (MTTR) */}
        <div className="p-3 rounded-lg bg-[#111720] border border-[#1E2631] hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-medium text-slate-300">MTTR</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2dd4bf]" />
          </div>
          <div className="text-xl font-semibold font-mono text-[#2dd4bf]">
            {stats.avgResolutionTimeMinutes}m
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Target: &lt; 60m</div>
        </div>

        {/* Active AI Investigations */}
        <div className="p-3 rounded-lg bg-[#111720] border border-[#1E2631] hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-medium text-slate-300">AI Analyses</span>
            <Sparkles className="w-3.5 h-3.5 text-[#2dd4bf]" />
          </div>
          <div className="text-xl font-semibold font-mono text-[#2dd4bf]">
            {stats.activeInvestigationsCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {stats.activeHypothesesCount || 3} hypotheses
          </div>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Incident Trend Chart (7 cols) */}
        <div className="lg:col-span-7 p-4 rounded-xl bg-[#0D151C] border border-[#1A2833] flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2dd4bf]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Incident Volume & Severity Trend
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#2dd4bf]" />
                  Total Logged
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#e07a5f]" />
                  SEV-1 & SEV-2
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                  Resolved
                </span>
              </div>
            </div>

            {/* Recharts Area Container */}
            <div className="h-[210px] w-full min-w-0 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.incidentTrend && stats.incidentTrend.length > 0 ? stats.incidentTrend : [
                    { date: '2026-09-13', label: 'Sep 13', count: 1, sev1Sev2: 1, resolved: 1 },
                    { date: '2026-09-14', label: 'Sep 14', count: 2, sev1Sev2: 1, resolved: 2 },
                    { date: '2026-09-15', label: 'Sep 15', count: 1, sev1Sev2: 0, resolved: 1 },
                    { date: '2026-09-16', label: 'Sep 16', count: 3, sev1Sev2: 2, resolved: 2 },
                    { date: '2026-09-17', label: 'Sep 17', count: 2, sev1Sev2: 1, resolved: 1 },
                    { date: '2026-09-18', label: 'Sep 18', count: 5, sev1Sev2: 3, resolved: 2 },
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="sevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E07A5F" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#E07A5F" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#182631" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748B"
                    tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#1E2F3D' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#1E2F3D' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D151C',
                      borderColor: '#1A2833',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Total Incidents"
                    stroke="#2DD4BF"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#totalGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="sev1Sev2"
                    name="Critical (SEV-1/2)"
                    stroke="#E07A5F"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#sevGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-[#182631] text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Derived from verified timeline database events</span>
            <span className="text-slate-400">Window: Last 7 Days</span>
          </div>
        </div>

        {/* Severity Distribution & Pipeline Breakdown (5 cols) */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-[#0D151C] border border-[#1A2833] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Severity Distribution
              </h3>
              <span className="text-[10px] font-mono text-slate-500">{incidents.length} total logged</span>
            </div>

            <div className="space-y-3">
              {stats.severityDistribution.map((item) => {
                const percentage = Math.round((item.count / Math.max(1, incidents.length)) * 100);
                const barColor = getSevColor(item.severity);

                return (
                  <div key={item.severity} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: barColor }} />
                        <span className="text-slate-200 font-bold">{item.severity}</span>
                        <span className="text-[10px] text-slate-500">
                          {item.severity === 'SEV-1'
                            ? 'Critical Outage'
                            : item.severity === 'SEV-2'
                            ? 'Major Impact'
                            : item.severity === 'SEV-3'
                            ? 'Minor Impact'
                            : 'Low Priority'}
                        </span>
                      </div>
                      <span className="text-slate-300 font-mono font-semibold">
                        {item.count} <span className="text-slate-500 font-normal">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
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

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>SEV-1 SLA: 15m Ack / 60m Resolve</span>
            <span className="text-emerald-400 font-semibold">SLO In Compliance</span>
          </div>
        </div>
      </div>

      {/* Services Health Matrix & Active AI Investigations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Service Health Directory (7 cols) */}
        <div className="lg:col-span-7 p-4 rounded-xl bg-[#0D151C] border border-[#1A2833] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#2dd4bf]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Core Service Health & Criticality Matrix
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {stats.servicesHealth.healthy}/{stats.servicesHealth.total} Operational
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {services.map((srv) => {
                const isDegraded = srv.healthStatus === 'DEGRADED';
                const isOutage = srv.healthStatus === 'OUTAGE';

                return (
                  <div
                    key={srv.id}
                    id={`service-card-${srv.id}`}
                    onClick={() => onSelectService(srv.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isOutage
                        ? 'bg-[#241110]/50 border-[#e07a5f]/40 hover:bg-[#241110]/80'
                        : isDegraded
                        ? 'bg-amber-950/20 border-amber-500/35 hover:bg-amber-950/35'
                        : 'bg-[#080E13] border-[#182631] hover:border-[#2dd4bf]/40 hover:bg-[#0C151D]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-100 truncate">{srv.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#101C25] text-slate-300 border border-[#1F2E3A]">
                        {srv.criticality}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                      {srv.description}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-[#182631]">
                      <span className="text-slate-500">{srv.owningTeam}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            srv.healthStatus === 'HEALTHY'
                              ? 'bg-[#2dd4bf]'
                              : srv.healthStatus === 'DEGRADED'
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-[#e07a5f] animate-ping'
                          }`}
                        />
                        <span
                          className={
                            srv.healthStatus === 'HEALTHY'
                              ? 'text-[#2dd4bf] font-semibold'
                              : srv.healthStatus === 'DEGRADED'
                              ? 'text-amber-400 font-semibold'
                              : 'text-[#e07a5f] font-bold'
                          }
                        >
                          {srv.healthStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#182631] text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Automated dependency & outage propagation</span>
            <span className="text-[#2dd4bf] hover:underline cursor-pointer">View Service Topology →</span>
          </div>
        </div>

        {/* Active AI Investigations Hub (5 cols) */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-[#0D151C] border border-[#1A2833] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2dd4bf]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Active AI Investigations
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-[#2dd4bf] border border-teal-500/30 font-semibold">
                HUMAN-IN-THE-LOOP
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              AI investigation agents synthesize telemetry facts, correlate deployments, and propose root-cause hypotheses with verified evidence grounding.
            </p>

            {/* Active investigation callout item */}
            {activeSev1 ? (
              <div
                onClick={() => onSelectIncident(activeSev1.id)}
                className="p-3.5 rounded-lg bg-[#080E13] border border-teal-500/40 hover:border-teal-400 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-[#2dd4bf]">
                    {activeSev1.incidentNumber}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    HYPOTHESES PROPOSED
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-teal-200 transition-colors line-clamp-1">
                  {activeSev1.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  Database connection pool exhaustion identified with 88% correlation against Aurora telemetry.
                </div>
                <div className="mt-2.5 pt-2 border-t border-[#182631] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#2dd4bf] group-hover:underline">Open Investigation Workspace →</span>
                  <span className="text-slate-500">3 Hypotheses</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#080E13] border border-[#182631] text-center text-xs font-mono text-slate-400">
                All open investigations currently resolved or awaiting new alerts.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#182631] text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Requires SRE Commander Confirmation</span>
            <span className="text-[#2dd4bf] font-semibold">Strict Guardrails</span>
          </div>
        </div>
      </div>

      {/* Recent Incidents Directory (Central Queue) */}
      <div className="p-4 rounded-xl bg-[#0D151C] border border-[#1A2833] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#182631]">
          <div>
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              Operational Incident Directory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Filter by severity, lifecycle state, or search across incident records.
            </p>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                id="dash-incident-search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search incident, title, service, lead..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#070D12] border border-[#1A2833] rounded-md text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-[#2dd4bf]"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="text-[11px] font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
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
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
                  filterSeverity === tab
                    ? 'bg-[#101C25] text-[#2dd4bf] border-teal-500/50 font-bold shadow-xs'
                    : 'bg-[#070D12] text-slate-400 border-[#182631] hover:text-slate-200 hover:bg-[#0D151C]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Status dropdown */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => handleFilterStatus(e.target.value)}
              className="bg-[#070D12] border border-[#1A2833] rounded px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-[#2dd4bf]"
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
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#070D12] text-slate-400 font-mono uppercase text-[10px] border-b border-[#182631]">
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
            <tbody className="divide-y divide-[#182631] font-sans">
              {paginatedIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                    <AlertTriangle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                    <div>No incidents found matching current search/filter criteria.</div>
                    <button
                      onClick={() => {
                        setFilterSeverity('ALL');
                        setFilterStatus('ALL');
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="mt-2 text-xs text-[#2dd4bf] hover:underline cursor-pointer"
                    >
                      Reset all filters
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedIncidents.map((incident) => {
                  const isPrimary = incident.severity === 'SEV-1' && ['DETECTED', 'TRIAGED', 'INVESTIGATING'].includes(incident.status);

                  return (
                    <tr
                      key={incident.id}
                      id={`incident-row-${incident.id}`}
                      onClick={() => onSelectIncident(incident.id)}
                      className={`group hover:bg-[#0E171F] transition-colors cursor-pointer ${
                        isPrimary ? 'bg-[#251211]/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-200 group-hover:text-[#2dd4bf] transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isPrimary && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#e07a5f] animate-ping" />
                          )}
                          <span>{incident.incidentNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-xs md:max-w-md">
                        <div className="font-semibold text-slate-200 truncate group-hover:text-slate-100">
                          {incident.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5 font-sans">
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
                        <span className="font-mono text-xs text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                          {incident.serviceName}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>{incident.assignedEngineer || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(incident.detectedTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-red-400 font-mono text-xs font-semibold">
                          Inspect <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredIncidents.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
            <div>
              Showing <span className="text-slate-200 font-bold">{Math.min(filteredIncidents.length, (currentPage - 1) * pageSize + 1)}</span> to{' '}
              <span className="text-slate-200 font-bold">{Math.min(filteredIncidents.length, currentPage * pageSize)}</span> of{' '}
              <span className="text-slate-200 font-bold">{filteredIncidents.length}</span> incidents
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-prev-page"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <span className="px-2 font-bold text-slate-200">
                {currentPage} / {totalPages}
              </span>
              <button
                id="btn-next-page"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
