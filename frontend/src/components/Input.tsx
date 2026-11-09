import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leadingIcon, trailingIcon, className = '', disabled, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full text-right font-sans">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-[#1E293B] dark:text-[#E2E8F0] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leadingIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400">
              {leadingIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full h-11 px-3.5 bg-white dark:bg-[#151C28] text-[#1E293B] dark:text-white text-sm rounded-xl border-[1.5px] outline-none transition-all placeholder:text-slate-400 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 ${
              leadingIcon ? 'pr-10' : ''
            } ${trailingIcon ? 'pl-10' : ''} ${
              error
                ? 'border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20'
                : 'border-slate-300 dark:border-[#242F42] focus:border-[#59BBAF] focus:ring-2 focus:ring-[#59BBAF]/20'
            } ${className}`}
            {...props}
          />
          {trailingIcon && (
            <div className="absolute left-3.5 flex items-center text-slate-400">
              {trailingIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs font-medium text-[#EF4444]">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
