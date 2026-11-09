import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#151C28] border-[1.5px] border-slate-300 dark:border-[#242F42] flex items-center justify-center text-slate-400 mb-4 shadow-sm">
        {icon || <PackageOpen size={32} strokeWidth={1.75} />}
      </div>
      <h3 className="text-base font-bold text-[#1E293B] dark:text-white mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-4">{description}</p>
      )}
      {actionText && onAction && (
        <Button size="sm" onClick={onAction} className="mt-2">
          {actionText}
        </Button>
      )}
    </div>
  );
};
