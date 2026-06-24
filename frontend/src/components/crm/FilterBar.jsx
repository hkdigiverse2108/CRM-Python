import React from 'react';
import { Filter, X } from 'lucide-react';

export default function FilterBar({
  stages,
  sources,
  tags,
  workspaceLabels,
  filters,
  onChangeFilter,
  onClearFilters
}) {
  const { stage, source, tag, label, search } = filters;

  const hasActiveFilters = stage !== 'All' || source !== 'All' || tag !== 'All' || label !== 'All' || search.trim() !== '';

  return (
    <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4 bg-white/60 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-md">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 mr-2 uppercase tracking-wider">
          <Filter size={14} />
          <span>Filters:</span>
        </div>
        
        {/* Stage Filter */}
        <div className="flex flex-col">
          <select
            value={stage}
            onChange={e => onChangeFilter('stage', e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            <option value="All">All Stages</option>
            {stages.filter(s => s !== 'All').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Source Filter */}
        <div className="flex flex-col">
          <select
            value={source}
            onChange={e => onChangeFilter('source', e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            <option value="All">All Sources</option>
            {sources.filter(s => s !== 'All').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Tag Filter */}
        <div className="flex flex-col">
          <select
            value={tag}
            onChange={e => onChangeFilter('tag', e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            <option value="All">All Tags</option>
            {tags.filter(t => t !== 'All').map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Product/Label Filter */}
        <div className="flex flex-col">
          <select
            value={label}
            onChange={e => onChangeFilter('label', e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            <option value="All">All Interests</option>
            {workspaceLabels.map(lbl => (
              <option key={lbl} value={lbl}>{lbl}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Filters Button with rose color and scale-up hover animation */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="text-xs bg-rose-500 hover:bg-rose-600 text-white font-extrabold flex items-center gap-1.5 transition-all duration-350 ease-out px-4 py-2 rounded-xl shadow-md shadow-rose-550/20 hover:scale-105 active:scale-95 transform cursor-pointer"
        >
          <X size={13} className="stroke-[2.5px]" />
          <span>Clear Filters</span>
        </button>
      )}
    </div>
  );
}
