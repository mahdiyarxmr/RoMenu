import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'persona';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-bold font-sans rounded-xl select-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none';

  const sizeStyles = {
    sm: 'h-9 px-3.5 text-xs',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-11 w-11 p-0',
  };

  const variantStyles = {
    primary:
      'bg-[#59BBAF] text-[#1F413D] hover:bg-[#50A89E] active:bg-[#47968C] rk-neo-btn border-[#202A5A] dark:border-[#242F42]',
    secondary:
      'bg-[#202A5A] text-white hover:bg-[#1D2651] active:bg-[#1A2248] rk-neo-btn border-[#0B0F1F]',
    outline:
      'bg-white dark:bg-[#151C28] text-[#1E293B] dark:text-white hover:bg-slate-50 dark:hover:bg-[#1C2536] rk-neo-btn border-[#202A5A] dark:border-[#242F42]',
    ghost:
      'bg-transparent text-[#1E293B] dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#1C2536] border-none shadow-none',
    danger:
      'bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C] rk-neo-btn border-[#B91C1C]',
    persona:
      'bg-[var(--theme-normal)] text-[var(--theme-darker)] hover:opacity-90 active:opacity-100 rk-neo-btn border-[#202A5A] dark:border-[#242F42]',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>در حال پردازش...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
