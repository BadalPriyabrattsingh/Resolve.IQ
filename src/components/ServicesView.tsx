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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Service Catalog & Topology</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-white/[0.08]">
              {services.length} Registered
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Core microservices, owning engineering teams, SLAs, and active health states.
          </p>
        </div>

        {permissions.canManageServices && (
          <button
            onClick={onOpenAddService}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Service</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-lg bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service, owner, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded-md text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] text-slate-500">Tier:</span>
          <div className="flex items-center gap-1">
            {['ALL', 'TIER-1', 'TIER-2', 'TIER-3'].map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  tierFilter === tier
                    ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold border border-teal-500/30'
                    : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-white/[0.06]'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid or Empty State */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-xl bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] text-center space-y-3 shadow-xs">
          <Server className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {searchTerm || tierFilter !== 'ALL' ? 'No matching services found' : 'No Services Registered Yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchTerm || tierFilter !== 'ALL'
              ? 'Try adjusting your search query or tier filter.'
              : 'Register your production services, APIs, and microservices to monitor health status, track dependencies, and attach incidents.'}
          </p>
          {permissions.canManageServices && !searchTerm && tierFilter === 'ALL' && (
            <button
              onClick={onOpenAddService}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Service</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((srv) => {
          const activeIncidents = incidents.filter(
            (inc) => inc.serviceId === srv.id && !['RESOLVED', 'CLOSED'].includes(inc.status)
          );

          const isHealthy = srv.healthStatus === 'HEALTHY';
          const isDegraded = srv.healthStatus === 'DEGRADED';
          const isOutage = srv.healthStatus === 'OUTAGE';

          return (
            <div
              key={srv.id}
              className={`rounded-xl border p-4 space-y-4 transition-all bg-white dark:bg-[#121820] shadow-xs ${
                activeIncidents.length > 0
                  ? 'border-red-500/30'
                  : 'border-slate-200 dark:border-white/[0.08]'
              }`}
            >
              {/* Header: Name, Criticality & Health Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{srv.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]">
                      {srv.criticality}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {srv.environment}
                    </span>
                  </div>
                </div>

                {/* Health Badge */}
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono border ${
                      isHealthy
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                        : isDegraded
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                        : 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isHealthy ? 'bg-emerald-500' : isDegraded ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    />
                    <span>{srv.healthStatus}</span>
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {srv.description}
              </p>

              {/* Owning Team & Dependencies */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Building className="w-3.5 h-3.5" />
                    <span>Team:</span>
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{srv.owningTeam}</span>
                </div>

                {srv.dependencies && srv.dependencies.length > 0 && (
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="flex items-center gap-1 text-slate-500">
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>Deps:</span>
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                      {srv.dependencies.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Active Incident Warning or Quick Link */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                {activeIncidents.length > 0 ? (
                  <button
                    onClick={() => onSelectServiceIncidents(srv.id)}
                    className="inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium hover:underline cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{activeIncidents.length} Active Incident{activeIncidents.length > 1 ? 's' : ''}</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Normal operation</span>
                  </span>
                )}

                {/* SRE Health Override (if permitted) */}
                {permissions.canManageServices && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuickHealthChange(srv.id, isHealthy ? 'DEGRADED' : 'HEALTHY')}
                      disabled={updatingHealthId === srv.id}
                      title="Toggle simulated service degradation"
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <Wrench className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
