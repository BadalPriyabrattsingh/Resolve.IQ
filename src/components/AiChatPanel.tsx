import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  User,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  CornerDownRight,
  Database,
  FileText,
} from 'lucide-react';
import { Incident, Investigation, Evidence, InvestigationChatMessage } from '../types';
import { api } from '../api';

interface AiChatPanelProps {
  incident: Incident;
  investigation: Investigation;
  evidenceList: Evidence[];
  onInvestigationUpdated: (updated: Investigation) => void;
  onSelectEvidence?: (evidenceId: string) => void;
}

const PRESET_QUESTIONS = [
  'Why do you think database exhaustion is related?',
  'What evidence supports this hypothesis?',
  'What should I investigate next?',
  'What changed before the incident?',
];

export const AiChatPanel: React.FC<AiChatPanelProps> = ({
  incident,
  investigation,
  evidenceList,
  onInvestigationUpdated,
  onSelectEvidence,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages: InvestigationChatMessage[] = investigation.chatHistory || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setError(null);
    setLoading(true);

    try {
      const result = await api.sendInvestigationChatMessage(incident.id, text);
      onInvestigationUpdated(result.investigation);
      setInputMessage('');
    } catch (err) {
      setError((err as Error).message || 'Failed to get answer from AI Assistant');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  return (
    <div
      id="ai-chat-panel"
      className="flex flex-col h-[580px] bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-xs"
    >
      {/* Chat Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-[#0C1015] border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                SRE AI Copilot
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                EVIDENCE GROUNDED
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Interactive Q&A for {incident.incidentNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-[#18202A] px-2.5 py-1 rounded border border-slate-200 dark:border-white/[0.08]">
          <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />
          <span>Non-Autonomous</span>
        </div>
      </div>

      {/* Preset Suggestion Chips */}
      <div className="px-4 py-2 bg-slate-100/60 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06]">
        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-teal-600 dark:text-teal-400" />
          <span>Quick Investigation Questions:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              id={`chat-preset-btn-${idx}`}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-[11px] font-mono text-teal-700 dark:text-teal-300 bg-white dark:bg-[#18202A] hover:bg-slate-50 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] hover:border-teal-500/40 px-2.5 py-1 rounded transition-colors text-left disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-[#0C1015]/60 font-mono text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Ask questions regarding {incident.incidentNumber}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              The AI assistant will formulate responses strictly referencing the attached {evidenceList.length} evidence items, distinguishing observed facts from hypotheses.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3.5 space-y-2 ${
                    isUser
                      ? 'bg-teal-500/10 border border-teal-500/30 text-teal-900 dark:text-teal-100'
                      : 'bg-white dark:bg-[#18202A] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[10px] text-slate-500 dark:text-slate-400 mb-1 border-b border-slate-100 dark:border-white/[0.06] pb-1">
                    <span className="font-bold">
                      {isUser ? 'You (Engineer)' : 'ResolveIQ Copilot'}
                    </span>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Message body with Markdown style */}
                  <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200">
                    {msg.content}
                  </div>

                  {/* Grounded Evidence Footnotes */}
                  {!isUser && msg.groundedEvidence && msg.groundedEvidence.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/[0.06] text-[10px] font-mono text-slate-500 dark:text-slate-400 space-y-1">
                      <div className="flex items-center gap-1 text-slate-500">
                        <CornerDownRight className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                        <span>Grounded in Evidence:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.groundedEvidence.map((evId) => {
                          const ev = evidenceList.find((e) => e.id === evId);
                          return (
                            <span
                              key={evId}
                              onClick={() => onSelectEvidence?.(evId)}
                              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-teal-500/60 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <FileText className="w-2.5 h-2.5 text-slate-400" />
                              {ev ? `${ev.type}: ${ev.title.slice(0, 24)}...` : evId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="bg-white dark:bg-[#18202A] border border-slate-200 dark:border-white/[0.08] rounded-xl p-3.5 flex items-center gap-2 text-xs font-mono text-teal-600 dark:text-teal-400">
              <div className="w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing incident evidence telemetry...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error notification */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-red-600 dark:text-red-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-white dark:bg-[#0C1015] border-t border-slate-200 dark:border-white/[0.08] flex items-center gap-2"
      >
        <input
          type="text"
          id="ai-chat-input"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask a question about this incident's logs, metrics, or hypotheses..."
          disabled={loading}
          className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
        />
        <button
          type="submit"
          id="ai-chat-submit-btn"
          disabled={!inputMessage.trim() || loading}
          className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};
