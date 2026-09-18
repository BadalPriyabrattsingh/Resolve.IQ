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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100">
                Register New Service
              </h2>
              <p className="text-xs text-slate-400">
                Add an infrastructure or application tier to the topology catalog.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="p-2.5 rounded bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">
              Service Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ledger Service / API Gateway"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-red-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">
              Owning Engineering Team <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Core Banking / SRE Platform"
              value={owningTeam}
              onChange={(e) => setOwningTeam(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-red-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Criticality Tier</label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value as ServiceCriticality)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none"
              >
                <option value="TIER-0">TIER-0 (Immediate Outage Impact)</option>
                <option value="TIER-1">TIER-1 (High Impact)</option>
                <option value="TIER-2">TIER-2 (Medium Impact)</option>
                <option value="TIER-3">TIER-3 (Low / Internal)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Current Health</label>
              <select
                value={healthStatus}
                onChange={(e) => setHealthStatus(e.target.value as ServiceHealth)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none"
              >
                <option value="HEALTHY">HEALTHY</option>
                <option value="DEGRADED">DEGRADED</option>
                <option value="OUTAGE">OUTAGE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Description & Purpose</label>
            <textarea
              rows={2}
              placeholder="Primary responsibilities, SLA targets, and downstream dependencies..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-red-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Repository URL</label>
            <input
              type="text"
              placeholder="e.g. https://github.com/org/repo-service"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-red-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-mono rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-mono font-bold rounded bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
