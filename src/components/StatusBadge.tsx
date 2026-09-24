import React from 'react';
import { IncidentStatus } from '../types';
import { Radio, Search, Wrench, CheckCircle2, Archive, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: IncidentStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const getConfig = () => {
    switch (status) {
      case 'DETECTED':
        return {
          bg: 'bg-[#e07a5f]/15 text-[#fca5a5] border-[#e07a5f]/40',
          dot: 'bg-[#e07a5f] animate-ping',
          icon: AlertCircle,
          label: 'DETECTED',
        };
      case 'TRIAGED':
        return {
          bg: 'bg-teal-500/15 text-[#2dd4bf] border-teal-500/30',
          dot: 'bg-teal-400',
          icon: Radio,
          label: 'TRIAGED',
        };
      case 'INVESTIGATING':
        return {
          bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          dot: 'bg-cyan-400 animate-pulse',
          icon: Search,
          label: 'INVESTIGATING',
        };
      case 'MITIGATING':
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400 animate-pulse',
          icon: Wrench,
          label: 'MITIGATING',
        };
      case 'RESOLVED':
        return {
          bg: 'bg-teal-500/20 text-[#2dd4bf] border-teal-500/40',
          dot: 'bg-[#2dd4bf]',
          icon: CheckCircle2,
          label: 'RESOLVED',
        };
      case 'CLOSED':
        return {
          bg: 'bg-[#0D151C] text-slate-400 border-[#1A2833]',
          dot: 'bg-slate-500',
          icon: Archive,
          label: 'CLOSED',
        };
      default:
        return {
          bg: 'bg-[#0D151C] text-slate-300 border-[#1A2833]',
          dot: 'bg-slate-400',
          icon: AlertCircle,
          label: status,
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'text-[11px] px-2 py-0.5';
      case 'lg':
        return 'text-sm px-3.5 py-1.5 font-bold';
      case 'md':
      default:
        return 'text-xs px-2.5 py-1 font-semibold';
    }
  };

  return (
    <span
      id={`status-badge-${status.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 rounded border font-mono uppercase tracking-wider whitespace-nowrap ${config.bg} ${getSize()} ${className}`}
    >
      {showIcon && (
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot.replace('animate-ping', '').replace('animate-pulse', '')}`} />
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
};
