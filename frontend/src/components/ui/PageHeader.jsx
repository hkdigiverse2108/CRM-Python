/**
 * PageHeader — Premium dark-gradient header banner used across all CRM pages.
 *
 * Props:
 *   title        — Required. Main heading text.
 *   subtitle     — Optional. Secondary description text.
 *   children     — Optional. Right-side actions (search, filters, buttons).
 */
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md shadow-sm transition-all duration-200">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2.5 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}
