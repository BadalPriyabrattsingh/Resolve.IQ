import React, { useState } from 'react';
import { Server, X } from 'lucide-react';
import { ServiceCriticality, ServiceHealth, Environment } from '../types';
import { api } from '../api';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceCreated: () => void;
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  onServiceCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [owningTeam, setOwningTeam] = useState('');
  const [criticality, setCriticality] = useState<ServiceCriticality>('TIER-1');
  const [healthStatus, setHealthStatus] = useState<ServiceHealth>('HEALTHY');
  const [environment, setEnvironment] = useState<Environment>('Production');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Service name is required.');
      return;
    }
    if (!owningTeam.trim()) {
      setFormError('Owning team is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await api.createService({
        name: name.trim(),
        description: description.trim(),
        owningTeam: owningTeam.trim(),
        criticality,
        healthStatus,
        environment,
        repositoryUrl: repositoryUrl.trim() || undefined,
      });

      onServiceCreated();
      onClose();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                Register Microservice
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add service to topology matrix, telemetry router, and incident SLA catalog.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs font-mono">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-semibold block">
              Service Name <span className="text-teal-600 dark:text-teal-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. auth-gateway-service"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded text-slate-900 dark:text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-semibold block">
              Owning Engineering Team <span className="text-teal-600 dark:text-teal-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Identity & Access Team"
              value={owningTeam}
              onChange={(e) => setOwningTeam(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded text-slate-900 dark:text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold block">Criticality Tier</label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value as ServiceCriticality)}
                className="w-full p-2 bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded text-slate-900 dark:text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="TIER-1">TIER-1 (Mission Critical)</option>
                <option value="TIER-2">TIER-2 (Core Business)</option>
                <option value="TIER-3">TIER-3 (Internal / Supporting)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold block">Initial Health</label>
              <select
                value={healthStatus}
                onChange={(e) => setHealthStatus(e.target.value as ServiceHealth)}
                className="w-full p-2 bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded text-slate-900 dark:text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="HEALTHY">HEALTHY</option>
                <option value="DEGRADED">DEGRADED</option>
                <option value="OUTAGE">OUTAGE</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-semibold block">Description</label>
            <textarea
              rows={2}
              placeholder="Primary responsibilities and architecture notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded text-slate-900 dark:text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-semibold block">Repository URL (Optional)</label>
            <input
              type="text"
              placeholder="e.g. github.com/corp/auth-gateway"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded text-slate-900 dark:text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono rounded bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-mono font-bold rounded bg-teal-600 hover:bg-teal-500 text-white shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Server className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Registering...' : 'Register Service'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
