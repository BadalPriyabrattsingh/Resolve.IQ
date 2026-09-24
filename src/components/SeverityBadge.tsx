import React from 'react';
import { Severity } from '../types';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  interactive = false,
  onClick,
  className = '',
}) => {
  const getStyles = () => {
    switch (severity) {
      case 'SEV-1':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/30';
      case 'SEV-2':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 dark:border-orange-500/30';
      case 'SEV-3':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 dark:border-amber-500/30';
      case 'SEV-4':
        return 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 dark:border-teal-500/30';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'text-[11px] px-1.5 py-0.5';
      case 'lg':
        return 'text-xs px-2.5 py-1 font-semibold';
      case 'md':
      default:
        return 'text-[11px] px-2 py-0.5 font-medium';
    }
  };

  const getDot = () => {
    switch (severity) {
      case 'SEV-1':
        return 'bg-red-500';
      case 'SEV-2':
        return 'bg-orange-500';
      case 'SEV-3':
        return 'bg-amber-500';
      case 'SEV-4':
        return 'bg-teal-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span
      id={`sev-badge-${severity.toLowerCase()}`}
      onClick={interactive ? onClick : undefined}
      className={`inline-flex items-center gap-1.5 rounded-md border font-mono tracking-normal whitespace-nowrap transition-colors select-none ${getStyles()} ${getSize()} ${
        interactive ? 'cursor-pointer hover:opacity-85' : ''
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDot()}`} />
      <span>{severity}</span>
    </span>
  );
};
