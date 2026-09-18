import React, { useState, useEffect } from 'react';
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
  ROLE_PERMISSIONS,
} from '../types';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
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
}

export const IncidentDetailView: React.FC<IncidentDetailViewProps> = ({
  incidentId,
  currentUser,
  allUsers,
  services,
  onBack,
  onSelectService,
  onOpenAddEvidence,
  onIncidentUpdated,
}) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [timelineList, setTimelineList] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Center tabs: 'timeline' | 'evidence' | 'all'
  const [centerTab, setCenterTab] = useState<'timeline' | 'evidence'>('timeline');
  const [evidenceFilter, setEvidenceFilter] = useState<string>('ALL');

  // Quick Comment input
  const [quickComment, setQuickComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Status transition note dialog
  const [pendingStatus, setPendingStatus] = useState<IncidentStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Severity change state
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | null>(null);
  const [sevChangeNote, setSevChangeNote] = useState('');
  const [showSevModal, setShowSevModal] = useState(false);

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
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentData();
  }, [incidentId]);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
        <div className="font-mono text-xs text-slate-400">Loading Incident Workspace ({incidentId})...</div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-xl text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-100 font-mono">Failed to Load Incident</h2>
        <p className="text-xs text-slate-400 mt-2">{error || 'Incident record not found.'}</p>
        <button
          onClick={onBack}
          className="mt-5 px-4 py-2 text-xs font-mono rounded bg-slate-800 text-slate-200 hover:bg-slate-700"
        >
          Back to Incidents List
        </button>
      </div>
    );
  }

  const linkedService = services.find((s) => s.id === incident.serviceId);

  // Calculate ongoing duration
  const startMs = new Date(incident.startedTime).getTime();
  const endMs = incident.resolvedTime ? new Date(incident.resolvedTime).getTime() : Date.now();
  const elapsedMinutes = Math.max(1, Math.round((endMs - startMs) / (1000 * 60)));

  // Handle Quick Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickComment.trim()) return;
    setSubmittingComment(true);
    try {
      await api.addEvidence(incident.id, {
        type: 'COMMENT',
        title: `Comment from ${currentUser.name}`,
        source: `${currentUser.name} (${currentUser.role})`,
        content: quickComment.trim(),
      });
      setQuickComment('');
      await fetchIncidentData();
      onIncidentUpdated();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Status Update
  const handleConfirmStatusChange = async () => {
    if (!pendingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await api.updateIncident(incident.id, {
        status: pendingStatus,
        changeNote: statusNote.trim() || undefined,
      });
      setPendingStatus(null);
      setStatusNote('');
      await fetchIncidentData();
      onIncidentUpdated();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Severity Update
  const handleConfirmSeverityChange = async () => {
    if (!selectedSeverity) return;
    try {
      await api.updateIncident(incident.id, {
        severity: selectedSeverity,
        changeNote: sevChangeNote.trim() || undefined,
      });
      setShowSevModal(false);
      setSevChangeNote('');
      await fetchIncidentData();
      onIncidentUpdated();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // Handle Personnel Reassignment
  const handleAssignEngineer = async (engineerName: string) => {
    try {
      await api.updateIncident(incident.id, {
        assignedEngineer: engineerName || undefined,
      });
      await fetchIncidentData();
      onIncidentUpdated();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAssignCommander = async (managerName: string) => {
    try {
      await api.updateIncident(incident.id, {
        incidentManager: managerName || undefined,
      });
      await fetchIncidentData();
      onIncidentUpdated();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAcknowledge = async () => {
    try {
      await api.updateIncident(incident.id, {
        acknowledgedTime: new Date().toISOString(),
        changeNote: `${currentUser.name} acknowledged receipt and active response.`,
      });
      await fetchIncidentData();
      onIncidentUpdated();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (window.confirm('Delete this evidence entry?')) {
      try {
        await api.deleteEvidence(evidenceId);
        await fetchIncidentData();
        onIncidentUpdated();
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter evidence
  const filteredEvidence = evidenceList.filter((ev) => {
    if (evidenceFilter === 'ALL') return true;
    return ev.type === evidenceFilter;
  });

  const getEvidenceIcon = (type: EvidenceType) => {
    switch (type) {
      case 'LOG':
        return Terminal;
      case 'METRIC':
        return Activity;
      case 'DEPLOYMENT':
        return GitCommit;
      case 'ALERT':
        return Bell;
      case 'CONFIG_CHANGE':
        return Sliders;
      case 'DATABASE':
        return Database;
      case 'NETWORK':
        return Radio;
      case 'COMMENT':
        return MessageSquare;
      default:
        return Paperclip;
    }
  };

  const getTimelineIcon = (eventType: TimelineEvent['eventType']) => {
    switch (eventType) {
      case 'CREATED':
        return AlertTriangle;
      case 'STATUS_CHANGE':
        return Radio;
      case 'SEVERITY_CHANGE':
        return Flame;
      case 'ASSIGNMENT':
        return UserIcon;
      case 'EVIDENCE_ADDED':
        return Paperclip;
      case 'COMMENT':
        return MessageSquare;
      case 'RESOLUTION':
        return CheckCircle2;
      default:
        return Clock;
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Top Breadcrumb & Quick Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Incidents</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-100 text-sm md:text-base">
              {incident.incidentNumber}
            </span>
            <SeverityBadge severity={incident.severity} size="sm" />
            <StatusBadge status={incident.status} size="sm" />
          </div>
        </div>

        {/* Action Header shortcuts */}
        <div className="flex items-center gap-2">
          {!incident.acknowledgedTime && (
            <button
              onClick={handleAcknowledge}
              disabled={currentUser.role === 'VIEWER'}
              className="px-3 py-1 text-xs font-mono font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors disabled:opacity-40"
            >
              Acknowledge Incident
            </button>
          )}

          {['DETECTED', 'TRIAGED', 'INVESTIGATING', 'MITIGATING'].includes(incident.status) && (
            <button
              onClick={() => {
                setPendingStatus('RESOLVED');
                setStatusNote('Resolution verified: service health restored, metrics baseline recovered.');
              }}
              disabled={!permissions.canChangeStatus}
              className="px-3 py-1 text-xs font-mono font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow border border-emerald-500/60 transition-colors disabled:opacity-40"
            >
              Resolve Incident
            </button>
          )}
        </div>
      </div>

      {/* 3-COLUMN RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ================= LEFT COLUMN: Metadata & Service Info (3 cols) ================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Main Info Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Incident Title</div>
              <h2 className="text-sm font-bold text-slate-100 mt-1 leading-snug">
                {incident.title}
              </h2>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Description</div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">
                {incident.description}
              </p>
            </div>

            {/* Impact Box */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-400">Customer Impact:</span>
                <span
                  className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                    incident.customerImpact
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {incident.customerImpact ? 'CRITICAL IMPACT' : 'NO DIRECT IMPACT'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {incident.impactSummary || 'No customer-facing outage reported.'}
              </p>
            </div>
          </div>

          {/* Service Association Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-mono font-bold uppercase text-slate-300">
                  Associated Service
                </span>
              </div>
              <button
                onClick={() => onSelectService(incident.serviceId)}
                className="text-[11px] font-mono text-blue-400 hover:underline inline-flex items-center gap-0.5"
              >
                Inspect <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-100">{incident.serviceName}</span>
                {linkedService && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                      linkedService.healthStatus === 'HEALTHY'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : linkedService.healthStatus === 'DEGRADED'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {linkedService.healthStatus}
                  </span>
                )}
              </div>

              {linkedService ? (
                <div>
                  <div className="text-[11px] text-slate-400 line-clamp-2">
                    {linkedService.description}
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tier:</span>
                      <span className="text-slate-300 font-semibold">{linkedService.criticality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Owning Team:</span>
                      <span className="text-slate-300">{linkedService.owningTeam}</span>
                    </div>
                    {linkedService.repositoryUrl && (
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-500">Repository:</span>
                        <a
                          href={linkedService.repositoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-1 text-[10px]"
                        >
                          Repo <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Temporal Telemetry & Timestamps */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-mono font-bold uppercase text-slate-300">
                  Outage Telemetry
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {elapsedMinutes}m elapsed
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400 p-1.5 rounded bg-slate-950/60">
                <span className="text-slate-500">Detected:</span>
                <span className="text-slate-200">
                  {new Date(incident.detectedTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 p-1.5 rounded bg-slate-950/60">
                <span className="text-slate-500">Started:</span>
                <span className="text-slate-200">
                  {new Date(incident.startedTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 p-1.5 rounded bg-slate-950/60">
                <span className="text-slate-500">Acknowledged:</span>
                <span className={incident.acknowledgedTime ? 'text-slate-200' : 'text-amber-400'}>
                  {incident.acknowledgedTime
                    ? new Date(incident.acknowledgedTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Pending Ack'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 p-1.5 rounded bg-slate-950/60">
                <span className="text-slate-500">Resolved:</span>
                <span className={incident.resolvedTime ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {incident.resolvedTime
                    ? new Date(incident.resolvedTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Unresolved'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 space-y-0.5">
              <div>Reported by: <span className="text-slate-300">{incident.reportedBy}</span></div>
              <div>Environment: <span className="text-slate-300">{incident.environment}</span></div>
            </div>
          </div>
        </div>

        {/* ================= CENTER COLUMN: Timeline and Evidence (6 cols) ================= */}
        <div className="lg:col-span-6 space-y-4">
          {/* Top Center Controls & Tabs */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tab switchers */}
            <div className="flex items-center gap-1.5">
              <button
                id="tab-center-timeline"
                onClick={() => setCenterTab('timeline')}
                className={`px-3 py-1.5 text-xs font-mono rounded-md font-semibold transition-colors ${
                  centerTab === 'timeline'
                    ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Chronological Timeline ({timelineList.length})
              </button>
              <button
                id="tab-center-evidence"
                onClick={() => setCenterTab('evidence')}
                className={`px-3 py-1.5 text-xs font-mono rounded-md font-semibold transition-colors ${
                  centerTab === 'evidence'
                    ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Evidence Vault ({evidenceList.length})
              </button>
            </div>

            {/* Attach Evidence Action */}
            <button
              id="btn-attach-evidence-center"
              onClick={() => onOpenAddEvidence(incident.id)}
              disabled={currentUser.role === 'VIEWER'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono font-semibold transition-colors disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5 text-red-400" />
              <span>Attach Evidence</span>
            </button>
          </div>

          {/* Quick Comment / War Room Note Form */}
          <form
            onSubmit={handlePostComment}
            className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={
                  currentUser.role === 'VIEWER'
                    ? 'Viewers cannot post comments'
                    : 'Post incident update or hypothesis to timeline & evidence vault...'
                }
                value={quickComment}
                onChange={(e) => setQuickComment(e.target.value)}
                disabled={currentUser.role === 'VIEWER' || submittingComment}
                className="w-full pl-3 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500/50 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!quickComment.trim() || submittingComment || currentUser.role === 'VIEWER'}
              className="px-3.5 py-2 text-xs font-mono font-semibold rounded bg-red-600 hover:bg-red-500 text-white disabled:opacity-40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Post</span>
            </button>
          </form>

          {/* TAB 1: CHRONOLOGICAL TIMELINE */}
          {centerTab === 'timeline' && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Incident Chronology (Real Database Audit Trail)
                </h3>
                <span className="text-[10px] font-mono text-slate-500">
                  Sorted oldest → newest
                </span>
              </div>

              {timelineList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-mono text-xs">
                  No timeline events recorded yet.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {timelineList.map((event) => {
                    const Icon = getTimelineIcon(event.eventType);

                    const getNodeColor = () => {
                      switch (event.eventType) {
                        case 'CREATED':
                          return 'bg-red-500 text-white ring-4 ring-red-950';
                        case 'STATUS_CHANGE':
                          return 'bg-blue-500 text-white ring-4 ring-blue-950';
                        case 'SEVERITY_CHANGE':
                          return 'bg-amber-500 text-white ring-4 ring-amber-950';
                        case 'RESOLUTION':
                          return 'bg-emerald-500 text-white ring-4 ring-emerald-950';
                        case 'ASSIGNMENT':
                          return 'bg-purple-500 text-white ring-4 ring-purple-950';
                        case 'COMMENT':
                          return 'bg-slate-700 text-slate-300 ring-4 ring-slate-900';
                        default:
                          return 'bg-slate-700 text-slate-300 ring-4 ring-slate-900';
                      }
                    };

                    return (
                      <div key={event.id} className="relative group">
                        {/* Timeline Node */}
                        <div
                          className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${getNodeColor()}`}
                        >
                          <Icon className="w-2.5 h-2.5" />
                        </div>

                        {/* Event Content Card */}
                        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-200">
                                {event.title}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                {event.eventType}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(event.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {event.description}
                          </p>

                          <div className="mt-2 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">{event.actorName}</span>
                              <span className="px-1 py-0.2 rounded bg-slate-900 text-slate-500 border border-slate-800">
                                {event.actorRole}
                              </span>
                            </div>
                            {event.metadata && (
                              <span className="text-slate-600">
                                {Object.keys(event.metadata).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EVIDENCE VAULT */}
          {centerTab === 'evidence' && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Incident Evidence Vault
                  </h3>
                  <p className="text-[11px] text-slate-500">Logs, metrics, stack traces, deployments, and database dumps.</p>
                </div>

                {/* Evidence Type Filter */}
                <select
                  value={evidenceFilter}
                  onChange={(e) => setEvidenceFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Types ({evidenceList.length})</option>
                  <option value="LOG">Logs</option>
                  <option value="METRIC">Metrics</option>
                  <option value="DEPLOYMENT">Deployments</option>
                  <option value="ALERT">Alerts</option>
                  <option value="DATABASE">Database</option>
                  <option value="CONFIG_CHANGE">Config Changes</option>
                  <option value="COMMENT">Comments</option>
                </select>
              </div>

              {filteredEvidence.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-mono text-xs">
                  No evidence entries match filter: {evidenceFilter}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEvidence.map((ev) => {
                    const Icon = getEvidenceIcon(ev.type);

                    const getTypeBadge = () => {
                      switch (ev.type) {
                        case 'LOG':
                          return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
                        case 'METRIC':
                          return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
                        case 'DEPLOYMENT':
                          return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
                        case 'ALERT':
                          return 'bg-red-500/15 text-red-400 border-red-500/30';
                        case 'DATABASE':
                          return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
                        case 'CONFIG_CHANGE':
                          return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
                        case 'COMMENT':
                          return 'bg-slate-700/40 text-slate-300 border-slate-600';
                        default:
                          return 'bg-slate-800 text-slate-400 border-slate-700';
                      }
                    };

                    return (
                      <div
                        key={ev.id}
                        id={`evidence-card-${ev.id}`}
                        className="rounded-xl bg-slate-950 border border-slate-800/90 overflow-hidden"
                      >
                        {/* Evidence Card Header */}
                        <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1 rounded bg-slate-800 text-slate-300">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-200">{ev.title}</span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${getTypeBadge()}`}>
                                  {ev.type}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                Source: {ev.source}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(ev.content, ev.id)}
                              title="Copy content"
                              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            >
                              {copiedId === ev.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            {currentUser.role !== 'VIEWER' && (
                              <button
                                onClick={() => handleDeleteEvidence(ev.id)}
                                title="Delete evidence"
                                className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Evidence Content / Code block */}
                        <div className="p-3.5 font-mono text-xs text-slate-300 overflow-x-auto bg-[#070A10] whitespace-pre-wrap leading-relaxed border-b border-slate-850">
                          {ev.content}
                        </div>

                        {/* Footer attribution */}
                        <div className="px-3.5 py-2 bg-slate-950 flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Attached by: <strong className="text-slate-400">{ev.createdBy}</strong></span>
                          <span>{new Date(ev.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: Actions & Assignment (3 cols) ================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Status Transitions Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-300">
                Incident State Machine
              </span>
              <span className="text-[10px] font-mono text-slate-500">Current: {incident.status}</span>
            </div>

            <div className="space-y-1.5">
              {(['INVESTIGATING', 'MITIGATING', 'RESOLVED', 'CLOSED'] as IncidentStatus[]).map((st) => {
                const isCurrent = incident.status === st;

                return (
                  <button
                    key={st}
                    id={`btn-transition-${st.toLowerCase()}`}
                    disabled={isCurrent || !permissions.canChangeStatus}
                    onClick={() => {
                      setPendingStatus(st);
                      setStatusNote(`Transitioning status to ${st}`);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-mono transition-all ${
                      isCurrent
                        ? 'bg-slate-800 text-slate-100 border border-slate-700 font-bold'
                        : permissions.canChangeStatus
                        ? 'bg-slate-950/70 hover:bg-slate-800/60 text-slate-300 border border-slate-850 hover:border-slate-700'
                        : 'bg-slate-950/40 text-slate-600 border border-slate-900 cursor-not-allowed'
                    }`}
                  >
                    <span>{st}</span>
                    {isCurrent ? (
                      <span className="text-[10px] text-emerald-400 font-semibold">ACTIVE</span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {!permissions.canChangeStatus && (
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                Role {currentUser.role} cannot change status.
              </div>
            )}
          </div>

          {/* Severity Adjustment Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-300">
                Severity Level
              </span>
              <SeverityBadge severity={incident.severity} size="sm" />
            </div>

            <button
              onClick={() => {
                setSelectedSeverity(incident.severity);
                setShowSevModal(true);
              }}
              disabled={!permissions.canChangeSeverity}
              className={`w-full py-2 px-3 text-xs font-mono rounded border flex items-center justify-center gap-2 transition-colors ${
                permissions.canChangeSeverity
                  ? 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800'
                  : 'bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Escalate / Change Severity</span>
            </button>

            {!permissions.canChangeSeverity && (
              <div className="text-[10px] text-slate-500 font-mono">
                Requires INCIDENT_MANAGER or ADMIN role.
              </div>
            )}
          </div>

          {/* Command Roster & Assignments Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-300">
                Command Roster
              </span>
              <Shield className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Lead Engineer Assignment */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Investigating Engineer:</span>
                {permissions.canAssignEngineer && (
                  <button
                    onClick={() => handleAssignEngineer(currentUser.name)}
                    className="text-[10px] text-blue-400 hover:underline"
                  >
                    Assign to Me
                  </button>
                )}
              </label>
              <select
                value={incident.assignedEngineer || ''}
                onChange={(e) => handleAssignEngineer(e.target.value)}
                disabled={!permissions.canAssignEngineer}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none disabled:opacity-50"
              >
                <option value="">-- Unassigned --</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Incident Commander Assignment */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Incident Commander:</label>
              <select
                value={incident.incidentManager || ''}
                onChange={(e) => handleAssignCommander(e.target.value)}
                disabled={!permissions.canAssignEngineer}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none disabled:opacity-50"
              >
                <option value="">-- Unassigned --</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Personnel List */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="text-[10px] font-mono uppercase text-slate-500">Active Handlers</div>
              {allUsers.map((u) => {
                const isAssigned =
                  u.name === incident.assignedEngineer || u.name === incident.incidentManager;
                return (
                  <div key={u.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono flex items-center justify-center text-slate-300">
                        {u.name[0]}
                      </div>
                      <span className={isAssigned ? 'text-slate-100 font-semibold' : 'text-slate-400'}>
                        {u.name}
                      </span>
                    </div>
                    {isAssigned && (
                      <span className="text-[10px] font-mono text-emerald-400">Assigned</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* STATUS TRANSITION NOTE MODAL */}
      {pendingStatus && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100">
                Confirm Status Transition: {incident.status} → {pendingStatus}
              </h3>
              <button
                onClick={() => setPendingStatus(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400">
                Operational Transition Note (Logged to Timeline):
              </label>
              <textarea
                rows={3}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Reason or actions taken for this status change..."
                className="w-full p-2.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-red-500/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPendingStatus(null)}
                className="px-3 py-1.5 text-xs font-mono rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                disabled={isUpdatingStatus}
                className="px-4 py-1.5 text-xs font-mono font-semibold rounded bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
              >
                {isUpdatingStatus ? 'Updating...' : `Confirm → ${pendingStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEVERITY ADJUSTMENT MODAL */}
      {showSevModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100">
                Adjust Severity: {incident.incidentNumber}
              </h3>
              <button
                onClick={() => setShowSevModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Select Severity Level:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['SEV-1', 'SEV-2', 'SEV-3', 'SEV-4'] as Severity[]).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSelectedSeverity(sev)}
                      className={`p-2.5 rounded border text-left flex items-center justify-between font-mono text-xs ${
                        selectedSeverity === sev
                          ? 'bg-slate-800 border-red-500/80 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <SeverityBadge severity={sev} size="sm" />
                      {selectedSeverity === sev && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Justification / Note (Required):
                </label>
                <textarea
                  rows={3}
                  value={sevChangeNote}
                  onChange={(e) => setSevChangeNote(e.target.value)}
                  placeholder="e.g. Failure rate exceeded 10% on payments checkout..."
                  className="w-full p-2.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-red-500/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSevModal(false)}
                className="px-3 py-1.5 text-xs font-mono rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSeverityChange}
                disabled={!selectedSeverity}
                className="px-4 py-1.5 text-xs font-mono font-semibold rounded bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
              >
                Save Severity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
