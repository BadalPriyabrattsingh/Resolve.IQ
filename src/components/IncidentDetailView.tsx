import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Clock,
  Server,
  AlertTriangle,
  User as UserIcon,
  CheckCircle2,
  Paperclip,
  MessageSquare,
  Flame,
  Shield,
  Search,
  Wrench,
  Archive,
  Radio,
  ExternalLink,
  ChevronRight,
  Database,
  Terminal,
  Activity,
  GitCommit,
  Bell,
  Sliders,
  Copy,
  Check,
  Plus,
  Send,
  Trash2,
  Sparkles,
  Play,
  FileText,
  AlertCircle,
  Filter,
  ChevronLeft,
  RefreshCw,
} from 'lucide-react';
import {
  Incident,
  Evidence,
  TimelineEvent,
  User,
  Service,
  Severity,
  IncidentStatus,
  EvidenceType,
  Investigation,
  ROLE_PERMISSIONS,
} from '../types';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { AiInvestigationPanel } from './AiInvestigationPanel';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useToast } from './Toast';
import { api } from '../api';

interface IncidentDetailViewProps {
  incidentId: string;
  currentUser: User;
  allUsers: User[];
  services: Service[];
  onBack: () => void;
  onSelectService: (serviceId: string) => void;
  onOpenAddEvidence: (incidentId: string) => void;
  onIncidentUpdated: () => void;
  initialTab?: WorkspaceTab;
}

type WorkspaceTab = 'investigation' | 'actions' | 'timeline' | 'evidence';

