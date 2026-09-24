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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1A2833]">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <span>Incident Registry</span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#101C25] text-[#2dd4bf] font-mono border border-teal-500/30">
              {filtered.length} of {incidents.length}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete historical and active production incident records with audit telemetry.
          </p>
        </div>

        <button
          onClick={onOpenDeclareIncident}
          disabled={currentUser.role === 'VIEWER'}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
            currentUser.role === 'VIEWER'
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-[#2dd4bf] hover:bg-[#20b2aa] text-[#080D11] shadow-md shadow-teal-950/40 cursor-pointer'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Declare Incident</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-xl bg-[#0D151C] border border-[#1A2833] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, title, summary, engineer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#070D12] border border-[#1A2833] rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#2dd4bf] font-mono"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Severity */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-mono text-slate-500">SEV:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#070D12] border border-[#1A2833] rounded px-2.5 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-[#2dd4bf]"
            >
              <option value="ALL">All Severities</option>
              <option value="SEV-1">SEV-1 (Critical)</option>
              <option value="SEV-2">SEV-2 (High)</option>
              <option value="SEV-3">SEV-3 (Medium)</option>
              <option value="SEV-4">SEV-4 (Low)</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-mono text-slate-500">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#070D12] border border-[#1A2833] rounded px-2.5 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-[#2dd4bf]"
            >
              <option value="ALL">All States</option>
              <option value="ACTIVE">Active (Unresolved)</option>
              <option value="DETECTED">DETECTED</option>
              <option value="TRIAGED">TRIAGED</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="MITIGATING">MITIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          {/* Service */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-mono text-slate-500">SERVICE:</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-[#070D12] border border-[#1A2833] rounded px-2.5 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-[#2dd4bf] max-w-[160px] truncate"
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
              className="text-[11px] font-mono text-[#2dd4bf] hover:underline px-1.5 py-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Incidents Table */}
      <div className="rounded-xl bg-[#0D151C] border border-[#1A2833] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#070D12] text-slate-400 font-mono uppercase text-[10px] border-b border-[#1A2833] tracking-wider">
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
            <tbody className="divide-y divide-[#1A2833] font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono">
                    <Filter className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <div>No incidents found matching criteria.</div>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSeverityFilter('ALL');
                        setStatusFilter('ALL');
                        setServiceFilter('ALL');
                      }}
                      className="mt-2 text-xs text-[#2dd4bf] hover:underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((incident) => {
                  const isPrimaryDemo = incident.id === 'inc-2026-00124';

                  return (
                    <tr
                      key={incident.id}
                      id={`incident-item-${incident.id}`}
                      onClick={() => onSelectIncident(incident.id)}
                      className={`group hover:bg-[#101C25]/70 transition-colors cursor-pointer ${
                        isPrimaryDemo ? 'bg-teal-500/5' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-100 group-hover:text-[#2dd4bf] transition-colors">
                        <div className="flex items-center gap-2">
                          {isPrimaryDemo && (
                            <span className="w-2 h-2 rounded-full bg-[#2dd4bf] animate-pulse shrink-0" />
                          )}
                          <span>{incident.incidentNumber}</span>
                        </div>
                      </td>

                      {/* Title & description */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-semibold text-slate-200 group-hover:text-white line-clamp-1">
                          {incident.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
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
                        <span className="font-mono text-xs text-slate-300 bg-[#070D12] px-2.5 py-1 rounded border border-[#1A2833]">
                          {incident.serviceName}
                        </span>
                      </td>

                      {/* Environment */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${
                            incident.environment === 'Production'
                              ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                              : 'bg-[#070D12] text-slate-400 border-[#1A2833]'
                          }`}
                        >
                          {incident.environment}
                        </span>
                      </td>

                      {/* Assigned Lead */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>{incident.assignedEngineer || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Detected Time */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                        {new Date(incident.detectedTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-[#2dd4bf] font-mono text-xs">
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
