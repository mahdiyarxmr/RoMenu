import React, { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  disableFrame?: boolean;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children, disableFrame = false }) => {
  const [forceFullWidth, setForceFullWidth] = useState(false);

  if (disableFrame || forceFullWidth) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070A0F] flex items-center justify-center sm:py-6 sm:px-4">
      {/* Device frame toggle indicator on large screens */}
      <div className="fixed top-3 left-3 z-50 hidden sm:flex items-center gap-2 bg-white dark:bg-[#151C28] px-3 py-1.5 rounded-full border border-slate-300 dark:border-[#242F42] shadow-sm text-xs font-bold text-slate-700 dark:text-slate-200">
        <button
          onClick={() => setForceFullWidth(false)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all ${
            !forceFullWidth ? 'bg-[#59BBAF] text-[#1F413D]' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="حالت موبایل"
        >
          <Smartphone size={14} />
          <span>موبایل</span>
        </button>
        <button
          onClick={() => setForceFullWidth(true)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all ${
            forceFullWidth ? 'bg-[#59BBAF] text-[#1F413D]' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="حالت عریض دسکتاپ"
        >
          <Monitor size={14} />
          <span>عریض</span>
        </button>
      </div>

      {/* Mobile Device Simulation */}
      <div className="w-full sm:max-w-[430px] min-h-screen sm:min-h-[880px] sm:max-h-[920px] bg-white dark:bg-[#0B0F17] sm:rounded-[44px] sm:border-[8px] sm:border-[#1E293B] sm:dark:border-[#242F42] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col relative overflow-hidden">
        {/* Dynamic Island / Speaker notch simulation on desktop */}
        <div className="hidden sm:flex justify-center pt-2.5 pb-1 w-full bg-white dark:bg-[#0B0F17] z-40 select-none">
          <div className="w-24 h-4 bg-slate-900 dark:bg-slate-800 rounded-full flex items-center justify-end px-2">
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
          </div>
        </div>

        {/* Inner Scrollable Canvas */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
};
