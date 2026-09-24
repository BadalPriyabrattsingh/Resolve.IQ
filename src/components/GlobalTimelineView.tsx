import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Radio,
  Flame,
  User as UserIcon,
  Paperclip,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { TimelineEvent, Incident } from '../types';
import { api } from '../api';

interface GlobalTimelineViewProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
}

export const GlobalTimelineView: React.FC<GlobalTimelineViewProps> = ({
  incidents,
  onSelectIncident,
}) => {
  const [allEvents, setAllEvents] = useState<(TimelineEvent & { incidentNumber?: string; incidentTitle?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    async function loadAllTimeline() {
      try {
        setLoading(true);
        const incidentMap = new Map(incidents.map((i) => [i.id, i]));
        const promises = incidents.slice(0, 10).map((inc) =>
          api.getTimeline(inc.id).then((events) =>
            events.map((ev) => ({
              ...ev,
              incidentNumber: incidentMap.get(ev.incidentId)?.incidentNumber,
              incidentTitle: incidentMap.get(ev.incidentId)?.title,
            }))
          )
        );
        const results = await Promise.all(promises);
        const flattened = results.flat();
        // Sort descending by timestamp (most recent first)
        flattened.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAllEvents(flattened);
      } catch (err) {
        console.error('Failed to load global timeline:', err);
      } finally {
        setLoading(false);
      }
    }

    if (incidents.length > 0) {
      loadAllTimeline();
    }
  }, [incidents]);

  const filteredEvents = allEvents.filter((ev) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'STATUS' && ev.eventType === 'STATUS_CHANGE') return true;
    if (filterType === 'SEVERITY' && ev.eventType === 'SEVERITY_CHANGE') return true;
    if (filterType === 'EVIDENCE' && ev.eventType === 'EVIDENCE_ADDED') return true;
    if (filterType === 'COMMENT' && ev.eventType === 'COMMENT') return true;
    return false;
  });

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'CREATED':
        return { label: 'Created', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' };
      case 'STATUS_CHANGE':
        return { label: 'Status', color: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20' };
      case 'SEVERITY_CHANGE':
        return { label: 'Severity', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' };
      case 'EVIDENCE_ADDED':
        return { label: 'Evidence', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      case 'COMMENT':
        return { label: 'Comment', color: 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08]' };
      case 'RESOLVED':
        return { label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      default:
        return { label: type, color: 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08]' };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Global Incident Audit Feed</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-white/[0.08]">
              {filteredEvents.length} events
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable, cross-incident chronological audit trail across all clusters.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] p-1 rounded-lg text-xs font-mono shadow-xs">
          {['ALL', 'STATUS', 'SEVERITY', 'EVIDENCE', 'COMMENT'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filterType === t
                  ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Feed List */}
      <div className="rounded-xl bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] p-4 shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-400 font-mono text-xs space-y-2">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>Streaming cluster events...</div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs">
            No events match the selected filter.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-white/[0.08]">
            {filteredEvents.map((ev) => {
              const badge = getEventBadge(ev.eventType);

              return (
                <div key={ev.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-[#121820] group-hover:bg-teal-500 transition-colors" />

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${badge.color}`}>
                          {badge.label}
                        </span>

                        {ev.incidentNumber && (
                          <button
                            onClick={() => onSelectIncident(ev.incidentId)}
                            className="font-mono font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>{ev.incidentNumber}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}

                        <span className="font-semibold text-slate-900 dark:text-slate-200">{ev.title}</span>
                      </div>

                      {ev.description && (
                        <p className="text-slate-600 dark:text-slate-400 text-xs font-sans leading-relaxed">
                          {ev.description}
                        </p>
                      )}

                      <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-2">
                        <span>Actor: {ev.actorName}</span>
                        <span>•</span>
                        <span>{new Date(ev.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
