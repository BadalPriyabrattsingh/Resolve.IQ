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
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500 animate-ping',
          icon: AlertCircle,
          label: 'DETECTED',
        };
      case 'TRIAGED':
        return {
          bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
          dot: 'bg-purple-400',
          icon: Radio,
          label: 'TRIAGED',
        };
      case 'INVESTIGATING':
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          dot: 'bg-blue-500 animate-pulse',
          icon: Search,
          label: 'INVESTIGATING',
        };
      case 'MITIGATING':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400 animate-pulse',
          icon: Wrench,
          label: 'MITIGATING',
        };
      case 'RESOLVED':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
          icon: CheckCircle2,
          label: 'RESOLVED',
        };
      case 'CLOSED':
        return {
          bg: 'bg-slate-700/30 text-slate-400 border-slate-700/60',
          dot: 'bg-slate-500',
          icon: Archive,
          label: 'CLOSED',
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
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
