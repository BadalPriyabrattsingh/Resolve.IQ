import React, { useState } from 'react';
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
} from 'lucide-react';
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
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  incidents,
  services,
  onSelectIncident,
  onOpenDeclareIncident,
  onSelectService,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  if (!stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400 font-mono text-sm">
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span>Polling telemetry from cluster backend...</span>
        </div>
      </div>
    );
  }

  // Filtered recent incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity === 'ALL') return true;
    if (filterSeverity === 'OPEN') return ['DETECTED', 'TRIAGED', 'INVESTIGATING', 'MITIGATING'].includes(inc.status);
    return inc.severity === filterSeverity;
  }).slice(0, 7);

  // Critical banner incident (INC-2026-00124 if open, or top SEV-1)
  const activeSev1 = incidents.find(
    (i) => i.severity === 'SEV-1' && ['DETECTED', 'TRIAGED', 'INVESTIGATING', 'MITIGATING'].includes(i.status)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 font-mono">
              SRE Operations Command Center
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-semibold">
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time incident response, critical path telemetry, and service degradation tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDeclareIncident}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/50 border border-red-500/70 transition-all cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Declare Incident</span>
          </button>
        </div>
      </div>

      {/* Critical Active SEV-1 Alert Callout */}
      {activeSev1 && (
        <div
          id="active-sev1-callout"
          onClick={() => onSelectIncident(activeSev1.id)}
          className="relative overflow-hidden rounded-xl border border-red-500/50 bg-gradient-to-r from-red-950/40 via-red-900/20 to-slate-900/60 p-4 md:p-5 shadow-lg shadow-red-950/20 cursor-pointer hover:border-red-400 transition-all group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <Flame className="w-5 h-5 text-red-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <SeverityBadge severity={activeSev1.severity} size="sm" />
                  <StatusBadge status={activeSev1.status} size="sm" />
                  <span className="text-xs font-mono text-slate-400">{activeSev1.incidentNumber}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {activeSev1.serviceName}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-red-300 transition-colors">
                  {activeSev1.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl line-clamp-1">
                  {activeSev1.impactSummary || activeSev1.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-mono uppercase text-slate-500">Commander</div>
                <div className="text-xs text-slate-300 font-medium">{activeSev1.incidentManager || 'Unassigned'}</div>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono font-semibold group-hover:bg-red-500/30 transition-colors">
                Enter War Room <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6 Key Operational KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Open Incidents */}
        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono text-[11px]">OPEN INCIDENTS</span>
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {stats.openIncidentsCount}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">Across all tiers</div>
        </div>

        {/* Critical Incidents (SEV-1 & 2) */}
        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-red-950/60">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono text-[11px] text-red-400">CRITICAL PATH</span>
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {stats.criticalIncidentsCount}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">SEV-1 + SEV-2 open</div>
        </div>

        {/* Active SEV-1 */}
        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono text-[11px] text-rose-300">ACTIVE SEV-1</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300">
            {stats.sev1Count}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">Immediate outage</div>
        </div>

        {/* Active SEV-2 */}
        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono text-[11px] text-orange-300">ACTIVE SEV-2</span>
            <Activity className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-orange-300">
            {stats.sev2Count}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">High severity triage</div>
        </div>

        {/* Active Investigations */}
        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono text-[11px] text-blue-300">INVESTIGATING</span>
            <Search className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-300">
            {stats.activeInvestigationsCount}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">War rooms staffed</div>
        </div>

        {/* Mean Time to Resolve (MTTR) */}
        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono text-[11px] text-emerald-400">AVG MTTR</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {stats.avgResolutionTimeMinutes}m
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">Target: &lt; 45m</div>
        </div>
      </div>

      {/* Middle Grid: Charts & Service Health Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Severity Distribution Visual Breakdown */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Incident Severity Distribution
              </h3>
              <span className="text-[10px] font-mono text-slate-500">{incidents.length} total logged</span>
            </div>

            <div className="space-y-3">
              {stats.severityDistribution.map((item) => {
                const percentage = Math.round((item.count / Math.max(1, incidents.length)) * 100);
                const barColor =
                  item.severity === 'SEV-1'
                    ? 'bg-red-500'
                    : item.severity === 'SEV-2'
                    ? 'bg-orange-500'
                    : item.severity === 'SEV-3'
                    ? 'bg-amber-400'
                    : 'bg-sky-400';

                return (
                  <div key={item.severity} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${barColor}`} />
                        <span className="text-slate-300 font-semibold">{item.severity}</span>
                      </div>
                      <span className="text-slate-400">
                        {item.count} <span className="text-slate-600">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(4, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>SEV-1 SLA: 15m Ack / 60m Resolve</span>
            <span className="text-slate-400">SRE Rule 2.4</span>
          </div>
        </div>

        {/* Incident Lifecycle Pipeline Distribution */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Incident State Pipeline
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">FLOW MONITOR</span>
            </div>

            <div className="space-y-2.5">
              {stats.statusDistribution.map((item) => {
                return (
                  <div key={item.status} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} size="sm" showIcon={false} />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-200 font-bold">{item.count}</span>
                      <span className="text-[10px] text-slate-500">
                        {['RESOLVED', 'CLOSED'].includes(item.status) ? 'Terminal' : 'Active'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Automated state validation</span>
            <span className="text-emerald-400">SYNCED</span>
          </div>
        </div>

        {/* Service Health Matrix */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Service Health
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {stats.servicesHealth.healthy}/{stats.servicesHealth.total} Healthy
              </span>
            </div>

            <div className="space-y-2">
              {services.map((srv) => {
                const isDegraded = srv.healthStatus === 'DEGRADED';
                const isOutage = srv.healthStatus === 'OUTAGE';

                return (
                  <div
                    key={srv.id}
                    onClick={() => onSelectService(srv.id)}
                    className={`flex items-center justify-between p-2 rounded border transition-colors cursor-pointer ${
                      isDegraded || isOutage
                        ? 'bg-amber-950/20 border-amber-500/30 hover:bg-amber-950/30'
                        : 'bg-slate-950/50 border-slate-800/60 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">{srv.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {srv.criticality}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{srv.owningTeam}</div>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          srv.healthStatus === 'HEALTHY'
                            ? 'bg-emerald-400'
                            : srv.healthStatus === 'DEGRADED'
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-red-500 animate-ping'
                        }`}
                      />
                      <span
                        className={
                          srv.healthStatus === 'HEALTHY'
                            ? 'text-emerald-400 font-semibold'
                            : srv.healthStatus === 'DEGRADED'
                            ? 'text-amber-400 font-semibold'
                            : 'text-red-400 font-bold'
                        }
                      >
                        {srv.healthStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>6/6 services connected</span>
            <span className="text-blue-400">Click to inspect</span>
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider">
              Recent Incidents Directory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live operational incident queue with severity triage.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['ALL', 'OPEN', 'SEV-1', 'SEV-2', 'SEV-3', 'SEV-4'].map((tab) => (
              <button
                key={tab}
                id={`filter-dash-${tab.toLowerCase()}`}
                onClick={() => setFilterSeverity(tab)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                  filterSeverity === tab
                    ? 'bg-slate-800 text-slate-100 border-slate-600 font-bold'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                    No incidents match filter: {filterSeverity}
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => {
                  const isPrimaryDemo = incident.id === 'inc-2026-00124';

                  return (
                    <tr
                      key={incident.id}
                      id={`incident-row-${incident.id}`}
                      onClick={() => onSelectIncident(incident.id)}
                      className={`group hover:bg-slate-850/60 transition-colors cursor-pointer ${
                        isPrimaryDemo ? 'bg-red-950/15' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-200 group-hover:text-red-300 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isPrimaryDemo && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                          )}
                          <span>{incident.incidentNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-xs md:max-w-md">
                        <div className="font-semibold text-slate-200 truncate group-hover:text-slate-100">
                          {incident.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
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
                        <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-red-400 font-mono text-xs">
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
      </div>
    </div>
  );
};
