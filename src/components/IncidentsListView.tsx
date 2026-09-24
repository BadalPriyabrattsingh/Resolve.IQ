import React, { useState } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  Clock,
  Building,
  User as UserIcon,
} from 'lucide-react';
import { Incident, Service, Severity, IncidentStatus, User } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';

interface IncidentsListViewProps {
  incidents: Incident[];
  services: Service[];
  currentUser: User;
  onSelectIncident: (id: string) => void;
  onOpenDeclareIncident: () => void;
  onQuickStatusChange?: (incidentId: string, newStatus: IncidentStatus) => void;
}

export const IncidentsListView: React.FC<IncidentsListViewProps> = ({
  incidents,
  services,
  currentUser,
  onSelectIncident,
  onOpenDeclareIncident,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');

  // Filter incidents
  const filtered = incidents.filter((inc) => {
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        inc.incidentNumber.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        inc.serviceName.toLowerCase().includes(q) ||
        (inc.assignedEngineer && inc.assignedEngineer.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Severity
    if (severityFilter !== 'ALL' && inc.severity !== severityFilter) {
      return false;
    }

    // Status
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ACTIVE') {
        if (['RESOLVED', 'CLOSED'].includes(inc.status)) return false;
      } else if (inc.status !== statusFilter) {
        return false;
      }
    }

    // Service
    if (serviceFilter !== 'ALL' && inc.serviceId !== serviceFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Incident Directory</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-white/[0.08]">
              {filtered.length} of {incidents.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historical and active production incident records with audit telemetry.
          </p>
        </div>

        <button
          onClick={onOpenDeclareIncident}
          disabled={currentUser.role === 'VIEWER'}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            currentUser.role === 'VIEWER'
              ? 'bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-white/[0.08] cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-xs cursor-pointer'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Declare Incident</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-lg bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, title, summary, engineer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded-md text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Severity */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-500">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All</option>
              <option value="SEV-1">SEV-1</option>
              <option value="SEV-2">SEV-2</option>
              <option value="SEV-3">SEV-3</option>
              <option value="SEV-4">SEV-4</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="DETECTED">Detected</option>
              <option value="TRIAGED">Triaged</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="MITIGATING">Mitigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Service */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-500">Service:</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-teal-500 max-w-[150px] truncate"
            >
              <option value="ALL">All Services</option>
              {services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name}
                </option>
              ))}
            </select>
          </div>

          {(searchTerm || severityFilter !== 'ALL' || statusFilter !== 'ALL' || serviceFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSeverityFilter('ALL');
                setStatusFilter('ALL');
                setServiceFilter('ALL');
              }}
              className="text-[11px] font-mono text-teal-600 dark:text-teal-400 hover:underline px-1.5 py-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Incidents Table */}
      <div className="rounded-xl bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-[#0C1015] text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px] border-b border-slate-200 dark:border-white/[0.08] tracking-wider">
              <tr>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Title & Context</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Impacted Service</th>
                <th className="py-3 px-3">Environment</th>
                <th className="py-3 px-3">Assigned Lead</th>
                <th className="py-3 px-3">Detected At</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {incidents.length === 0 ? 'No incidents reported yet' : 'No incidents matching filters'}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      {incidents.length === 0
                        ? 'All monitored systems and services are operating normally without active outages.'
                        : 'Try resetting your search query or severity/status filters.'}
                    </p>
                    {incidents.length === 0 ? (
                      <button
                        onClick={onOpenDeclareIncident}
                        disabled={currentUser.role === 'VIEWER'}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-medium cursor-pointer shadow-xs transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Declare Incident</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSeverityFilter('ALL');
                          setStatusFilter('ALL');
                          setServiceFilter('ALL');
                        }}
                        className="mt-3 text-xs text-teal-600 dark:text-teal-400 hover:underline cursor-pointer font-medium"
                      >
                        Reset filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((incident) => {
                  const isCriticalActive = incident.severity === 'SEV-1' && ['DETECTED', 'TRIAGED', 'INVESTIGATING'].includes(incident.status);

                  return (
                    <tr
                      key={incident.id}
                      id={`incident-item-${incident.id}`}
                      onClick={() => onSelectIncident(incident.id)}
                      className={`group hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer ${
                        isCriticalActive ? 'bg-red-500/[0.03] dark:bg-red-500/[0.05]' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        <div className="flex items-center gap-2">
                          {isCriticalActive && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                          )}
                          <span>{incident.incidentNumber}</span>
                        </div>
                      </td>

                      {/* Title & description */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-300 line-clamp-1">
                          {incident.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {incident.impactSummary || incident.description}
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <SeverityBadge severity={incident.severity} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <StatusBadge status={incident.status} size="sm" />
                      </td>

                      {/* Service */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.04] px-2.5 py-1 rounded border border-slate-200 dark:border-white/[0.06]">
                          {incident.serviceName}
                        </span>
                      </td>

                      {/* Environment */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${
                            incident.environment === 'Production'
                              ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20'
                              : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.06]'
                          }`}
                        >
                          {incident.environment}
                        </span>
                      </td>

                      {/* Assigned Lead */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{incident.assignedEngineer || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Detected Time */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        {new Date(incident.detectedTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 font-mono text-xs font-medium">
                          War Room <ArrowUpRight className="w-3.5 h-3.5" />
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
