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
      <div className="pb-3 border-b border-slate-800/80">
        <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-400" />
          <span>Role-Based Access Control (RBAC) System</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Enforced server-side permissions across all API endpoints with client-side capability synchronization.
        </p>
      </div>

      {/* Active User Persona Cards */}
      <div>
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
          Available Personas (Click to Switch Identity)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allUsers.map((u) => {
            const isCurrent = u.id === currentUser.id;

            return (
              <div
                key={u.id}
                onClick={() => onSwitchUser(u.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-850 border-red-500/60 ring-1 ring-red-500/30'
                    : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-mono font-bold text-slate-200 overflow-hidden">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      u.name[0]
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                      u.role === 'ADMIN'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : u.role === 'INCIDENT_MANAGER'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : u.role === 'ENGINEER'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-slate-700/40 text-slate-300 border-slate-600'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>

                <div className="font-bold text-sm text-slate-100">{u.name}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{u.title}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">{u.email}</div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">
                    {isCurrent ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> ACTIVE PERSONA
                      </span>
                    ) : (
                      'Switch to this role'
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
        <div className="mb-4">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200">
            Authorization & Privilege Breakdown
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time evaluated permission checks configured in <code className="text-slate-300">src/types.ts</code> and guarded in <code className="text-slate-300">server.ts</code>.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Operation / Permission</th>
                {roles.map((r) => (
                  <th key={r} className="py-3 px-4 text-center">
                    <span className={r === currentUser.role ? 'text-red-400 font-bold' : ''}>
                      {r} {r === currentUser.role && '(YOU)'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {permissionsList.map((p) => (
                <tr key={p.key} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200 font-mono text-xs">{p.label}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{p.desc}</div>
                  </td>
                  {roles.map((role) => {
                    const allowed = (ROLE_PERMISSIONS[role] as any)[p.key];
                    return (
                      <td key={role} className="py-3 px-4 text-center">
                        {allowed ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-600 border border-slate-800">
                            <Cross className="w-3.5 h-3.5" />
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
