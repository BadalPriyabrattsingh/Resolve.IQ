import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Service, Severity, User } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { api } from '../api';

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  allUsers: User[];
  onIncidentCreated: (newIncidentId: string) => void;
}

export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isOpen,
  onClose,
  services,
  allUsers,
  onIncidentCreated,
}) => {
  const [title, setTitle] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [severity, setSeverity] = useState<Severity>('SEV-2');
  const [environment, setEnvironment] = useState<'Production' | 'Staging' | 'Canary'>('Production');
  const [customerImpact, setCustomerImpact] = useState(true);
  const [impactSummary, setImpactSummary] = useState('');
  const [description, setDescription] = useState('');
  const [assignedEngineer, setAssignedEngineer] = useState('');
  const [incidentManager, setIncidentManager] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Incident title is required.');
      return;
    }
    if (!serviceId) {
      setFormError('Please select an impacted service.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const newInc = await api.createIncident({
        title: title.trim(),
        description: description.trim() || title.trim(),
        severity,
        serviceId,
        environment,
        customerImpact,
        impactSummary: impactSummary.trim(),
        assignedEngineer: assignedEngineer || undefined,
        incidentManager: incidentManager || undefined,
      });

      onIncidentCreated(newInc.id);
      onClose();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0D151C] border border-[#1A2833] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A2833]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#e07a5f]/20 text-[#fca5a5] border border-[#e07a5f]/40">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-slate-100">
                Declare Production Incident
              </h2>
              <p className="text-xs text-slate-400">
                Initializes incident timeline, notifies on-call rota, and provisions war room.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#101C25] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded bg-[#e07a5f]/15 border border-[#e07a5f]/40 text-[#fca5a5] text-xs font-mono">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {/* Incident Title */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">
              Incident Title <span className="text-[#2dd4bf]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Payment Gateway 500 error rate elevated to 8.4%"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-[#070D12] border border-[#1A2833] rounded text-slate-200 focus:outline-none focus:border-[#2dd4bf]"
            />
          </div>

          {/* Severity & Service Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Severity */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Severity Level</label>
              <div className="grid grid-cols-2 gap-2">
                {(['SEV-1', 'SEV-2', 'SEV-3', 'SEV-4'] as Severity[]).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`p-2 rounded border text-left flex items-center justify-between cursor-pointer ${
                      severity === sev
                        ? 'bg-[#101C25] border-teal-500/80 text-white font-bold'
                        : 'bg-[#070D12] border-[#1A2833] text-slate-400 hover:bg-[#0D151C]'
                    }`}
                  >
                    <SeverityBadge severity={sev} size="sm" />
                  </button>
                ))}
              </div>
            </div>

            {/* Impacted Service */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">
                Impacted Service <span className="text-[#2dd4bf]">*</span>
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full p-2.5 bg-[#070D12] border border-[#1A2833] rounded text-slate-200 focus:outline-none focus:border-[#2dd4bf]"
              >
                {services.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name} ({srv.criticality})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Environment & Customer Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Target Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                className="w-full p-2.5 bg-[#070D12] border border-[#1A2833] rounded text-slate-200 focus:outline-none focus:border-[#2dd4bf]"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="Canary">Canary</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Customer Impact</label>
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="impact"
                    checked={customerImpact}
                    onChange={() => setCustomerImpact(true)}
                    className="accent-[#2dd4bf]"
                  />
                  <span>Active Customer Outage</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                  <input
                    type="radio"
                    name="impact"
                    checked={!customerImpact}
                    onChange={() => setCustomerImpact(false)}
                    className="accent-[#2dd4bf]"
                  />
                  <span>Internal / Degraded Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Customer Impact Summary */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Customer Impact Summary</label>
            <input
              type="text"
              placeholder="e.g. Users encountering HTTP 500 on checkout step 2"
              value={impactSummary}
              onChange={(e) => setImpactSummary(e.target.value)}
              className="w-full p-2 bg-[#070D12] border border-[#1A2833] rounded text-slate-200 focus:outline-none focus:border-[#2dd4bf]"
            />
          </div>

          {/* Detailed Description */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Technical Context & Symptoms</label>
            <textarea
              rows={3}
              placeholder="Provide log traces, observed error spikes, relevant release IDs..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-[#070D12] border border-[#1A2833] rounded text-slate-200 focus:outline-none focus:border-[#2dd4bf]"
            />
          </div>

          {/* Initial Personnel Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-400 block">Assign Lead Engineer</label>
              <select
                value={assignedEngineer}
                onChange={(e) => setAssignedEngineer(e.target.value)}
                className="w-full p-2 bg-[#070D12] border border-[#1A2833] rounded text-slate-300 focus:outline-none"
              >
                <option value="">-- Auto-assign on-call --</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 block">Incident Commander</label>
              <select
                value={incidentManager}
                onChange={(e) => setIncidentManager(e.target.value)}
                className="w-full p-2 bg-[#070D12] border border-[#1A2833] rounded text-slate-300 focus:outline-none"
              >
                <option value="">-- Auto-assign manager --</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A2833]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono rounded bg-[#101C25] text-slate-300 hover:bg-[#182631] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-mono font-bold rounded bg-[#2dd4bf] hover:bg-[#20b2aa] text-[#080D11] shadow-lg shadow-teal-950/50 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Declaring...' : 'Declare Incident'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
