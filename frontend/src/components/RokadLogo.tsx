'use client';

import React from 'react';

interface RokadLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'vertical' | 'icon' | 'text';
  showBadge?: boolean;
}

export const RokadLogo: React.FC<RokadLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'horizontal',
  showBadge = true,
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7 p-1 rounded-lg',
    md: 'w-9 h-9 p-1.5 rounded-xl',
    lg: 'w-12 h-12 p-2 rounded-2xl',
    xl: 'w-16 h-16 p-3 rounded-2xl',
  };

  const typoDimensions = {
    sm: 'h-4 w-auto',
    md: 'h-5 w-auto',
    lg: 'h-7 w-auto',
    xl: 'h-10 w-auto',
  };

  const bofeTextSizes = {
    sm: 'text-xs',
    md: 'text-[15px]',
    lg: 'text-[18px]',
    xl: 'text-[22px]',
  };

  const badgeTextSizes = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[10px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1',
    xl: 'text-sm px-3 py-1',
  };

  // Official Vector Rokad Sign Symbol
  const RokadSignSvg = (
    <svg
      viewBox="0 0 1383 1810"
      className="w-full h-full drop-shadow-[0_0_6px_rgba(89,187,175,0.4)]"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M1354.57,469.13c-5.82-2.6-12.38-3.99-18.81-3.97H418.68V75.6h849.17l-230.43,236.99c-14.48,14.89-14.15,38.7,0.75,53.18 c14.89,14.48,38.7,14.15,53.18-0.75l0,0l278.3-286.23l0.02-0.02c4.22-4.33,7.63-9.59,9.83-15.16c2.22-5.58,3.24-11.4,3.24-16.97 c-0.06-11.99-4.46-23-12.52-31.68c-4.04-4.33-9.1-8.03-14.92-10.61c-5.8-2.59-12.34-3.98-18.77-3.96H389.66 c-12.64-0.02-24.43,5.23-32.67,13.53c-8.3,8.24-13.55,20.03-13.53,32.67v447.59c-0.02,12.64,5.23,24.43,13.53,32.67 c8.24,8.3,20.03,13.55,32.67,13.53h874.84L232.35,1547.83l583.32-858.38c11.67-17.18,7.21-40.57-9.97-52.24 c-17.18-11.67-40.57-7.21-52.24,9.97L8.1,1743.99l0.08-0.12C3.05,1751.22-0.07,1760.8,0,1770c0,6.81,1.55,13.27,4.07,18.82 c3.82,8.36,9.57,14.84,16.64,19.59c7.06,4.71,15.8,7.81,25.68,7.83c5.69,0.01,11.72-1.11,17.33-3.43 c5.62-2.3,10.73-5.77,14.83-9.78l0.02-0.02l1289.46-1258.6l0.08-0.07c4.44-4.34,8.06-9.69,10.4-15.4 c2.36-5.72,3.47-11.73,3.47-17.52c-0.06-11.92-4.4-22.9-12.45-31.63C1365.48,475.46,1360.41,471.73,1354.57,469.13z" />
    </svg>
  );

  // Official Vector Typographic Wordmark "رُکاد" (from Primary Logo Fa-01.svg)
  const RokadTypoSvg = (
    <svg
      viewBox="540 1560 840 260"
      className={`${typoDimensions[size]} overflow-visible`}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M1363.28,1637.34c-7.15-4.68-16.73-2.67-21.4,4.47l-91.59,140.01c-4.68,7.15-2.67,16.73,4.47,21.4 c7.15,4.68,16.73,2.67,21.4-4.47l91.59-140.01C1372.43,1651.6,1370.42,1642.01,1363.28,1637.34z" />
      <path d="M996.62,1723.74l91.59-140.01c4.68-7.15,2.67-16.73-4.47-21.4c-7.15-4.68-16.73-2.67-21.4,4.47l-91.59,140.01 c-4.68,7.15-2.67,16.73,4.47,21.4C982.36,1732.89,991.95,1730.88,996.62,1723.74z" />
      <path d="M1129.17,1636.35h-25.15c-8.54,0-15.46,6.92-15.46,15.46c0,8.54,6.92,15.46,15.46,15.46v0h25.15 c14.87,0.01,28.2,5.98,37.96,15.73c9.74,9.76,15.72,23.09,15.73,37.97c-0.01,14.87-5.98,28.2-15.73,37.96 c-9.76,9.74-23.09,15.72-37.96,15.73H788.73c-3.57-0.01-6.66-1.41-9.02-3.74c-2.33-2.36-3.73-5.45-3.74-9.02v-109.53 c0-8.54-6.92-15.46-15.46-15.46c-8.54,0-15.46,6.92-15.46,15.46l0,109.53c-0.01,12.01,4.91,23.03,12.79,30.89 c7.86,7.88,18.87,12.8,30.89,12.79h340.44c23.32,0.01,44.57-9.49,59.83-24.78c15.29-15.26,24.79-36.52,24.78-59.83 c0.01-23.32-9.5-44.57-24.78-59.83C1173.73,1645.85,1152.48,1636.34,1129.17,1636.35z" />
      <path d="M684.33,1643.87c-5.54-2.48-11.8-3.84-18.34-3.83h-88.94c-8.54,0-15.46,6.92-15.46,15.46c0,8.54,6.92,15.46,15.46,15.46v0 H666c2.34,0.01,4.15,0.45,5.74,1.15c2.36,1.05,4.29,2.79,5.72,5.07c1.42,2.27,2.21,5.03,2.2,7.65c0,1.89-0.38,3.69-1.16,5.37 c-0.79,1.69-1.95,3.3-3.91,4.91l-100.03,83.11c-6.57,5.46-7.47,15.21-2.01,21.78c5.46,6.57,15.21,7.47,21.78,2.01l99.85-82.97 c5.46-4.46,9.67-9.94,12.39-15.85c2.74-5.92,4.02-12.22,4.02-18.36c-0.03-11.38-4.26-22.32-12.02-30.75 C694.69,1649.89,689.88,1646.33,684.33,1643.87z" />
    </svg>
  );

  // Variant: Icon Only (Sign Emblem)
  if (variant === 'icon') {
    return (
      <div
        className={`${iconDimensions[size]} relative flex items-center justify-center bg-gradient-to-br from-[#EEF8F7] to-[#D7EFEA] dark:bg-gradient-to-br dark:from-[#172433] dark:via-[#101A26] dark:to-[#0A121A] text-[#1F413D] dark:text-[#59BBAF] border border-[#59BBAF]/40 shadow-xs dark:shadow-[0_0_12px_rgba(89,187,175,0.22)] select-none transition-transform hover:scale-105 active:scale-95 ${className}`}
      >
        {RokadSignSvg}
      </div>
    );
  }

  // Variant: Text Only ("بوفه رُکاد" Typographic Wordmark)
  if (variant === 'text') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-[#202A5A] dark:text-white leading-none select-none ${className}`}
      >
        <span
          className={`font-black text-slate-800 dark:text-white leading-none tracking-tight select-none ${bofeTextSizes[size]}`}
        >
          بوفه
        </span>
        <div className="text-[#202A5A] dark:text-[#59BBAF] hover:text-[#59BBAF] transition-colors leading-none -translate-y-[2px]">
          {RokadTypoSvg}
        </div>
      </div>
    );
  }

  // Variant: Vertical Stack (Sign on top, Typo below)
  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-3 select-none ${className}`}>
        {/* Modern Emblem */}
        <div
          className={`${iconDimensions[size]} relative flex items-center justify-center bg-gradient-to-br from-[#EEF8F7] to-[#D7EFEA] dark:bg-gradient-to-br dark:from-[#1A2838] dark:via-[#111C28] dark:to-[#0B131D] text-[#1F413D] dark:text-[#59BBAF] border border-[#59BBAF]/50 shadow-sm dark:shadow-[0_0_20px_rgba(89,187,175,0.28)]`}
        >
          {RokadSignSvg}
        </div>

        {/* Typo + Badge */}
        <div className="flex flex-col items-center gap-1.5 text-[#202A5A] dark:text-white">
          <div className="flex items-center gap-1.5 text-[#202A5A] dark:text-white leading-none">
            <span className={`font-black text-slate-800 dark:text-white leading-none ${bofeTextSizes[size]}`}>
              بوفه
            </span>
            <div className="text-[#202A5A] dark:text-[#59BBAF] transition-colors leading-none -translate-y-[2px]">
              {RokadTypoSvg}
            </div>
          </div>
          {showBadge && (
            <span
              className={`rounded-full font-black tracking-wide border border-[#59BBAF]/40 bg-[#EEF8F7] dark:bg-[#151C28] text-[#1F413D] dark:text-[#59BBAF] shadow-xs ${badgeTextSizes[size]}`}
            >
              بوفه هوشمند رُکاد
            </span>
          )}
        </div>
      </div>
    );
  }

  // Variant: Horizontal (Default)
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Modern Cyber-Glass Sign Emblem */}
      <div
        className={`${iconDimensions[size]} relative flex items-center justify-center bg-gradient-to-br from-[#EEF8F7] to-[#D7EFEA] dark:bg-gradient-to-br dark:from-[#172433] dark:via-[#101A26] dark:to-[#0A121A] text-[#1F413D] dark:text-[#59BBAF] border border-[#59BBAF]/40 shadow-xs dark:shadow-[0_0_12px_rgba(89,187,175,0.22)] flex-shrink-0 transition-all hover:scale-105 hover:border-[#59BBAF] hover:dark:shadow-[0_0_16px_rgba(89,187,175,0.35)] active:scale-95`}
      >
        {RokadSignSvg}
      </div>

      {/* Perfectly Leveled & Aligned "بوفه رُکاد" Typographic Lockup */}
      <div className="flex flex-col text-right justify-center">
        <div className="flex items-center gap-1.5 text-[#202A5A] dark:text-white leading-none">
          <span
            className={`font-black text-slate-800 dark:text-white leading-none tracking-tight select-none ${bofeTextSizes[size]}`}
          >
            بوفه
          </span>
          <div className="text-[#202A5A] dark:text-[#59BBAF] hover:text-[#59BBAF] transition-colors leading-none -translate-y-[2px]">
            {RokadTypoSvg}
          </div>
        </div>
        {showBadge && (
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mt-0.5">
            ROKAD BUFFET PASS
          </span>
        )}
      </div>
    </div>
  );
};
