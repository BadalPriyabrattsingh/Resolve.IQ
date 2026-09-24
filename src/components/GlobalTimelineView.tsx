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
    return ev.eventType === filterType;
  });

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

  const getNodeColor = (eventType: TimelineEvent['eventType']) => {
    switch (eventType) {
      case 'CREATED':
        return 'bg-[#e07a5f] text-white ring-4 ring-[#e07a5f]/20';
      case 'STATUS_CHANGE':
        return 'bg-[#2dd4bf] text-[#080D11] ring-4 ring-teal-500/20';
      case 'SEVERITY_CHANGE':
        return 'bg-amber-500 text-white ring-4 ring-amber-500/20';
      case 'RESOLUTION':
        return 'bg-emerald-500 text-white ring-4 ring-emerald-500/20';
      case 'ASSIGNMENT':
        return 'bg-teal-600 text-white ring-4 ring-teal-600/20';
      case 'COMMENT':
        return 'bg-[#182631] text-slate-300 ring-4 ring-[#182631]/40';
      default:
        return 'bg-[#182631] text-slate-300 ring-4 ring-[#182631]/40';
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1A2833]">
        <div>
          <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2dd4bf]" />
            <span>Global Operations Timeline Feed</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time chronological telemetry stream of state transitions, evidence attachments, and mitigations.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">Filter Event:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#070D12] border border-[#1A2833] rounded px-2.5 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-[#2dd4bf]"
          >
            <option value="ALL">All Event Types</option>
            <option value="CREATED">Created</option>
            <option value="STATUS_CHANGE">Status Changes</option>
            <option value="SEVERITY_CHANGE">Severity Changes</option>
            <option value="EVIDENCE_ADDED">Evidence Added</option>
            <option value="RESOLUTION">Resolutions</option>
            <option value="COMMENT">Comments</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">
          <div className="w-6 h-6 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Aggregating cross-service audit trail...
        </div>
      ) : (
        <div className="p-5 rounded-xl bg-[#0D151C] border border-[#1A2833]">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1A2833]">
            {filteredEvents.map((event) => {
              const Icon = getTimelineIcon(event.eventType);

              return (
                <div key={event.id} className="relative group">
                  <div
                    className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${getNodeColor(
                      event.eventType
                    )}`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#070D12] border border-[#1A2833] hover:border-teal-500/40 transition-colors space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {event.incidentNumber && (
                          <button
                            onClick={() => onSelectIncident(event.incidentId)}
                            className="font-mono text-xs font-bold text-[#2dd4bf] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{event.incidentNumber}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                        <span className="text-xs font-bold text-slate-200">{event.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#101C25] text-slate-400 border border-[#1A2833]">
                          {event.eventType}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(event.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>

                    <div className="pt-1.5 border-t border-[#182631] flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{event.actorName}</span>
                        <span className="px-1 py-0.2 rounded bg-[#0D151C] text-slate-400 border border-[#1A2833]">
                          {event.actorRole}
                        </span>
                      </div>
                      {event.incidentTitle && (
                        <span className="text-slate-500 truncate max-w-xs">{event.incidentTitle}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
