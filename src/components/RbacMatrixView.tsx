import React from 'react';
import { Users, Check, X as Cross, Shield, Key, Crown } from 'lucide-react';
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
    { key: 'canManageProductAdmins', label: 'Assign Product Admins', desc: 'Platform Owner capability to assign global Product Admins' },
    { key: 'canManageOrg', label: 'Organization Administration', desc: 'Manage enterprise org settings and audit controls' },
    { key: 'canManageMembers', label: 'Manage Members & Roles', desc: 'Add new users to org and promote/demote member roles' },
    { key: 'canManageTeams', label: 'Manage Operational Teams', desc: 'Create, update, and dissolve operational teams & team leads' },
    { key: 'canCreateIncident', label: 'Declare New Incident', desc: 'Trigger incident creation for services across the catalog' },
    { key: 'canChangeStatus', label: 'Advance Incident Status', desc: 'Transition between INVESTIGATING, MITIGATING, RESOLVED, CLOSED' },
    { key: 'canChangeSeverity', label: 'Adjust Incident Severity', desc: 'Escalate or downgrade SEV-1 through SEV-4' },
    { key: 'canAssignEngineer', label: 'Assign Incident Roles', desc: 'Assign lead engineer and incident commander' },
    { key: 'canAddEvidence', label: 'Attach Evidence & Logs', desc: 'Upload telemetry, stack traces, metrics snapshots, and comments' },
    { key: 'canManageServices', label: 'Manage Service Catalog', desc: 'Register new services, edit topology, and override health status' },
    { key: 'canDeleteIncident', label: 'Delete / Purge Incident', desc: 'Permanently remove incident records from data store' },
  ];

  const roles: UserRole[] = [
    'PRODUCT_OWNER',
    'PRODUCT_ADMIN',
    'ORG_ADMIN',
    'INCIDENT_MANAGER',
    'ENGINEER',
    'VIEWER',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-white/[0.08]">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Multi-Tiered RBAC & Governance Hierarchy</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Role-based permissions governing platform ownership, organization management, teams, incident triage, and evidence.
        </p>
      </div>

      {/* Active User Persona Cards */}
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
          Active Accounts & Personas
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {allUsers.map((u) => {
            const isCurrent = u.id === currentUser.id;

            return (
              <div
                key={u.id}
                onClick={() => onSwitchUser(u.id)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-teal-500/10 border-teal-500/40 shadow-xs'
                    : 'bg-white dark:bg-[#121820] border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{u.name}</span>
                      {u.isProductOwner && (
                        <Crown className="w-3 h-3 text-amber-500" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{u.email}</div>
                  </div>
                  {isCurrent && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Role:</span>
                  <span className="text-teal-700 dark:text-teal-300 font-semibold">{u.role.replace('_', ' ')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RBAC Matrix Table */}
      <div className="rounded-xl bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
              Permissions Matrix
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Current Persona: <span className="text-teal-600 dark:text-teal-400 font-bold">{currentUser.role.replace('_', ' ')}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 font-sans">
            <thead className="bg-slate-50 dark:bg-[#0C1015] text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px] border-b border-slate-200 dark:border-white/[0.08] tracking-wider">
              <tr>
                <th className="py-3 px-4">Capability</th>
                <th className="py-3 px-4">Description</th>
                {roles.map((r) => (
                  <th key={r} className="py-3 px-3 text-center whitespace-nowrap">
                    <span className={r === currentUser.role ? 'text-teal-600 dark:text-teal-400 font-bold' : ''}>
                      {r.replace('_', ' ')}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {permissionsList.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-200">
                    {perm.label}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                    {perm.desc}
                  </td>
                  {roles.map((r) => {
                    const hasPerm = ROLE_PERMISSIONS[r]?.[perm.key as keyof typeof ROLE_PERMISSIONS[UserRole]];
                    const isUserRole = r === currentUser.role;

                    return (
                      <td
                        key={r}
                        className={`py-3 px-3 text-center ${
                          isUserRole ? 'bg-teal-500/5' : ''
                        }`}
                      >
                        {hasPerm ? (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                        ) : (
                          <Cross className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
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
