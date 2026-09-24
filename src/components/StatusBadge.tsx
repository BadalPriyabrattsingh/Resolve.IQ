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
          bg: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 dark:border-red-500/30',
          dot: 'bg-red-500',
          icon: AlertCircle,
          label: 'DETECTED',
        };
      case 'TRIAGED':
        return {
          bg: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 dark:border-teal-500/30',
          dot: 'bg-teal-500',
          icon: Radio,
          label: 'TRIAGED',
        };
      case 'INVESTIGATING':
        return {
          bg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20 dark:border-sky-500/30',
          dot: 'bg-sky-500',
          icon: Search,
          label: 'INVESTIGATING',
        };
      case 'MITIGATING':
        return {
          bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 dark:border-amber-500/30',
          dot: 'bg-amber-500',
          icon: Wrench,
          label: 'MITIGATING',
        };
      case 'RESOLVED':
        return {
          bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 dark:border-emerald-500/30',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          label: 'RESOLVED',
        };
      case 'CLOSED':
        return {
          bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
          dot: 'bg-slate-400',
          icon: Archive,
          label: 'CLOSED',
        };
    }
  };

  const { bg, dot, icon: Icon, label } = getConfig();

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-[11px] px-2 py-0.5 font-medium',
    lg: 'text-xs px-2.5 py-1 font-medium',
  }[size];

  return (
    <span
      id={`status-badge-${status.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 rounded-md border font-mono tracking-normal whitespace-nowrap select-none transition-colors ${bg} ${sizeClasses} ${className}`}
    >
      {showIcon ? (
        <Icon className="w-3 h-3 shrink-0" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      )}
      <span>{label}</span>
    </span>
  );
};
