import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'raised';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-[#151C28] rk-neo-card border-slate-300 dark:border-[#242F42]',
    flat: 'bg-white dark:bg-[#151C28] border-[1.5px] border-slate-200 dark:border-[#242F42] shadow-none',
    raised: 'bg-white dark:bg-[#1C2536] border-[1.5px] border-slate-300 dark:border-[#242F42] shadow-hard-lg',
  };

  return (
    <div
      className={`rounded-2xl p-4 transition-all ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
