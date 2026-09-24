import React, { useState } from 'react';
import {
  Server,
  Plus,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Wrench,
  Search,
  Building,
  GitBranch,
} from 'lucide-react';
import { Service, ServiceHealth, User, ROLE_PERMISSIONS, Incident } from '../types';
import { api } from '../api';

interface ServicesViewProps {
  services: Service[];
  incidents: Incident[];
  currentUser: User;
  onOpenAddService: () => void;
  onSelectServiceIncidents: (serviceId: string) => void;
  onRefresh: () => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  incidents,
  currentUser,
  onOpenAddService,
  onSelectServiceIncidents,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [updatingHealthId, setUpdatingHealthId] = useState<string | null>(null);

  const permissions = ROLE_PERMISSIONS[currentUser.role];

  // Quick health status change
  const handleQuickHealthChange = async (serviceId: string, newHealth: ServiceHealth) => {
    try {
      setUpdatingHealthId(serviceId);
      await api.updateService(serviceId, { healthStatus: newHealth });
      onRefresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUpdatingHealthId(null);
    }
  };

  const filtered = services.filter((srv) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        srv.name.toLowerCase().includes(q) ||
        srv.description.toLowerCase().includes(q) ||
        srv.owningTeam.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (tierFilter !== 'ALL' && srv.criticality !== tierFilter) {
      return false;
    }
    return true;
  });

  const getHealthBadge = (health: ServiceHealth) => {
    switch (health) {
      case 'HEALTHY':
        return {
          bg: 'bg-teal-500/15 text-[#2dd4bf] border-teal-500/30',
          dot: 'bg-[#2dd4bf]',
        };
      case 'DEGRADED':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'OUTAGE':
        return {
          bg: 'bg-[#e07a5f]/15 text-[#fca5a5] border-[#e07a5f]/30',
          dot: 'bg-[#e07a5f] animate-ping',
        };
      case 'MAINTENANCE':
        return {
          bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          dot: 'bg-sky-400',
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-400 border-slate-700',
          dot: 'bg-slate-500',
        };
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E2631]">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-[#2dd4bf]" />
            <span>Service Catalog</span>
            <span className="text-xs px-2 py-0.2 rounded bg-[#111720] text-slate-400 font-mono border border-[#1E2631]">
              {services.length} services
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Topology, tier classification, telemetry health status, and linked incidents.
          </p>
        </div>

        <button
          onClick={onOpenAddService}
          disabled={!permissions.canManageServices}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            permissions.canManageServices
              ? 'bg-[#2dd4bf] hover:bg-[#20b2aa] text-[#0B0F14] font-semibold cursor-pointer shadow-sm'
              : 'bg-[#111720] text-slate-600 border border-[#1E2631] cursor-not-allowed'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Service</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="p-3 rounded-lg bg-[#111720] border border-[#1E2631] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service name, team, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0B0F14] border border-[#1E2631] rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#2dd4bf]/60 font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-500">Tier:</span>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-[#0B0F14] border border-[#1E2631] rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-[#2dd4bf]"
          >
            <option value="ALL">All Tiers</option>
            <option value="TIER-0">TIER-0 (Critical)</option>
            <option value="TIER-1">TIER-1 (High)</option>
            <option value="TIER-2">TIER-2 (Medium)</option>
            <option value="TIER-3">TIER-3 (Low)</option>
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((srv) => {
          const healthStyle = getHealthBadge(srv.healthStatus);
          const serviceIncidents = incidents.filter((inc) => inc.serviceId === srv.id);
          const openIncidents = serviceIncidents.filter((inc) =>
            ['DETECTED', 'TRIAGED', 'INVESTIGATING', 'MITIGATING'].includes(inc.status)
          );

          return (
            <div
              key={srv.id}
              id={`service-card-${srv.id}`}
              className="p-4 rounded-xl bg-[#0D151C] border border-[#1A2833] hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                      <span>{srv.name}</span>
                    </h3>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Team: {srv.owningTeam}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-mono font-semibold ${healthStyle.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${healthStyle.dot}`} />
                    <span>{srv.healthStatus}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {srv.description}
                </p>

                {/* Details Badges */}
                <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-[#101C25] text-slate-300 border border-[#1A2833]">
                    {srv.criticality}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#070D12] text-slate-400 border border-[#1A2833]">
                    Env: {srv.environment}
                  </span>
                  {srv.repositoryUrl && (
                    <a
                      href={srv.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#070D12] text-[#2dd4bf] hover:text-teal-300 border border-[#1A2833] hover:border-teal-500/40"
                    >
                      <GitBranch className="w-3 h-3" />
                      <span>Repo</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Bottom Actions & Incident counter */}
              <div className="pt-3 border-t border-[#182631] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Active Incidents:</span>
                  <button
                    onClick={() => onSelectServiceIncidents(srv.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                      openIncidents.length > 0
                        ? 'bg-[#e07a5f]/20 text-[#fca5a5] hover:bg-[#e07a5f]/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {openIncidents.length} active ({serviceIncidents.length} total)
                  </button>
                </div>

                {/* Health Status Quick Switcher (if authorized) */}
                {permissions.canManageServices && (
                  <div className="flex items-center justify-between pt-2 border-t border-[#182631] text-[11px] font-mono">
                    <span className="text-slate-500">Override Health:</span>
                    <select
                      value={srv.healthStatus}
                      disabled={updatingHealthId === srv.id}
                      onChange={(e) => handleQuickHealthChange(srv.id, e.target.value as ServiceHealth)}
                      className="bg-[#070D12] border border-[#1A2833] rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none"
                    >
                      <option value="HEALTHY">HEALTHY</option>
                      <option value="DEGRADED">DEGRADED</option>
                      <option value="OUTAGE">OUTAGE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
