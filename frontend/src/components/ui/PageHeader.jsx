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
    <div
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-border/20 shadow-xl"
      style={{ background: 'linear-gradient(to right, #0f172a, #1e1b4b, #0f172a)' }}
    >
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{
            background: 'linear-gradient(to right, #ffffff, #c7d2fe, #e0e7ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: '#a5b4fc' }}>
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}
