import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  Building,
  Users,
  Crown,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { User, Organization } from '../types';
import { api } from '../api';

interface ProductAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onRefreshData?: () => void;
}

export const ProductAdminModal: React.FC<ProductAdminModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'product_admins' | 'all_orgs'>('product_admins');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allOrgs, setAllOrgs] = useState<(Organization & { memberCount: number; teamCount: number })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isOwner = currentUser.role === 'PRODUCT_OWNER' || currentUser.isProductOwner;

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [users, orgs] = await Promise.all([
        api.getAllUsersAcrossOrgs().catch(() => []),
        api.getAllOrganizations().catch(() => []),
      ]);
      setAllUsers(users);
      setAllOrgs(orgs);
    } catch (err: any) {
      setError(err.message || 'Failed to load platform data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleAssignProductAdmin = async (user: User) => {
    if (!isOwner) {
      setError('Only the Product Owner can assign Product Admins.');
      return;
    }
    try {
      const res = await api.assignProductAdmin(user.id);
      setSuccessMsg(res.message || `${user.name} promoted to Product Admin.`);
      await loadData();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to assign Product Admin');
    }
  };

  const handleRevokeProductAdmin = async (user: User) => {
    if (!isOwner) {
      setError('Only the Product Owner can revoke Product Admins.');
      return;
    }
    if (user.id === currentUser.id) {
      setError('You cannot revoke your own Product Owner permissions.');
      return;
    }
    try {
      const res = await api.revokeProductAdmin(user.id);
      setSuccessMsg(res.message || `Product Admin revoked for ${user.name}.`);
      await loadData();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to revoke Product Admin');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0D151C] border border-slate-200 dark:border-white/[0.1] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Platform Administration
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  PRODUCT OWNER
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage global Product Admins and oversee organizations across the platform.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/30 dark:bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('product_admins')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'product_admins'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Product Admins & Users ({allUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all_orgs')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'all_orgs'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Registered Organizations ({allOrgs.length})</span>
          </button>
        </div>

        {/* Notifications & Error banners */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <div className="text-xs text-slate-500 font-mono">Loading platform administration state...</div>
            </div>
          ) : activeTab === 'product_admins' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-slate-700 dark:text-slate-300">
                <div className="font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Product Owner Capability
                </div>
                As the main Platform Owner, you have complete authority to assign any number of users as <strong>Product Admins</strong>. Product Admins have platform-wide oversight across organizations.
              </div>

              <div className="border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Organization</th>
                      <th className="px-4 py-3">Current Role</th>
                      <th className="px-4 py-3 text-right">Product Admin Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {allUsers.map((u) => {
                      const isTargetOwner = u.isProductOwner || u.role === 'PRODUCT_OWNER';
                      const isTargetAdmin = u.isProductAdmin || u.role === 'PRODUCT_ADMIN';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/[0.08] flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs overflow-hidden">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                                ) : (
                                  u.name[0]
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isTargetOwner && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                                      OWNER
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {u.orgName || 'Primary Org'}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.04]">
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            {isTargetOwner ? (
                              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-mono">
                                Primary Owner
                              </span>
                            ) : isTargetAdmin ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Product Admin
                                </span>
                                {isOwner && (
                                  <button
                                    onClick={() => handleRevokeProductAdmin(u)}
                                    className="px-2 py-1 rounded text-[11px] font-medium text-rose-600 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
                                  >
                                    Revoke
                                  </button>
                                )}
                              </div>
                            ) : (
                              isOwner && (
                                <button
                                  onClick={() => handleAssignProductAdmin(u)}
                                  className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                                >
                                  <Crown className="w-3 h-3" />
                                  Promote to Product Admin
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allOrgs.map((org) => (
                  <div
                    key={org.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0A1016] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">{org.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">slug: {org.slug}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500">
                      <div>
                        Members: <strong className="text-slate-700 dark:text-slate-300">{org.memberCount}</strong>
                      </div>
                      <div>
                        Teams: <strong className="text-slate-700 dark:text-slate-300">{org.teamCount}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-500">
          <div>
            Logged in as <strong className="text-slate-700 dark:text-slate-200">{currentUser.name}</strong> ({currentUser.role})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-white/[0.08] hover:bg-slate-300 dark:hover:bg-white/[0.12] text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
