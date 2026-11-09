import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'secondary';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    success: 'bg-[#ECFDF5] text-[#059669] border-[#059669] dark:bg-[#064E3B]/30 dark:text-[#34D399]',
    warning: 'bg-[#FFFBEB] text-[#D97706] border-[#D97706] dark:bg-[#78350F]/30 dark:text-[#FBBF24]',
    danger: 'bg-[#FEF2F2] text-[#B91C1C] border-[#B91C1C] dark:bg-[#7F1D1D]/30 dark:text-[#F87171]',
    info: 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB] dark:bg-[#1E3A8A]/30 dark:text-[#60A5FA]',
    neutral: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    primary: 'bg-[#EEF8F7] text-[#1F413D] border-[#59BBAF] dark:bg-[#1F413D]/40 dark:text-[#59BBAF]',
    secondary: 'bg-[#E9EAEF] text-[#202A5A] border-[#202A5A] dark:bg-[#202A5A]/40 dark:text-[#8194EE]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-lg border-[1.5px] font-sans select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
