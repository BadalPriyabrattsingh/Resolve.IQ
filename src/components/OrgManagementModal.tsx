import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Building,
  UserPlus,
  Shield,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  FolderPlus,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { User, Organization, Team, UserRole, ROLE_PERMISSIONS } from '../types';
import { api } from '../api';

interface OrgManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onRefreshData?: () => void;
}

export const OrgManagementModal: React.FC<OrgManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'teams' | 'org_info'>('members');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Member Form State
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('ENGINEER');
  const [newMemberTitle, setNewMemberTitle] = useState('');
  const [newMemberTeams, setNewMemberTeams] = useState<string[]>([]);
  const [newMemberIsContractor, setNewMemberIsContractor] = useState(false);
  const [newMemberContractorEmail, setNewMemberContractorEmail] = useState('');
  const [newMemberContractorId, setNewMemberContractorId] = useState('');
  const [newMemberVendorCompany, setNewMemberVendorCompany] = useState('');
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);

  // Edit Contractor Sync Dialog State
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [editContractorEmail, setEditContractorEmail] = useState('');
  const [editContractorId, setEditContractorId] = useState('');
  const [editIsContractor, setEditIsContractor] = useState(false);
  const [editVendorCompany, setEditVendorCompany] = useState('');
  const [isUpdatingSync, setIsUpdatingSync] = useState(false);

  // Create Team Form State
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [newTeamLeadId, setNewTeamLeadId] = useState('');
  const [newTeamMemberIds, setNewTeamMemberIds] = useState<string[]>([]);
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);

  const canManage =
    currentUser.role === 'PRODUCT_OWNER' ||
    currentUser.role === 'PRODUCT_ADMIN' ||
    currentUser.role === 'ORG_ADMIN' ||
    ROLE_PERMISSIONS[currentUser.role]?.canManageMembers;

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [orgRes, membersList, teamsList] = await Promise.all([
        api.getOrgInfo().catch(() => null),
        api.getOrgMembers().catch(() => []),
        api.getOrgTeams().catch(() => []),
      ]);
      if (orgRes?.organization) {
        setOrganization(orgRes.organization);
      }
      setMembers(membersList);
      setTeams(teamsList);
    } catch (err: any) {
      setError(err.message || 'Failed to load organization data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberPassword.trim()) {
      setError('Please provide name, email, and a temporary password.');
      return;
    }
    setIsSubmittingMember(true);
    setError(null);
    try {
      await api.addOrgMember({
        name: newMemberName.trim(),
        email: newMemberEmail.trim(),
        password: newMemberPassword.trim(),
        role: newMemberRole,
        title: newMemberTitle.trim() || undefined,
        teams: newMemberTeams,
      });
      setSuccessMsg(`Successfully added ${newMemberName} as ${newMemberRole.replace('_', ' ')}.`);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPassword('');
      setNewMemberTitle('');
      setNewMemberTeams([]);
      setShowAddMember(false);
      await loadData();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.updateMemberRole(userId, newRole);
      setSuccessMsg('Member role updated successfully.');
      await loadData();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the organization?`)) {
      return;
    }
    try {
      await api.removeOrgMember(userId);
      setSuccessMsg(`${name} has been removed from the organization.`);
      await loadData();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      setError('Team name is required.');
      return;
    }
    setIsSubmittingTeam(true);
    setError(null);
    try {
      await api.createOrgTeam({
        name: newTeamName.trim(),
        description: newTeamDescription.trim(),
        leadUserId: newTeamLeadId || undefined,
        memberUserIds: newTeamMemberIds,
      });
      setSuccessMsg(`Team "${newTeamName}" created successfully.`);
      setNewTeamName('');
      setNewTeamDescription('');
      setNewTeamLeadId('');
      setNewTeamMemberIds([]);
      setShowCreateTeam(false);
      await loadData();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setIsSubmittingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${teamName}" team?`)) {
      return;
    }
    try {
      await api.deleteOrgTeam(teamId);
      setSuccessMsg(`Team "${teamName}" deleted.`);
      await loadData();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete team');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0D151C] border border-slate-200 dark:border-white/[0.1] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {organization?.name || currentUser.orgName || 'Organization Management'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-semibold">
                  ORG ADMIN CONSOLE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage members, roles, permissions, and operational teams for this organization.
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
            onClick={() => setActiveTab('members')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'teams'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Teams ({teams.length})</span>
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
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <div className="text-xs text-slate-500 font-mono">Synchronizing organization records...</div>
            </div>
          ) : activeTab === 'members' ? (
            /* ================= MEMBERS VIEW ================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Organization Members</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Org Admins can add new personnel and manage roles.
                  </p>
                </div>
                {canManage && !showAddMember && (
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                )}
              </div>

              {/* Add Member Form Drawer */}
              {showAddMember && (
                <form
                  onSubmit={handleAddMember}
                  className="p-5 rounded-xl border border-teal-500/30 bg-teal-500/5 dark:bg-teal-950/20 space-y-4 animate-in fade-in"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-teal-500/20">
                    <span className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4" />
                      Add New Member to {organization?.name || 'Organization'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddMember(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#070D12] text-slate-900 dark:text-white outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="jane.doe@company.com"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#070D12] text-slate-900 dark:text-white outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Temporary Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={newMemberPassword}
                        onChange={(e) => setNewMemberPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#070D12] text-slate-900 dark:text-white outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Role Assignment *
                      </label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#070D12] text-slate-900 dark:text-white outline-none focus:border-teal-500"
                      >
                        <option value="ENGINEER">Engineer (Investigate, triage & comment)</option>
                        <option value="INCIDENT_MANAGER">Incident Manager (Declare & coordinate)</option>
                        <option value="ORG_ADMIN">Org Admin (Full org & team management)</option>
                        <option value="VIEWER">Viewer (Read-only observation)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Job Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={newMemberTitle}
                        onChange={(e) => setNewMemberTitle(e.target.value)}
                        placeholder="e.g. Senior Infrastructure Engineer"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#070D12] text-slate-900 dark:text-white outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMember(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingMember}
                      className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isSubmittingMember ? 'Adding...' : 'Confirm & Create Member'}
                    </button>
                  </div>
                </form>
              )}

              {/* Members Table */}
              <div className="border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Teams</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {members.map((member) => {
                      const isSelf = member.id === currentUser.id;
                      const isOwner = member.isProductOwner;

                      return (
                        <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center font-bold text-teal-600 dark:text-teal-400 overflow-hidden shrink-0">
                                {member.avatarUrl ? (
                                  <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                  member.name[0]
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{member.name}</span>
                                  {isOwner && (
                                    <span className="flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                                      <Crown className="w-2.5 h-2.5" />
                                      OWNER
                                    </span>
                                  )}
                                  {isSelf && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400">{member.email}</div>
                                {member.title && (
                                  <div className="text-[10px] text-slate-500">{member.title}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {canManage && !isOwner && !isSelf ? (
                              <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                                className="px-2 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#121A22] text-slate-800 dark:text-slate-200 outline-none"
                              >
                                <option value="ORG_ADMIN">Org Admin</option>
                                <option value="INCIDENT_MANAGER">Incident Manager</option>
                                <option value="ENGINEER">Engineer</option>
                                <option value="VIEWER">Viewer</option>
                              </select>
                            ) : (
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300">
                                {member.role.replace('_', ' ')}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {member.teams && member.teams.length > 0 ? (
                                member.teams.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]"
                                  >
                                    {t}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No team</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right">
                            {canManage && !isOwner && !isSelf && (
                              <button
                                onClick={() => handleRemoveMember(member.id, member.name)}
                                title="Remove member from organization"
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
            /* ================= TEAMS VIEW ================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Operational Teams</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Group responders by service ownership, on-call rotation, or tier.
                  </p>
                </div>
                {canManage && !showCreateTeam && (
                  <button
                    onClick={() => setShowCreateTeam(true)}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Create Team</span>
                  </button>
                )}
              </div>

              {/* Create Team Form Drawer */}
              {showCreateTeam && (
                <form
                  onSubmit={handleCreateTeam}
                  className="p-5 rounded-xl border border-teal-500/30 bg-teal-500/5 dark:bg-teal-950/20 space-y-4 animate-in fade-in"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-teal-500/20">
                    <span className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                      <FolderPlus className="w-4 h-4" />
                      Create New Team
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCreateTeam(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Team Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="e.g. Payments SRE, Core Infrastructure"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#070D12] text-slate-900 dark:text-white outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Team Lead
                      </label>
                      <select
                        value={newTeamLeadId}
                        onChange={(e) => setNewTeamLeadId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#070D12] text-slate-900 dark:text-white outline-none focus:border-teal-500"
                      >
                        <option value="">-- No Lead Assigned --</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Description & Scope
                      </label>
                      <textarea
                        rows={2}
                        value={newTeamDescription}
                        onChange={(e) => setNewTeamDescription(e.target.value)}
                        placeholder="Describe services, microservices, or incident responsibilities handled by this team..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#070D12] text-slate-900 dark:text-white outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateTeam(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingTeam}
                      className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isSubmittingTeam ? 'Creating...' : 'Create Team'}
                    </button>
                  </div>
                </form>
              )}

              {/* Teams Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team) => {
                  const leadUser = members.find((m) => m.id === team.leadUserId);

                  return (
                    <div
                      key={team.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0A1016] flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{team.name}</span>
                          {canManage && (
                            <button
                              onClick={() => handleDeleteTeam(team.id, team.name)}
                              title="Delete team"
                              className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {team.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {team.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500">
                        <div>
                          Lead:{' '}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {leadUser ? leadUser.name : 'Unassigned'}
                          </span>
                        </div>
                        <div className="font-mono text-[11px]">
                          {team.memberUserIds?.length || 0} members
                        </div>
                      </div>
                    </div>
                  );
                })}
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
