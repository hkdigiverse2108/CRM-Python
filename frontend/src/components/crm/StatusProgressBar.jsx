import React from 'react';

const STAGES = ['New Lead', 'Contacted', 'Follow-up', 'Negotiation', 'Converted'];

export default function StatusProgressBar({ currentStage }) {
  const currentLower = (currentStage || '').toLowerCase().replace('-', ' ');
  
  let percent = 0;
  if (currentLower.includes('new')) percent = 10;
  else if (currentLower.includes('contact')) percent = 35;
  else if (currentLower.includes('follow')) percent = 60;
  else if (currentLower.includes('negotiat')) percent = 85;
  else if (currentLower.includes('convert') || currentLower.includes('won')) percent = 100;
  else percent = 50; // Fallback for other stages like Proposal Sent/Hot Lead

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
        <span>Lead Progress</span>
        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{percent}%</span>
      </div>
      <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-700/30">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-700 ease-out shadow-inner"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-2 px-1">
        {STAGES.map((s) => {
          const isCurrent = currentLower.includes(s.toLowerCase().split(' ')[0]);
          return (
            <span 
              key={s} 
              className={`transition-all duration-300 ${
                isCurrent 
                  ? 'text-indigo-600 dark:text-indigo-400 scale-105 font-extrabold' 
                  : 'opacity-60'
              }`}
            >
              {s}
            </span>
          );
        })}
      </div>
    </div>
  );
}
