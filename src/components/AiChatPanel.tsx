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
      className="flex flex-col h-[580px] bg-[#0D151C] border border-teal-500/30 rounded-xl overflow-hidden shadow-xl"
    >
      {/* Chat Header */}
      <div className="px-4 py-3 bg-[#070D12] border-b border-[#1A2833] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#2dd4bf]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-100">
                SRE AI Copilot
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-teal-500/15 text-[#2dd4bf] border border-teal-500/30">
                EVIDENCE GROUNDED
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              Interactive Q&A for {incident.incidentNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-[#0D151C] px-2.5 py-1 rounded border border-[#1A2833]">
          <ShieldCheck className="w-3 h-3 text-[#2dd4bf]" />
          <span>Non-Autonomous</span>
        </div>
      </div>

      {/* Preset Suggestion Chips */}
      <div className="px-4 py-2 bg-[#0A1218] border-b border-[#1A2833]">
        <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-[#2dd4bf]" />
          <span>Quick Investigation Questions:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              id={`chat-preset-btn-${idx}`}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-[11px] font-mono text-teal-200 bg-[#101C25] hover:bg-[#182631] border border-[#1A2833] hover:border-teal-500/40 px-2.5 py-1 rounded transition-colors text-left disabled:opacity-50 cursor-pointer"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#070D12]/60 font-mono text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-[#2dd4bf]" />
            </div>
            <p className="text-xs font-semibold text-slate-300">
              Ask questions regarding {incident.incidentNumber}
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mt-1">
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
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#2dd4bf]" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3.5 space-y-2 ${
                    isUser
                      ? 'bg-teal-500/15 border border-teal-500/30 text-teal-100'
                      : 'bg-[#0D151C] border border-[#1A2833] text-slate-200 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 mb-1 border-b border-[#1A2833] pb-1">
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
                  <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-slate-200">
                    {msg.content}
                  </div>

                  {/* Grounded Evidence Footnotes */}
                  {!isUser && msg.groundedEvidence && msg.groundedEvidence.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-[#1A2833] text-[10px] font-mono text-slate-400 space-y-1">
                      <div className="flex items-center gap-1 text-slate-500">
                        <CornerDownRight className="w-3 h-3 text-[#2dd4bf]" />
                        <span>Grounded in Evidence:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.groundedEvidence.map((evId) => {
                          const ev = evidenceList.find((e) => e.id === evId);
                          return (
                            <span
                              key={evId}
                              onClick={() => onSelectEvidence?.(evId)}
                              className="px-1.5 py-0.5 rounded bg-[#070D12] border border-[#1A2833] text-slate-300 hover:border-teal-500/60 hover:text-[#2dd4bf] transition-colors cursor-pointer inline-flex items-center gap-1"
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
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <User className="w-3.5 h-3.5 text-[#2dd4bf]" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-[#2dd4bf]" />
            </div>
            <div className="bg-[#0D151C] border border-[#1A2833] rounded-xl p-3.5 flex items-center gap-2 text-xs font-mono text-[#2dd4bf]">
              <div className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing incident evidence telemetry...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error notification */}
      {error && (
        <div className="px-4 py-2 bg-[#e07a5f]/20 border-t border-[#e07a5f]/40 text-[#fca5a5] text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-[#070D12] border-t border-[#1A2833] flex items-center gap-2"
      >
        <input
          type="text"
          id="ai-chat-input"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask a question about this incident's logs, metrics, or hypotheses..."
          disabled={loading}
          className="flex-1 px-3 py-2 text-xs font-mono bg-[#0D151C] border border-[#1A2833] rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#2dd4bf]"
        />
        <button
          type="submit"
          id="ai-chat-submit-btn"
          disabled={!inputMessage.trim() || loading}
          className="px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#20b2aa] text-[#080D11] font-mono text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};
