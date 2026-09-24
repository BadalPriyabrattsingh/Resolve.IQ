import React from 'react';
import { Users, Check, X as Cross, Shield, Key } from 'lucide-react';
import { User, UserRole, ROLE_PERMISSIONS } from '../types';

interface RbacMatrixViewProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
}

export const RbacMatrixView: React.FC<RbacMatrixViewProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
}) => {
  const permissionsList = [
    { key: 'canCreateIncident', label: 'Declare New Incident', desc: 'Ability to trigger incident creation in any service' },
    { key: 'canChangeStatus', label: 'Advance Incident Status', desc: 'Transition between INVESTIGATING, MITIGATING, RESOLVED, CLOSED' },
    { key: 'canChangeSeverity', label: 'Adjust Incident Severity', desc: 'Escalate or downgrade SEV-1 through SEV-4' },
    { key: 'canAssignEngineer', label: 'Assign Incident Roles', desc: 'Assign lead engineer and incident commander' },
    { key: 'canAddEvidence', label: 'Attach Evidence & Logs', desc: 'Upload telemetry, stack traces, metrics snapshots, and comments' },
    { key: 'canManageServices', label: 'Manage Service Catalog', desc: 'Register new services, edit topology, and override health status' },
    { key: 'canDeleteIncident', label: 'Delete / Purge Incident', desc: 'Permanently remove incident records from data store' },
  ];

  const roles: UserRole[] = ['ADMIN', 'INCIDENT_MANAGER', 'ENGINEER', 'VIEWER'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-[#1E2631]">
        <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#2dd4bf]" />
          <span>Access Control & Team Personas</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Role-based permissions governing incident triage, service administration, and evidence management.
        </p>
      </div>

      {/* Active User Persona Cards */}
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2.5">
          Switch Active Persona
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {allUsers.map((u) => {
            const isCurrent = u.id === currentUser.id;

            return (
              <div
                key={u.id}
                onClick={() => onSwitchUser(u.id)}
                className={`p-3.5 rounded-lg border transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[#16202B] border-[#2dd4bf]/40'
                    : 'bg-[#111720] border-[#1E2631] hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#1A232F] border border-[#232F3E] flex items-center justify-center text-xs font-mono font-bold text-slate-200 overflow-hidden">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      u.name[0]
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.2 rounded border font-semibold ${
                      u.role === 'ADMIN'
                        ? 'bg-[#e07a5f]/15 text-[#fca5a5] border-[#e07a5f]/30'
                        : u.role === 'INCIDENT_MANAGER'
                        ? 'bg-teal-500/15 text-[#2dd4bf] border-teal-500/30'
                        : u.role === 'ENGINEER'
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        : 'bg-[#16202B] text-slate-400 border-[#232F3E]'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>

                <div className="font-medium text-sm text-slate-100">{u.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">{u.title}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{u.email}</div>

                <div className="mt-3 pt-2.5 border-t border-[#1E2631] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">
                    {isCurrent ? (
                      <span className="text-[#2dd4bf] font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active persona
                      </span>
                    ) : (
                      'Select to switch'
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="p-4 rounded-lg bg-[#111720] border border-[#1E2631]">
        <div className="mb-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300">
            Permission Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time permission capabilities checked on user actions.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead className="bg-[#0B0F14] text-slate-400 uppercase text-[10px] border-b border-[#1E2631]">
              <tr>
                <th className="py-2.5 px-3">Capability</th>
                {roles.map((r) => (
                  <th key={r} className="py-2.5 px-3 text-center">
                    <span className={r === currentUser.role ? 'text-[#2dd4bf] font-semibold' : ''}>
                      {r} {r === currentUser.role && '(You)'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2631] font-sans">
              {permissionsList.map((p) => (
                <tr key={p.key} className="hover:bg-[#16202B]/40 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-200 text-xs">{p.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{p.desc}</div>
                  </td>
                  {roles.map((role) => {
                    const allowed = (ROLE_PERMISSIONS[role] as any)[p.key];
                    return (
                      <td key={role} className="py-2.5 px-3 text-center">
                        {allowed ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-500/10 text-[#2dd4bf]">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#16202B] text-slate-600">
                            <Cross className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