export const IncidentDetailView: React.FC<IncidentDetailViewProps> = ({
  incidentId,
  currentUser,
  allUsers,
  services,
  onBack,
  onSelectService,
  onOpenAddEvidence,
  onIncidentUpdated,
  initialTab = 'investigation',
}) => {
  const { showToast } = useToast();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [timelineList, setTimelineList] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [investigation, setInvestigation] = useState<Investigation | null>(null);

  // Central Workspace Tab
  const [centerTab, setCenterTab] = useState<WorkspaceTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setCenterTab(initialTab);
    }
  }, [initialTab]);

  // Search & Filtering for Evidence
  const [evidenceFilter, setEvidenceFilter] = useState<string>('ALL');
  const [evidenceSearch, setEvidenceSearch] = useState<string>('');
  const [evidencePage, setEvidencePage] = useState<number>(1);
  const evidencePageSize = 5;

  // Search & Filtering for Timeline
  const [timelineFilter, setTimelineFilter] = useState<string>('ALL');
  const [timelineSearch, setTimelineSearch] = useState<string>('');

  // Quick Comment input
  const [quickComment, setQuickComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Status transition dialog state
  const [pendingStatus, setPendingStatus] = useState<IncidentStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Severity change dialog state
  const [pendingSeverity, setPendingSeverity] = useState<Severity | null>(null);
  const [sevChangeNote, setSevChangeNote] = useState('');
  const [isUpdatingSeverity, setIsUpdatingSeverity] = useState(false);

  // Evidence deletion confirmation
  const [evidenceToDelete, setEvidenceToDelete] = useState<Evidence | null>(null);
  const [isDeletingEvidence, setIsDeletingEvidence] = useState(false);

  // Runbook execution state
  const [executingRunbookId, setExecutingRunbookId] = useState<string | null>(null);
  const [executedRunbooks, setExecutedRunbooks] = useState<Record<string, boolean>>({});

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const permissions = ROLE_PERMISSIONS[currentUser.role];

  // Fetch full incident details
  const fetchIncidentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getIncident(incidentId);
      setIncident(data.incident);
      setEvidenceList(data.evidence);
      setTimelineList(data.timeline);

      try {
        const invData = await api.getInvestigation(incidentId);
        setInvestigation(invData);
      } catch {
        setInvestigation(null);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentData();
  }, [incidentId]);

  // Copy incident ID
  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast('info', 'Copied to clipboard', text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Comment submission
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickComment.trim()) return;
    setSubmittingComment(true);
    try {
      await api.addEvidence(incident!.id, {
        type: 'COMMENT',
        title: `Comment from ${currentUser.name}`,
        source: `${currentUser.name} (${currentUser.role})`,
        content: quickComment.trim(),
      });
      setQuickComment('');
      showToast('success', 'Update posted to timeline & evidence vault');
      await fetchIncidentData();
      onIncidentUpdated();
    } catch (err) {
      showToast('error', 'Failed to post comment', (err as Error).message);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Confirm Status Transition
  const handleConfirmStatusChange = async () => {
    if (!pendingStatus || !incident) return;
    setIsUpdatingStatus(true);
    try {
      await api.updateIncident(incident.id, {
        status: pendingStatus,
        changeNote: statusNote.trim() || `Status updated to ${pendingStatus}`,
      });
      showToast('success', `Status transitioned to ${pendingStatus}`);
      setPendingStatus(null);
      setStatusNote('');
      await fetchIncidentData();
      onIncidentUpdated();
    } catch (err) {
      showToast('error', 'Failed to update status', (err as Error).message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Confirm Severity Change
  const handleConfirmSeverityChange = async () => {
    if (!pendingSeverity || !incident) return;
    setIsUpdatingSeverity(true);
    try {
      await api.updateIncident(incident.id, {
        severity: pendingSeverity,
        changeNote: sevChangeNote.trim() || `Severity updated to ${pendingSeverity}`,
      });
      showToast('warning', `Severity adjusted to ${pendingSeverity}`);
      setPendingSeverity(null);
      setSevChangeNote('');
      await fetchIncidentData();
      onIncidentUpdated();
    } catch (err) {
      showToast('error', 'Failed to change severity', (err as Error).message);
    } finally {
      setIsUpdatingSeverity(false);
    }
  };

  // Reassign Engineer
  const handleAssignEngineer = async (engineerName: string) => {
    if (!incident) return;
    try {
      await api.updateIncident(incident.id, {
        assignedEngineer: engineerName || undefined,
      });
      showToast(
        'info',
        engineerName ? `Assigned ${engineerName} as Primary Engineer` : 'Cleared engineer assignment'
      );
      await fetchIncidentData();
      onIncidentUpdated();
    } catch (err) {
      showToast('error', 'Failed to assign engineer', (err as Error).message);
    }
  };

  // Reassign Commander
  const handleAssignCommander = async (managerName: string) => {
    if (!incident) return;
    try {
      await api.updateIncident(incident.id, {
        incidentManager: managerName || undefined,
      });
      showToast(
        'info',
        managerName ? `Incident Commander updated to ${managerName}` : 'Cleared incident commander'
      );
      await fetchIncidentData();
      onIncidentUpdated();
    } catch (err) {
      showToast('error', 'Failed to update commander', (err as Error).message);
    }
  };

  // Acknowledge Incident
  const handleAcknowledge = async () => {
    if (!incident) return;
    try {
      await api.updateIncident(incident.id, {
        acknowledgedTime: new Date().toISOString(),
        changeNote: `${currentUser.name} acknowledged receipt and active response.`,
      });
      showToast('success', 'Incident acknowledged SLA timestamp recorded');
      await fetchIncidentData();
      onIncidentUpdated();
    } catch (err) {
      showToast('error', 'Failed to acknowledge incident', (err as Error).message);
    }
  };

  // Delete Evidence
  const handleConfirmDeleteEvidence = async () => {
    if (!evidenceToDelete) return;
    setIsDeletingEvidence(true);
    try {
      await api.deleteEvidence(evidenceToDelete.id);
      showToast('success', 'Evidence record removed');
      setEvidenceToDelete(null);
      await fetchIncidentData();
      onIncidentUpdated();
    } catch (err) {
      showToast('error', 'Failed to delete evidence', (err as Error).message);
    } finally {
      setIsDeletingEvidence(false);
    }
  };

  // Execute Recommended Runbook Action
  const handleExecuteRunbook = async (runbookId: string, runbookTitle: string, command?: string) => {
    if (!incident) return;
    setExecutingRunbookId(runbookId);
    try {
      // Simulate execution and log an audit comment to timeline
      await new Promise((resolve) => setTimeout(resolve, 800));
      await api.addEvidence(incident.id, {
        type: 'LOG',
        title: `Runbook Executed: ${runbookTitle}`,
        source: `SRE Command Runbook (${currentUser.name})`,
        content: `Executed runbook: ${runbookTitle}\nCommand: ${command || 'N/A'}\nOperator: ${currentUser.name}\nStatus: Completed successfully without error.`,
      });
      setExecutedRunbooks((prev) => ({ ...prev, [runbookId]: true }));
      showToast('success', `Runbook executed: ${runbookTitle}`, 'Output logged to incident timeline.');
      await fetchIncidentData();
      onIncidentUpdated();
    } catch (err) {
      showToast('error', 'Runbook execution failed', (err as Error).message);
    } finally {
      setExecutingRunbookId(null);
    }
  };

  // Filtered & Paginated Evidence
  const filteredEvidence = useMemo(() => {
    return evidenceList.filter((item) => {
      if (evidenceFilter !== 'ALL' && item.type !== evidenceFilter) {
        return false;
      }
      if (evidenceSearch.trim()) {
        const q = evidenceSearch.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSource = item.source.toLowerCase().includes(q);
        const matchesContent = item.content.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSource && !matchesContent) {
          return false;
        }
      }
      return true;
    });
  }, [evidenceList, evidenceFilter, evidenceSearch]);

  const totalEvidencePages = Math.max(1, Math.ceil(filteredEvidence.length / evidencePageSize));
  const paginatedEvidence = useMemo(() => {
    const start = (evidencePage - 1) * evidencePageSize;
    return filteredEvidence.slice(start, start + evidencePageSize);
  }, [filteredEvidence, evidencePage, evidencePageSize]);

  // Filtered Timeline
  const filteredTimeline = useMemo(() => {
    return timelineList.filter((event) => {
      if (timelineFilter !== 'ALL') {
        if (timelineFilter === 'STATUS' && event.eventType !== 'STATUS_CHANGE') return false;
        if (timelineFilter === 'SEVERITY' && event.eventType !== 'SEVERITY_CHANGE') return false;
        if (timelineFilter === 'EVIDENCE' && event.eventType !== 'EVIDENCE_ADDED') return false;
        if (timelineFilter === 'COMMENT' && event.eventType !== 'COMMENT') return false;
        if (timelineFilter === 'ASSIGNMENT' && event.eventType !== 'ASSIGNMENT') return false;
      }
      if (timelineSearch.trim()) {
        const q = timelineSearch.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(q);
        const matchesDesc = (event.description || '').toLowerCase().includes(q);
        const matchesActor = (event.actorName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesActor) return false;
      }
      return true;
    });
  }, [timelineList, timelineFilter, timelineSearch]);

  // Get evidence icon helper
  const getEvidenceIcon = (type: EvidenceType) => {
    switch (type) {
      case 'LOG':
        return Terminal;
      case 'METRIC':
        return Activity;
      case 'ALERT':
        return Bell;
      case 'CONFIG_CHANGE':
        return GitCommit;
      case 'DATABASE':
        return Database;
      case 'DEPLOYMENT':
        return Wrench;
      case 'NETWORK':
        return Radio;
      case 'COMMENT':
      default:
        return MessageSquare;
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'CREATED':
        return Flame;
      case 'STATUS_CHANGE':
        return Sliders;
      case 'SEVERITY_CHANGE':
        return AlertTriangle;
      case 'EVIDENCE_ADDED':
        return Paperclip;
      case 'HYPOTHESIS_CONFIRMED':
        return Sparkles;
      case 'RESOLVED':
        return CheckCircle2;
      case 'ASSIGNMENT':
        return UserIcon;
      default:
        return MessageSquare;
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center min-h-[500px] space-y-3">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <div className="font-mono text-sm text-slate-800 dark:text-slate-200 font-semibold">
          Synchronizing Incident Workspace ({incidentId})...
        </div>
        <div className="font-mono text-xs text-slate-500">
          Fetching verified audit logs, telemetry evidence, and AI investigation state...
        </div>
      </div>
    );
  }

  // Error State
  if (error || !incident) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] rounded-xl text-center space-y-4 shadow-xs">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">Incident Unavailable</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error || 'Incident record not found in cluster database.'}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={fetchIncidentData}
            className="px-3.5 py-1.5 text-xs font-mono rounded bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 text-xs font-mono rounded bg-teal-600 hover:bg-teal-500 text-white cursor-pointer shadow-xs"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const linkedService = services.find((s) => s.id === incident.serviceId);

  // Time calculations
  const startMs = new Date(incident.startedTime).getTime();
  const endMs = incident.resolvedTime ? new Date(incident.resolvedTime).getTime() : Date.now();
  const elapsedMinutes = Math.max(1, Math.round((endMs - startMs) / (1000 * 60)));

  return (
    <div className="space-y-5 pb-16">
      {/* 1. TOP BREADCRUMB & CONTEXT NAVIGATION */}
      <div className="flex items-center justify-between gap-3 text-xs font-mono">
        <button
          onClick={onBack}
          id="btn-back-to-incidents"
          className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors p-1 -ml-1 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Quick Refresh */}
          <button
            onClick={fetchIncidentData}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors inline-flex items-center gap-1 text-[11px] cursor-pointer"
            title="Refresh Incident Workspace"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          {/* Quick Share / Copy ID */}
          <button
            onClick={() => handleCopyId(incident.incidentNumber)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors inline-flex items-center gap-1 text-[11px] cursor-pointer"
            title="Copy Incident Identifier"
          >
            {copiedId === incident.incidentNumber ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{incident.incidentNumber}</span>
          </button>
        </div>
      </div>

      {/* 2. SRE MISSION CONTROL WORKSPACE BANNER */}
      <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121820] shadow-xs overflow-hidden">
        {/* Banner Top Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#0C1015]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title & Identifiers */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wider bg-white dark:bg-[#18202A] px-2 py-0.5 rounded border border-slate-200 dark:border-white/[0.08]">
                  {incident.incidentNumber}
                </span>
                <SeverityBadge severity={incident.severity} size="md" />
                <StatusBadge status={incident.status} size="md" />

                {/* Service tag */}
                <button
                  onClick={() => onSelectService(incident.serviceId)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-[#18202A] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] text-xs font-mono transition-colors cursor-pointer"
                >
                  <Server className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{incident.serviceName}</span>
                  {linkedService && (
                    <span
                      className={`text-[9px] px-1 rounded font-bold ${
                        linkedService.healthStatus === 'HEALTHY'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : linkedService.healthStatus === 'DEGRADED'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          : 'bg-red-500/10 text-red-700 dark:text-red-400'
                      }`}
                    >
                      {linkedService.healthStatus}
                    </span>
                  )}
                  <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                </button>
              </div>

              <h1 className="text-base md:text-lg font-bold font-sans text-slate-900 dark:text-slate-100 leading-snug">
                {incident.title}
              </h1>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Quick Acknowledge if Detected */}
              {incident.status === 'DETECTED' && permissions.canChangeStatus && (
                <button
                  onClick={handleAcknowledge}
                  className="px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Acknowledge (SLA)</span>
                </button>
              )}

              {/* Escalate Severity Quick Button */}
              {permissions.canChangeSeverity && (
                <button
                  onClick={() => setPendingSeverity(incident.severity === 'SEV-1' ? 'SEV-2' : 'SEV-1')}
                  className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] font-mono text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>Change Severity</span>
                </button>
              )}

              {/* Fast-forward Next Status */}
              {permissions.canChangeStatus && incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
                <button
                  onClick={() => {
                    const nextSt: IncidentStatus =
                      incident.status === 'DETECTED'
                        ? 'TRIAGED'
                        : incident.status === 'TRIAGED'
                        ? 'INVESTIGATING'
                        : incident.status === 'INVESTIGATING'
                        ? 'MITIGATING'
                        : 'RESOLVED';
                    setPendingStatus(nextSt);
                  }}
                  className="px-3.5 py-1.5 rounded-md bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Advance Status</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 6 Key Operational Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-200 dark:divide-white/[0.06] bg-slate-50/30 dark:bg-[#0C1015]/40 text-xs font-mono">
          {/* 1. Current Status */}
          <div className="p-3.5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">CURRENT STATUS</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="font-bold text-slate-900 dark:text-slate-200">{incident.status}</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {incident.acknowledgedTime ? 'Acknowledged' : 'Awaiting Ack'}
            </div>
          </div>

          {/* 2. Severity & SLA */}
          <div className="p-3.5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">SEVERITY LEVEL</span>
            <div className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>{incident.severity}</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {incident.severity === 'SEV-1' ? 'SLA: 15m Ack / 60m Res' : 'SLA: 30m Ack / 4h Res'}
            </div>
          </div>

          {/* 3. Affected Service */}
          <div className="p-3.5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">AFFECTED SERVICE</span>
            <div className="font-bold text-slate-900 dark:text-slate-200 truncate">{incident.serviceName}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Tier: {linkedService?.criticality || 'Tier-0'} ({linkedService?.healthStatus || 'Active'})
            </div>
          </div>

          {/* 4. Assigned Engineer */}
          <div className="p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">ASSIGNED SRE</span>
              {permissions.canAssignEngineer && (
                <button
                  onClick={() => handleAssignEngineer(currentUser.name)}
                  className="text-[9px] text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Assign Me
                </button>
              )}
            </div>
            <select
              value={incident.assignedEngineer || ''}
              onChange={(e) => handleAssignEngineer(e.target.value)}
              disabled={!permissions.canAssignEngineer}
              className="w-full bg-white dark:bg-[#18202A] border border-slate-200 dark:border-white/[0.08] rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-slate-300 font-mono focus:outline-none disabled:opacity-50"
            >
              <option value="">-- Unassigned --</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
            <div className="text-[10px] text-slate-500 truncate">
              {incident.assignedEngineer ? 'Active on incident' : 'Needs owner'}
            </div>
          </div>

          {/* 5. Incident Commander */}
          <div className="p-3.5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">INCIDENT COMMANDER</span>
            <select
              value={incident.incidentManager || ''}
              onChange={(e) => handleAssignCommander(e.target.value)}
              disabled={!permissions.canAssignEngineer}
              className="w-full bg-white dark:bg-[#18202A] border border-slate-200 dark:border-white/[0.08] rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-slate-300 font-mono focus:outline-none disabled:opacity-50"
            >
              <option value="">-- Unassigned --</option>
              {allUsers
                .filter((u) => u.role === 'INCIDENT_MANAGER' || u.role === 'ADMIN')
                .map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
            </select>
            <div className="text-[10px] text-slate-500 truncate">Command authority</div>
          </div>

          {/* 6. Customer Impact & Duration */}
          <div className="p-3.5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">CUSTOMER IMPACT</span>
            <div className="flex items-center gap-1.5">
              {incident.customerImpact ? (
                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>ACTIVE IMPACT</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>NO IMPACT</span>
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{elapsedMinutes}m outage elapsed</span>
            </div>
          </div>
        </div>

        {/* Impact Summary Line */}
        {incident.impactSummary && (
          <div className="px-4 py-2.5 bg-red-500/5 border-t border-red-500/20 text-xs text-red-700 dark:text-red-300 font-sans flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-red-800 dark:text-red-200">Customer Impact Detail: </strong>
              {incident.impactSummary}
            </div>
          </div>
        )}
      </div>

      {/* 3. MAIN WORKSPACE 4-TAB NAVIGATION */}
      <div className="border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-1 font-mono text-xs">
          {/* Tab 1: AI Investigation */}
          <button
            id="tab-center-investigation"
            onClick={() => setCenterTab('investigation')}
            className={`px-3.5 py-2.5 rounded-t-lg font-bold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
              centerTab === 'investigation'
                ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>AI Investigation</span>
            {investigation && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                {investigation.confirmedRootCause || incident.confirmedRootCause
                  ? 'VERIFIED'
                  : `${investigation.hypotheses.length} Hypotheses`}
              </span>
            )}
          </button>

          {/* Tab 2: Recommended Actions & Runbooks */}
          <button
            id="tab-center-actions"
            onClick={() => setCenterTab('actions')}
            className={`px-3.5 py-2.5 rounded-t-lg font-bold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
              centerTab === 'actions'
                ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-500" />
            <span>Recommended Actions</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]">
              Runbooks
            </span>
          </button>

          {/* Tab 3: Chronological Timeline */}
          <button
            id="tab-center-timeline"
            onClick={() => setCenterTab('timeline')}
            className={`px-3.5 py-2.5 rounded-t-lg font-bold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
              centerTab === 'timeline'
                ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Timeline</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]">
              {timelineList.length}
            </span>
          </button>

          {/* Tab 4: Evidence Vault */}
          <button
            id="tab-center-evidence"
            onClick={() => setCenterTab('evidence')}
            className={`px-3.5 py-2.5 rounded-t-lg font-bold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
              centerTab === 'evidence'
                ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            <Paperclip className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Evidence Vault</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]">
              {evidenceList.length}
            </span>
          </button>
        </div>

        {/* Attach Evidence Action */}
        <button
          id="btn-attach-evidence-header"
          onClick={() => onOpenAddEvidence(incident.id)}
          disabled={currentUser.role === 'VIEWER'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-[#18202A] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-white/[0.08] text-xs font-mono font-semibold transition-colors disabled:opacity-40 cursor-pointer mb-1 shrink-0 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Attach Evidence</span>
        </button>
      </div>

      {/* Quick Comment / War Room Note Form */}
      <form
        onSubmit={handlePostComment}
        className="p-3.5 rounded-xl bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2.5 shadow-xs"
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={
              currentUser.role === 'VIEWER'
                ? 'Viewers cannot post comments'
                : 'Post operational update or observation to incident timeline & evidence vault...'
            }
            value={quickComment}
            onChange={(e) => setQuickComment(e.target.value)}
            disabled={currentUser.role === 'VIEWER' || submittingComment}
            className="w-full pl-3 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded-md text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={!quickComment.trim() || submittingComment || currentUser.role === 'VIEWER'}
          className="px-3.5 py-2 text-xs font-mono font-bold rounded bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-40 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Post Note</span>
        </button>
      </form>

      {/* 4. TAB CONTENTS */}
      {/* TAB 1: AI INVESTIGATION */}
      {centerTab === 'investigation' && (
        <AiInvestigationPanel
          incident={incident}
          investigation={investigation}
          evidenceList={evidenceList}
          currentUser={currentUser}
          onRefreshIncident={fetchIncidentData}
          onSelectEvidenceTab={() => setCenterTab('evidence')}
          onSelectEvidenceItem={(evId) => {
            setCenterTab('evidence');
            setEvidenceFilter('ALL');
            setTimeout(() => {
              const el = document.getElementById(`evidence-card-${evId}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-2', 'ring-teal-500');
                setTimeout(() => el.classList.remove('ring-2', 'ring-teal-500'), 3000);
              }
            }, 150);
          }}
        />
      )}

      {/* TAB 2: RECOMMENDED ACTIONS & RUNBOOKS */}
      {centerTab === 'actions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Recommended Mitigation Runbooks & Diagnostic Procedures
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                AUDITED RUNBOOKS
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
              The following operational procedures have been matched to the service architecture and active incident indicators. SREs can execute or log runbook steps with automated timeline verification.
            </p>

            {/* Runbook Cards */}
            <div className="space-y-3 pt-2">
              {[
                {
                  id: 'rb-pool-scale',
                  title: 'Aurora Connection Pool Dynamic Resize',
                  description: 'Increases PgBouncer maximum client connection limit from 200 to 800 without restarting database primary.',
                  command: 'aws rds modify-db-parameter-group --db-parameter-group-name aurora-prod-pg15 --parameters "ParameterName=max_connections,ParameterValue=800,ApplyMethod=immediate"',
                  requiresApproval: true,
                  docUrl: 'https://internal.runbooks/aurora/connection-limits',
                },
                {
                  id: 'rb-drain-canary',
                  title: 'Canary Deployment Traffic Drain & Rollback',
                  description: 'Instantly shifts ingress traffic weight from canary release v2.14.0 back to stable baseline v2.13.9.',
                  command: 'kubectl scale deployment/payment-canary -n production --replicas=0 && kubectl annotate ingress/payment-ingress traffic-split="100:0"',
                  requiresApproval: false,
                  docUrl: 'https://internal.runbooks/deployments/instant-drain',
                },
                {
                  id: 'rb-restart-cache',
                  title: 'Redis Cache Cluster Flush & Warmup',
                  description: 'Clears stale transaction cache tokens and triggers asynchronous warmup query from read replicas.',
                  command: 'redis-cli -h cache.internal.payment -p 6379 FLUSHDB ASYNC',
                  requiresApproval: true,
                  docUrl: 'https://internal.runbooks/redis/flush-warmup',
                },
              ].map((rb) => {
                const isExecuted = executedRunbooks[rb.id];
                const isRunning = executingRunbookId === rb.id;

                return (
                  <div
                    key={rb.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isExecuted
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-slate-50 dark:bg-[#0C1015] border-slate-200 dark:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">{rb.title}</span>
                        {rb.requiresApproval ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            REQUIRES SRE APPROVAL
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                            AUTO-EXECUTABLE
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleExecuteRunbook(rb.id, rb.title, rb.command)}
                        disabled={isRunning || isExecuted || currentUser.role === 'VIEWER'}
                        className={`px-3 py-1.5 text-xs font-mono font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                          isExecuted
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-teal-600 hover:bg-teal-500 text-white shadow-xs'
                        }`}
                      >
                        {isRunning ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isExecuted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        <span>{isExecuted ? 'Executed & Logged' : isRunning ? 'Executing...' : 'Execute Runbook'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans mb-3">{rb.description}</p>

                    {rb.command && (
                      <div className="p-2 rounded bg-white dark:bg-[#18202A] border border-slate-200 dark:border-white/[0.08] font-mono text-[11px] text-slate-800 dark:text-slate-300 flex items-center justify-between gap-2 overflow-x-auto">
                        <div className="flex items-center gap-2 shrink-0 text-slate-400">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>$</span>
                        </div>
                        <code className="flex-1 whitespace-nowrap">{rb.command}</code>
                        <button
                          onClick={() => handleCopyId(rb.command!)}
                          className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHRONOLOGICAL TIMELINE */}
      {centerTab === 'timeline' && (
        <div className="p-4 rounded-xl bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Incident Audit Chronology
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Real-time record of status transitions, evidence attachments, and team actions.
              </p>
            </div>

            {/* Timeline Filter Controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search timeline..."
                  value={timelineSearch}
                  onChange={(e) => setTimelineSearch(e.target.value)}
                  className="pl-7 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
              <select
                value={timelineFilter}
                onChange={(e) => setTimelineFilter(e.target.value)}
                className="bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-300 font-mono focus:outline-none"
              >
                <option value="ALL">All Events</option>
                <option value="STATUS">Status Changes</option>
                <option value="SEVERITY">Severity Changes</option>
                <option value="EVIDENCE">Evidence Added</option>
                <option value="COMMENT">Comments</option>
                <option value="ASSIGNMENT">Assignments</option>
              </select>
            </div>
          </div>

          {filteredTimeline.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs space-y-2">
              <Clock className="w-6 h-6 text-slate-400 mx-auto" />
              <div>No timeline events match the filter criteria.</div>
              {timelineSearch && (
                <button
                  onClick={() => setTimelineSearch('')}
                  className="text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-white/[0.08]">
              {filteredTimeline.map((event) => {
                const Icon = getTimelineIcon(event.eventType);

                return (
                  <div key={event.id} className="relative group">
                    <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-[#18202A] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <Icon className="w-2.5 h-2.5" />
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-[#0C1015]/60 border border-slate-200 dark:border-white/[0.06] space-y-1 hover:border-slate-300 dark:hover:border-white/[0.15] transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-200">
                          {event.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>

                      {event.description && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                          {event.description}
                        </p>
                      )}

                      {event.actorName && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          Operator: <span className="text-slate-700 dark:text-slate-300">{event.actorName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EVIDENCE VAULT */}
      {centerTab === 'evidence' && (
        <div className="p-4 rounded-xl bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Ground Truth Evidence Vault
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Logs, metrics, alerts, configs, and traces collected to substantiate AI hypotheses.
              </p>
            </div>

            {/* Evidence Search & Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search evidence..."
                  value={evidenceSearch}
                  onChange={(e) => {
                    setEvidenceSearch(e.target.value);
                    setEvidencePage(1);
                  }}
                  className="pl-7 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Type pills */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {['ALL', 'LOG', 'METRIC', 'ALERT', 'CONFIG', 'TRACE', 'COMMENT'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setEvidenceFilter(t);
                      setEvidencePage(1);
                    }}
                    className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                      evidenceFilter === t
                        ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 font-bold'
                        : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredEvidence.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs space-y-3">
              <Paperclip className="w-8 h-8 text-slate-400 mx-auto" />
              <div>No evidence records found matching current filter.</div>
              <button
                onClick={() => onOpenAddEvidence(incident.id)}
                disabled={currentUser.role === 'VIEWER'}
                className="px-3 py-1.5 text-xs font-mono font-semibold rounded bg-teal-600 hover:bg-teal-500 text-white inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Attach First Evidence</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedEvidence.map((item) => {
                const Icon = getEvidenceIcon(item.type);

                return (
                  <div
                    key={item.id}
                    id={`evidence-card-${item.id}`}
                    className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-[#0C1015]/60 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-white dark:bg-[#18202A] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-200">{item.title}</span>
                          <span className="ml-2 text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]">
                            {item.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {permissions.canAddEvidence && (
                          <button
                            onClick={() => setEvidenceToDelete(item)}
                            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                            title="Delete Evidence"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Source: <span className="text-slate-700 dark:text-slate-300">{item.source}</span>
                    </div>

                    <pre className="p-2.5 rounded bg-white dark:bg-[#18202A] border border-slate-200 dark:border-white/[0.08] font-mono text-[11px] text-slate-800 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {item.content}
                    </pre>
                  </div>
                );
              })}

              {/* Evidence Pagination Controls */}
              {filteredEvidence.length > evidencePageSize && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/[0.08] text-xs font-mono text-slate-500 dark:text-slate-400">
                  <div>
                    Showing {(evidencePage - 1) * evidencePageSize + 1} to{' '}
                    {Math.min(filteredEvidence.length, evidencePage * evidencePageSize)} of{' '}
                    {filteredEvidence.length} items
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEvidencePage((p) => Math.max(1, p - 1))}
                      disabled={evidencePage === 1}
                      className="px-2 py-1 rounded bg-white dark:bg-[#18202A] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {evidencePage} / {totalEvidencePages}
                    </span>
                    <button
                      onClick={() => setEvidencePage((p) => Math.min(totalEvidencePages, p + 1))}
                      disabled={evidencePage === totalEvidencePages}
                      className="px-2 py-1 rounded bg-white dark:bg-[#18202A] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. CONFIRMATION DIALOGS */}
      {/* A. Status Transition Confirmation */}
      <ConfirmationDialog
        isOpen={!!pendingStatus}
        title={`Transition Status to ${pendingStatus}`}
        description={`Are you sure you want to transition incident ${incident.incidentNumber} from ${incident.status} to ${pendingStatus}? This state change will be committed to the database and logged to the incident audit trail.`}
        confirmLabel={`Confirm Transition to ${pendingStatus}`}
        variant={pendingStatus === 'RESOLVED' || pendingStatus === 'CLOSED' ? 'success' : 'primary'}
        inputLabel="Operational Change Note (Optional):"
        inputPlaceholder="e.g., Mitigated by rolling back canary ingress traffic..."
        inputValue={statusNote}
        onInputChange={setStatusNote}
        isLoading={isUpdatingStatus}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => {
          setPendingStatus(null);
          setStatusNote('');
        }}
      />

      {/* B. Severity Adjustment Confirmation */}
      <ConfirmationDialog
        isOpen={!!pendingSeverity}
        title={`Adjust Severity to ${pendingSeverity}`}
        description={`Changing severity to ${pendingSeverity} alters SLA escalation policies and alerts senior on-call commanders. Please verify necessity.`}
        confirmLabel={`Escalate to ${pendingSeverity}`}
        variant="warning"
        inputLabel="Reason for Severity Adjustment:"
        inputPlaceholder="e.g., Customer payment transactions failing beyond acceptable threshold..."
        inputValue={sevChangeNote}
        onInputChange={setSevChangeNote}
        isLoading={isUpdatingSeverity}
        onConfirm={handleConfirmSeverityChange}
        onCancel={() => {
          setPendingSeverity(null);
          setSevChangeNote('');
        }}
      />

      {/* C. Evidence Deletion Confirmation */}
      <ConfirmationDialog
        isOpen={!!evidenceToDelete}
        title="Remove Evidence Record"
        description={`Are you sure you want to delete evidence "${evidenceToDelete?.title}"? This cannot be undone and will remove it from root-cause hypothesis grounding.`}
        confirmLabel="Delete Evidence"
        variant="danger"
        isLoading={isDeletingEvidence}
        onConfirm={handleConfirmDeleteEvidence}
        onCancel={() => setEvidenceToDelete(null)}
      />
    </div>
  );
};
