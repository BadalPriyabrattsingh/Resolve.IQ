import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Terminal,
  Activity,
  GitCommit,
  Database,
  ArrowRight,
  FileText,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from 'lucide-react';
import {
  Incident,
  Investigation,
  Hypothesis,
  FindingClassification,
  HypothesisStatus,
  User,
  Evidence,
  ROLE_PERMISSIONS,
} from '../types';
import { api } from '../api';
import { AiChatPanel } from './AiChatPanel';
import { useToast } from './Toast';

interface AiInvestigationPanelProps {
  incident: Incident;
  investigation: Investigation | null;
  evidenceList: Evidence[];
  currentUser: User;
  onRefreshIncident: () => void;
  onSelectEvidenceTab: () => void;
  onSelectEvidenceItem?: (evidenceId: string) => void;
}

export const AiInvestigationPanel: React.FC<AiInvestigationPanelProps> = ({
  incident,
  investigation,
  evidenceList,
  currentUser,
  onRefreshIncident,
  onSelectEvidenceTab,
  onSelectEvidenceItem,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sub-tab or filter
  const [activeSection, setActiveSection] = useState<'hypotheses' | 'findings' | 'timeline' | 'chat' | 'runbooks'>('hypotheses');
  const [findingFilter, setFindingFilter] = useState<string>('ALL');

  // Confirmation Modal state
  const [confirmingHypothesis, setConfirmingHypothesis] = useState<Hypothesis | null>(null);
  const [rootCauseStatement, setRootCauseStatement] = useState('');
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);

  // Rejection Modal state
  const [rejectingHypothesis, setRejectingHypothesis] = useState<Hypothesis | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Copied runbook command helper
  const [copiedRunbookId, setCopiedRunbookId] = useState<string | null>(null);

  const { showToast } = useToast();

  // Expanded hypothesis IDs
  const [expandedHypothesisIds, setExpandedHypothesisIds] = useState<Record<string, boolean>>({
    [`hyp-${incident.id}-1`]: true,
    [`hyp-${incident.id}-2`]: true,
    [`hyp-${incident.id}-3`]: true,
  });

  const permissions = ROLE_PERMISSIONS[currentUser.role];
  const canVerify = permissions.canConfirmHypothesis;

  const toggleHypothesisExpand = (id: string) => {
    setExpandedHypothesisIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Run or re-run investigation analysis
  const handleRunInvestigation = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      await api.startInvestigation(incident.id);
      showToast('info', 'AI Investigation Updated', 'Synthesized against recent evidence.');
      onRefreshIncident();
    } catch (err) {
      setError((err as Error).message || 'Failed to complete AI investigation analysis');
      showToast('error', 'Investigation failed', (err as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle hypothesis status updates
  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingHypothesis) return;

    try {
      setIsSubmittingConfirm(true);
      await api.updateHypothesisStatus(incident.id, confirmingHypothesis.id, 'CONFIRMED', {
        statement: rootCauseStatement.trim() || `${confirmingHypothesis.title}: ${confirmingHypothesis.description}`,
      });
      showToast('success', 'Root Cause Confirmed', confirmingHypothesis.title);
      setConfirmingHypothesis(null);
      setRootCauseStatement('');
      onRefreshIncident();
    } catch (err) {
      setError((err as Error).message);
      showToast('error', 'Failed to confirm root cause', (err as Error).message);
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingHypothesis) return;

    try {
      setIsSubmittingReject(true);
      await api.updateHypothesisStatus(incident.id, rejectingHypothesis.id, 'REJECTED', {
        reason: rejectionReason.trim() || 'Rejected following engineer review.',
      });
      showToast('info', 'Hypothesis Rejected', rejectingHypothesis.title);
      setRejectingHypothesis(null);
      setRejectionReason('');
      onRefreshIncident();
    } catch (err) {
      setError((err as Error).message);
      showToast('error', 'Failed to reject hypothesis', (err as Error).message);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleSetUnderReview = async (hypothesisId: string) => {
    try {
      await api.updateHypothesisStatus(incident.id, hypothesisId, 'UNDER_REVIEW');
      showToast('info', 'Hypothesis Moved to Review');
      onRefreshIncident();
    } catch (err) {
      setError((err as Error).message);
      showToast('error', 'Update failed', (err as Error).message);
    }
  };

  const handleRevokeConfirmation = async (hypothesisId: string) => {
    try {
      await api.updateHypothesisStatus(incident.id, hypothesisId, 'UNDER_REVIEW');
      showToast('warning', 'Confirmation Revoked', 'Returned to active review.');
      onRefreshIncident();
    } catch (err) {
      setError((err as Error).message);
      showToast('error', 'Failed to revoke', (err as Error).message);
    }
  };

  const handleCopyCommand = (id: string, command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedRunbookId(id);
    showToast('info', 'Command Copied to Clipboard');
    setTimeout(() => setCopiedRunbookId(null), 2000);
  };

  const getClassificationBadge = (classification: FindingClassification) => {
    switch (classification) {
      case 'OBSERVED_FACT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            OBSERVED FACT
          </span>
        );
      case 'CORRELATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            CORRELATION
          </span>
        );
      case 'AI_HYPOTHESIS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/15 text-[#2dd4bf] border border-teal-500/30 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-[#2dd4bf]" />
            AI HYPOTHESIS
          </span>
        );
      case 'RECOMMENDATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Terminal className="w-2.5 h-2.5 text-emerald-400" />
            RECOMMENDATION
          </span>
        );
      case 'HUMAN_CONFIRMED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            HUMAN CONFIRMED ROOT CAUSE
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: HypothesisStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            CONFIRMED ROOT CAUSE
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/50 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#2dd4bf]" />
            UNDER REVIEW
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#e07a5f]/15 text-[#fca5a5] border border-[#e07a5f]/30 flex items-center gap-1.5 line-through">
            <XCircle className="w-3.5 h-3.5 text-[#e07a5f]" />
            REJECTED
          </span>
        );
      case 'PROPOSED':
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-teal-500/15 text-[#2dd4bf] border border-teal-500/40 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#2dd4bf]" />
            PROPOSED
          </span>
        );
    }
  };

  // If no investigation exists yet
  if (!investigation) {
    return (
      <div className="p-8 rounded-xl bg-[#0D151C] border border-teal-500/30 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/40 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6 text-[#2dd4bf]" />
        </div>
        <h3 className="text-base font-bold font-mono text-slate-100">
          AI Incident Investigation
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          ResolveIQ will synthesize telemetry across {evidenceList.length} evidence records, correlate deployment milestones, construct a unified chronological timeline, and generate root-cause hypotheses with confidence scores.
        </p>
        <button
          onClick={handleRunInvestigation}
          disabled={analyzing || currentUser.role === 'VIEWER'}
          className="px-4 py-2.5 rounded-lg bg-[#2dd4bf] hover:bg-[#20b2aa] text-[#080D11] font-mono text-xs font-bold inline-flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-teal-950/50"
        >
          {analyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#080D11]" />
              <span>Analyzing Incident Evidence...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Start AI Investigation</span>
            </>
          )}
        </button>
      </div>
    );
  }

  const confirmedRootCause = investigation.confirmedRootCause || incident.confirmedRootCause;

  // Filter findings
  const filteredFindings = investigation.findings.filter((f) => {
    if (findingFilter === 'ALL') return true;
    return f.classification === findingFilter;
  });

  return (
    <div id="ai-investigation-section" className="space-y-4">
      {/* Header bar */}
      <div className="p-4 rounded-xl bg-[#0D151C] border border-[#1A2833] shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#2dd4bf]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-mono text-slate-100">
                  AI Investigation Engine
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-[#2dd4bf] border border-teal-500/40">
                  STATUS: {investigation.status}
                </span>
                {confirmedRootCause && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ROOT CAUSE CONFIRMED
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Analyzed {evidenceList.length} evidence records • {investigation.hypotheses.length} hypotheses generated
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-rerun-investigation"
              onClick={handleRunInvestigation}
              disabled={analyzing || currentUser.role === 'VIEWER'}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin text-purple-400' : 'text-slate-400'}`} />
              <span>{analyzing ? 'Re-analyzing...' : 'Re-run Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Human-in-the-loop Guardrail Notice */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Safety Guardrail:</strong> AI identifies correlations and hypotheses. All root causes and production actions require human SRE verification.
            </span>
          </div>
        </div>
      </div>

      {/* Human Confirmed Root Cause Banner */}
      {confirmedRootCause && (
        <div
          id="banner-confirmed-root-cause"
          className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-emerald-950/50 to-slate-900 border-2 border-emerald-500/60 shadow-lg shadow-emerald-950/30"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400">
                    HUMAN-CONFIRMED ROOT CAUSE
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Verified by <strong className="text-slate-200">{confirmedRootCause.confirmedBy}</strong> on{' '}
                    {new Date(confirmedRootCause.confirmedTimestamp).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <h4 className="text-sm font-bold font-mono text-slate-100">
                  {confirmedRootCause.title}
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg border border-emerald-500/30">
                  "{confirmedRootCause.statement}"
                </p>
              </div>
            </div>

            {canVerify && (
              <button
                onClick={() => handleRevokeConfirmation(confirmedRootCause.hypothesisId)}
                className="text-[11px] font-mono px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-750 transition-colors flex-shrink-0 cursor-pointer"
              >
                Re-open Verification
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#1A2833] pb-2 overflow-x-auto">
        <button
          id="subtab-hypotheses"
          onClick={() => setActiveSection('hypotheses')}
          className={`px-3 py-1.5 text-xs font-mono rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSection === 'hypotheses'
              ? 'bg-[#101C25] text-[#2dd4bf] border border-teal-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D151C]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#2dd4bf]" />
          <span>Root-Cause Hypotheses ({investigation.hypotheses.length})</span>
        </button>

        <button
          id="subtab-findings"
          onClick={() => setActiveSection('findings')}
          className={`px-3 py-1.5 text-xs font-mono rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSection === 'findings'
              ? 'bg-[#101C25] text-[#2dd4bf] border border-teal-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D151C]'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>AI Findings ({investigation.findings.length})</span>
        </button>

        <button
          id="subtab-timeline"
          onClick={() => setActiveSection('timeline')}
          className={`px-3 py-1.5 text-xs font-mono rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSection === 'timeline'
              ? 'bg-[#101C25] text-[#2dd4bf] border border-teal-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D151C]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Investigation Timeline ({investigation.timeline.length})</span>
        </button>

        <button
          id="subtab-runbooks"
          onClick={() => setActiveSection('runbooks')}
          className={`px-3 py-1.5 text-xs font-mono rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSection === 'runbooks'
              ? 'bg-[#101C25] text-[#2dd4bf] border border-teal-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D151C]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Runbooks & Next Steps ({investigation.recommendedRunbooks.length})</span>
        </button>

        <button
          id="subtab-chat"
          onClick={() => setActiveSection('chat')}
          className={`px-3 py-1.5 text-xs font-mono rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSection === 'chat'
              ? 'bg-[#101C25] text-[#2dd4bf] border border-teal-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D151C]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#2dd4bf]" />
          <span>AI Copilot Chat ({investigation.chatHistory?.length || 0})</span>
        </button>
      </div>

      {/* SECTION 1: ROOT-CAUSE HYPOTHESES */}
      {activeSection === 'hypotheses' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>
              Showing {investigation.hypotheses.length} potential root causes evaluated against incident evidence.
            </span>
            <span className="text-[11px] text-slate-500">
              Select a hypothesis to inspect supporting evidence or confirm root cause.
            </span>
          </div>

          <div className="space-y-3.5">
            {investigation.hypotheses.map((hyp) => {
              const isConfirmed = hyp.status === 'CONFIRMED';
              const isRejected = hyp.status === 'REJECTED';
              const isExpanded = expandedHypothesisIds[hyp.id] ?? true;

              return (
                <div
                  key={hyp.id}
                  id={`hypothesis-card-${hyp.id}`}
                  className={`rounded-xl border transition-all ${
                    isConfirmed
                      ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-950/20'
                      : isRejected
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-70'
                      : 'bg-slate-900/80 border-slate-800 hover:border-purple-500/40'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getClassificationBadge('AI_HYPOTHESIS')}
                        {getStatusBadge(hyp.status)}
                        <span className="text-[11px] font-mono text-slate-500">
                          ID: {hyp.id}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <h4 className="text-sm font-bold font-mono text-slate-100">
                          {hyp.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {hyp.description}
                      </p>
                    </div>

                    {/* Confidence Meter */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0 bg-slate-950/70 px-3 py-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400">Confidence</div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              hyp.confidence >= 80
                                ? 'bg-emerald-500'
                                : hyp.confidence >= 60
                                ? 'bg-amber-500'
                                : 'bg-slate-500'
                            }`}
                            style={{ width: `${hyp.confidence}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-mono font-bold ${
                            hyp.confidence >= 80
                              ? 'text-emerald-400'
                              : hyp.confidence >= 60
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {hyp.confidence}%
                        </span>
                      </div>
                      <button
                        onClick={() => toggleHypothesisExpand(hyp.id)}
                        className="text-[11px] font-mono text-slate-400 hover:text-slate-200 mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        {isExpanded ? (
                          <>Hide Details <ChevronUp className="w-3 h-3" /></>
                        ) : (
                          <>Show Details <ChevronDown className="w-3 h-3" /></>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {isExpanded && (
                    <div className="p-4 space-y-4 text-xs font-mono">
                      {/* Supporting and Contradicting Evidence Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Supporting Evidence */}
                        <div className="p-3 rounded-lg bg-emerald-950/15 border border-emerald-500/25 space-y-2">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Supporting Evidence ({hyp.supportingEvidence.length})</span>
                          </div>
                          <ul className="space-y-1.5 text-slate-300 text-[11px]">
                            {hyp.supportingEvidence.map((evText, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                                <span>{evText}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Contradicting Evidence */}
                        <div className="p-3 rounded-lg bg-red-950/15 border border-red-500/25 space-y-2">
                          <div className="flex items-center gap-1.5 text-red-400 font-bold text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Contradicting Evidence ({hyp.contradictingEvidence.length})</span>
                          </div>
                          {hyp.contradictingEvidence.length === 0 ? (
                            <div className="text-[11px] text-slate-500 italic">
                              No contradicting telemetry identified.
                            </div>
                          ) : (
                            <ul className="space-y-1.5 text-slate-300 text-[11px]">
                              {hyp.contradictingEvidence.map((evText, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                                  <span className="text-red-400 font-bold mt-0.5">•</span>
                                  <span>{evText}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* AI Conclusion & Reasoning */}
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-500">
                          AI Diagnostic Conclusion
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">
                          {hyp.conclusion}
                        </p>
                      </div>

                      {/* Recommended Investigation Steps */}
                      {hyp.recommendedSteps && hyp.recommendedSteps.length > 0 && (
                        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-850 space-y-2">
                          <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                            <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                            <span>Recommended Verification Steps</span>
                          </div>
                          <ol className="space-y-1 text-[11px] text-slate-300 list-decimal list-inside">
                            {hyp.recommendedSteps.map((step, idx) => (
                              <li key={idx} className="leading-relaxed">{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Human Verification State / Action Controls */}
                      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-lg">
                        <div>
                          {isConfirmed && hyp.confirmedBy && (
                            <div className="text-[11px] text-emerald-300 font-mono">
                              ✓ Confirmed by <strong>{hyp.confirmedBy}</strong> on{' '}
                              {new Date(hyp.confirmedTimestamp!).toLocaleString([], {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </div>
                          )}
                          {isRejected && hyp.rejectedBy && (
                            <div className="text-[11px] text-red-400 font-mono">
                              ✕ Rejected by <strong>{hyp.rejectedBy}</strong>. Reason: {hyp.rejectedReason}
                            </div>
                          )}
                          {!isConfirmed && !isRejected && (
                            <div className="text-[11px] text-slate-400 font-mono">
                              Human verification required before initiating production resolution.
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {!isConfirmed && (
                            <button
                              id={`btn-confirm-root-cause-${hyp.id}`}
                              onClick={() => {
                                setConfirmingHypothesis(hyp);
                                setRootCauseStatement(`${hyp.title}: ${hyp.description}`);
                              }}
                              disabled={!canVerify}
                              className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                                canVerify
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md shadow-emerald-950/40'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm Root Cause</span>
                            </button>
                          )}

                          {!isRejected && !isConfirmed && (
                            <button
                              id={`btn-reject-hypothesis-${hyp.id}`}
                              onClick={() => {
                                setRejectingHypothesis(hyp);
                                setRejectionReason('');
                              }}
                              disabled={!canVerify}
                              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                                canVerify
                                  ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 cursor-pointer'
                                  : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                              }`}
                            >
                              Reject
                            </button>
                          )}

                          {hyp.status === 'PROPOSED' && (
                            <button
                              onClick={() => handleSetUnderReview(hyp.id)}
                              disabled={!canVerify}
                              className="px-3 py-1.5 rounded text-xs font-mono bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                            >
                              Mark Under Review
                            </button>
                          )}

                          {isConfirmed && canVerify && (
                            <button
                              onClick={() => handleRevokeConfirmation(hyp.id)}
                              className="px-3 py-1.5 rounded text-xs font-mono bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                            >
                              Revoke Confirmation
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: AI FINDINGS */}
      {activeSection === 'findings' && (
        <div className="space-y-3.5">
          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Filter Classification:</span>
            {['ALL', 'OBSERVED_FACT', 'CORRELATION', 'RECOMMENDATION'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFindingFilter(cat)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                  findingFilter === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredFindings.map((finding) => (
              <div
                key={finding.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    {getClassificationBadge(finding.classification)}
                    <span className="text-[10px] font-mono text-slate-500">
                      {finding.timestamp
                        ? new Date(finding.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold font-mono text-slate-200">
                    {finding.title}
                  </h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {finding.detail}
                  </p>
                </div>

                {finding.sourceEvidenceId && (
                  <button
                    onClick={() => {
                      onSelectEvidenceTab();
                      onSelectEvidenceItem?.(finding.sourceEvidenceId!);
                    }}
                    className="text-[11px] font-mono text-purple-400 hover:underline flex items-center gap-1 flex-shrink-0 cursor-pointer"
                  >
                    <FileText className="w-3 h-3" />
                    <span>View Evidence ({finding.sourceEvidenceId})</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: TIMELINE */}
      {activeSection === 'timeline' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400 font-mono">
            Unified chronological progression constructed from system events, deployments, and evidence logs.
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {investigation.timeline.map((item) => (
              <div key={item.id} className="relative group">
                <div
                  className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                    item.isAbnormal
                      ? 'bg-red-500 border-red-950 animate-pulse'
                      : 'bg-purple-500 border-purple-950'
                  }`}
                />

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      {getClassificationBadge(item.classification)}
                      {item.isAbnormal && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                          ANOMALY
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {item.type}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold font-mono text-slate-100">
                    {item.title}
                  </h5>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: RUNBOOKS & RECOMMENDED ACTIONS */}
      {activeSection === 'runbooks' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Recommended mitigation actions and SRE runbooks.</span>
          </div>

          <div className="space-y-3">
            {investigation.recommendedRunbooks.map((rb) => (
              <div
                key={rb.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold font-mono text-slate-100">
                        {rb.title}
                      </h4>
                      {rb.requiresApproval && (
                        <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          REQUIRES HUMAN APPROVAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {rb.description}
                    </p>
                  </div>
                </div>

                {rb.command && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>RUNBOOK COMMAND (Execute manually in secure shell):</span>
                      <button
                        onClick={() => handleCopyCommand(rb.id, rb.command!)}
                        className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedRunbookId === rb.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Command</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 bg-black/80 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap select-all">
                      {rb.command}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: AI COPILOT CHAT */}
      {activeSection === 'chat' && (
        <AiChatPanel
          incident={incident}
          investigation={investigation}
          evidenceList={evidenceList}
          onInvestigationUpdated={() => onRefreshIncident()}
          onSelectEvidence={(evId) => {
            onSelectEvidenceTab();
            onSelectEvidenceItem?.(evId);
          }}
        />
      )}

      {/* CONFIRM ROOT CAUSE MODAL */}
      {confirmingHypothesis && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-100">
                  Confirm Root Cause
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Human verification for {incident.incidentNumber}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              <div className="text-[10px] text-slate-500 uppercase">Selected Hypothesis</div>
              <div className="font-bold text-slate-100 mt-0.5">{confirmingHypothesis.title}</div>
              <div className="text-[11px] text-slate-400 mt-1">Confidence: {confirmingHypothesis.confidence}%</div>
            </div>

            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                  Official Root Cause Statement:
                </label>
                <textarea
                  rows={4}
                  required
                  value={rootCauseStatement}
                  onChange={(e) => setRootCauseStatement(e.target.value)}
                  placeholder="Summarize the confirmed causal mechanism verified by the engineering team..."
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] font-mono text-emerald-200">
                Notice: Confirming this hypothesis records <strong>{currentUser.name}</strong> as the verifying engineer, logs an entry to the incident timeline, and updates the incident's confirmed root cause.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfirmingHypothesis(null)}
                  disabled={isSubmittingConfirm}
                  className="px-3 py-2 rounded text-xs font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rootCauseStatement.trim() || isSubmittingConfirm}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {isSubmittingConfirm ? 'Confirming...' : 'Sign-Off & Confirm Root Cause'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT HYPOTHESIS MODAL */}
      {rejectingHypothesis && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/20 border border-red-400 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-100">
                  Reject Hypothesis
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {rejectingHypothesis.title}
                </p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                  Reason for Rejection:
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this hypothesis is rejected based on inspection (e.g. contradicting metrics, canary passed, etc.)..."
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectingHypothesis(null)}
                  disabled={isSubmittingReject}
                  className="px-3 py-2 rounded text-xs font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rejectionReason.trim() || isSubmittingReject}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {isSubmittingReject ? 'Rejecting...' : 'Reject Hypothesis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
