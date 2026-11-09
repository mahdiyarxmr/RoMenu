'use client';

import React from 'react';

interface RokadLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const RokadLogo: React.FC<RokadLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Official Vector Sign from Design Pack */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#EEF8F7] to-[#E0F2FE] dark:from-[#1C2536] dark:to-[#151C28] border-[1.5px] border-[#59BBAF] shadow-hard-xs flex-shrink-0 p-1`}
      >
        <img
          src="/logos/Sign-01.svg"
          alt="رُکاد"
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <div className="flex flex-col text-right leading-none">
          <div className={`font-black tracking-tight text-[#202A5A] dark:text-white ${textSizes[size]}`}>
            بوفه <span className="text-[#59BBAF]">رُکاد</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mt-0.5">
            ROKAD BUFFET
          </span>
        </div>
      )}
    </div>
  );
};
