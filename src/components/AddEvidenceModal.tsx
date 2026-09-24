import React, { useState } from 'react';
import { Paperclip, X, Terminal } from 'lucide-react';
import { EvidenceType } from '../types';
import { api } from '../api';

interface AddEvidenceModalProps {
  isOpen: boolean;
  incidentId: string;
  onClose: () => void;
  onEvidenceAdded: () => void;
}

export const AddEvidenceModal: React.FC<AddEvidenceModalProps> = ({
  isOpen,
  incidentId,
  onClose,
  onEvidenceAdded,
}) => {
  const [type, setType] = useState<EvidenceType>('LOG');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Evidence title is required.');
      return;
    }
    if (!content.trim()) {
      setFormError('Evidence content / log output is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await api.addEvidence(incidentId, {
        type,
        title: title.trim(),
        source: source.trim() || 'Manual Engineer Upload',
        content: content.trim(),
      });

      onEvidenceAdded();
      onClose();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleSnippets: Record<EvidenceType, { title: string; source: string; content: string }> = {
    LOG: {
      title: 'Server Error Log: Out of DB connection slots',
      source: 'Kibana / pod-payment-gateway-7f99b8',
      content: `[ERROR] 2026-09-18T14:48:12.891Z - ConnectionPoolTimeoutException: Timeout after 30000ms waiting for idle connection from pool.
    at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:227)
    at org.hibernate.engine.jdbc.connections.internal.DatasourceConnectionProviderImpl.getConnection
    at com.resolveiq.payment.dao.PaymentTransactionDao.persist(PaymentTransactionDao.java:114)
    activeConnections=100 (max=100), idleConnections=0, waitingThreads=42`,
    },
    METRIC: {
      title: 'Datadog p99 Latency Spike > 4500ms',
      source: 'Datadog APM / payments.p99',
      content: `Metric: http.server.requests.latency
Tag: uri=/v1/charges/process, status=500
p50: 42ms (baseline 38ms)
p95: 1,840ms (baseline 110ms)
p99: 4,892ms (baseline 210ms)
Error Rate: 12.8% (threshold: 0.5%)`,
    },
    DEPLOYMENT: {
      title: 'Git Commit hash & release tag',
      source: 'GitHub / payments-core release v2.41.0',
      content: `commit 8f2b3e4791a89c9d4b1a629f1238914bca821045
Author: Alex Vance <alex@resolveiq.io>
Date:   Fri Sep 18 14:15:00 2026

    chore(db): update hikari connection pool timeout from 60s to 5s
    
    Changed default timeout parameters and pool size limits.
    PR #1892 (merged by continuous deployment pipeline)`,
    },
    ALERT: {
      title: 'PagerDuty Incident Trigger #9941',
      source: 'PagerDuty / SRE Tier-0 On-Call',
      content: `[CRITICAL] PagerDuty Alert Triggered:
Service: Payment Processing Engine
Rule: Synthetic Canary Check - Checkout Flow
Status: FAILING (Consecutive failures: 5)
Link: https://ops.resolveiq.internal/alerts/9941`,
    },
    DATABASE: {
      title: 'Aurora PostgreSQL lock contention snapshot',
      source: 'pg_stat_activity query snapshot',
      content: `SELECT pid, now() - query_start AS duration, query, state 
FROM pg_stat_activity 
WHERE state != 'idle' ORDER BY duration DESC;

pid  | duration        | query                                    | state
-----+-----------------+------------------------------------------+--------
4812 | 00:18:24.189201 | UPDATE accounts SET balance = balance... | active (EXCLUSIVE LOCK)
4819 | 00:16:11.892011 | SELECT * FROM transactions WHERE ...     | waiting for lock 4812
4830 | 00:15:02.109204 | SELECT * FROM transactions WHERE ...     | waiting for lock 4812`,
    },
    CONFIG_CHANGE: {
      title: 'Terraform Plan / AWS parameter group diff',
      source: 'Terraform Cloud run #4491',
      content: `~ resource "aws_db_parameter_group" "aurora_params" {
    ~ parameter {
        name  = "max_connections"
      ~ value = "100" -> "50"
    }
}`,
    },
    NETWORK: {
      title: 'VPC Gateway NAT Packet Loss Telemetry',
      source: 'AWS CloudWatch / NATGatewayLoss',
      content: `AWS/NATGateway PacketsDropCount: 14,200/min
Bandwidth saturation reached on nat-094194b1a8`,
    },
    USER_REPORT: {
      title: 'VIP Enterprise Customer Escalation via Zendesk',
      source: 'Zendesk Ticket #58190',
      content: `Customer: Acme Global Corporation
Priority: Urgent
Customer reports 100% of batch payments failing with "500 Internal Gateway Error" since 14:25 UTC. Affecting end-of-quarter payouts.`,
    },
    COMMENT: {
      title: 'SRE War Room Hypothesis',
      source: 'Sarah Chen (Incident Manager)',
      content: `Correlating release v2.41.0 with the database pool exhaustion. Proposing rollback of release v2.41.0 to v2.40.8 immediately.`,
    },
  };

  const applySample = () => {
    const sample = sampleSnippets[type];
    if (sample) {
      setTitle(sample.title);
      setSource(sample.source);
      setContent(sample.content);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0D151C] border border-[#1A2833] rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-[#1A2833]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-teal-500/20 text-[#2dd4bf] border border-teal-500/40">
              <Paperclip className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100">
                Attach Incident Evidence
              </h2>
              <p className="text-xs text-slate-400">
                Store logs, metric snapshots, stack traces, and database state.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#101C25] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="p-2.5 rounded bg-[#e07a5f]/15 border border-[#e07a5f]/40 text-[#fca5a5] text-xs font-mono">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono">
          {/* Type selector & Quick sample button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-slate-300 font-semibold block">Evidence Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EvidenceType)}
                className="w-full p-2 bg-[#070D12] border border-[#1A2833] rounded text-slate-200 focus:outline-none focus:border-[#2dd4bf]"
              >
                <option value="LOG">Application Log (Stack Trace / Kibana)</option>
                <option value="METRIC">Metric Snapshot (Latency, Throughput, Error %)</option>
                <option value="DEPLOYMENT">Deployment / Release Diff</option>
                <option value="ALERT">Alert / PagerDuty Trigger</option>
                <option value="DATABASE">Database State / Query Dump</option>
                <option value="CONFIG_CHANGE">Configuration / Infrastructure Change</option>
                <option value="NETWORK">Network / DNS / VPC Diagnostics</option>
                <option value="USER_REPORT">User / Customer Escalation</option>
                <option value="COMMENT">Investigation Note</option>
              </select>
            </div>

            <button
              type="button"
              onClick={applySample}
              className="mt-5 px-2.5 py-2 text-[11px] rounded bg-[#101C25] hover:bg-[#182631] text-[#2dd4bf] border border-teal-500/30 transition-colors whitespace-nowrap cursor-pointer"
            >
              Load Realistic Template
            </button>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">
              Evidence Title <span className="text-[#2dd4bf]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kibana Exception Log: ConnectionPoolTimeoutException"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-[#070D12] border border-[#1A2833] rounded text-slate-200 focus:outline-none focus:border-[#2dd4bf]"
            />
          </div>

          {/* Source */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Data Source / Tool</label>
            <input
              type="text"
              placeholder="e.g. Datadog APM, Kibana prod-eu-1, CloudWatch, PostgreSQL"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full p-2 bg-[#070D12] border border-[#1A2833] rounded text-slate-200 focus:outline-none focus:border-[#2dd4bf]"
            />
          </div>

          {/* Content (code / log / text) */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">
              Log Output / Telemetry Payload <span className="text-[#2dd4bf]">*</span>
            </label>
            <textarea
              rows={7}
              required
              placeholder="Paste raw log lines, error stack traces, JSON payloads, or SQL query output..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2.5 font-mono text-[11px] bg-[#070D12] border border-[#1A2833] rounded text-slate-200 focus:outline-none focus:border-[#2dd4bf] leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1A2833]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-mono rounded bg-[#101C25] text-slate-300 hover:bg-[#182631] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-mono font-bold rounded bg-[#2dd4bf] hover:bg-[#20b2aa] text-[#080D11] shadow-md shadow-teal-950/40 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Attaching...' : 'Attach Evidence'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
