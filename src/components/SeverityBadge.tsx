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
        return 'bg-[#e07a5f]/15 text-[#fca5a5] border-[#e07a5f]/40 hover:bg-[#e07a5f]/25';
      case 'SEV-2':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/40 hover:bg-orange-500/25';
      case 'SEV-3':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25';
      case 'SEV-4':
        return 'bg-teal-500/15 text-[#2dd4bf] border-teal-500/40 hover:bg-teal-500/25';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1 font-bold';
      case 'md':
      default:
        return 'text-xs px-2.5 py-1 font-semibold';
    }
  };

  return (
    <span
      id={`sev-badge-${severity.toLowerCase()}`}
      onClick={interactive ? onClick : undefined}
      className={`inline-flex items-center gap-1.5 rounded border font-mono tracking-wider whitespace-nowrap transition-colors ${getStyles()} ${getSize()} ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          severity === 'SEV-1'
            ? 'bg-red-500 animate-pulse'
            : severity === 'SEV-2'
            ? 'bg-orange-500'
            : severity === 'SEV-3'
            ? 'bg-amber-400'
            : 'bg-sky-400'
        }`}
      />
      {severity}
    </span>
  );
};
