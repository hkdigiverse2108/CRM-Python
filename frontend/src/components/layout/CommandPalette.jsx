import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { navSections } from './Sidebar';
import { Search, X } from 'lucide-react';

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const allItems = navSections.flatMap(s =>
    s.items.map(item => ({ ...item, section: s.title }))
  );

  const filtered = query.trim()
    ? allItems.filter(
        item =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.section.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else onClose(); // parent toggles
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <Search size={18} className="text-[var(--color-muted-foreground)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, actions..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-[#94a3b8]"
          />
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              No results found for "{query}"
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] transition-colors text-left"
                >
                  <Icon size={16} className="text-[var(--color-muted-foreground)] shrink-0" />
                  <span className="font-medium text-[var(--color-foreground)]">{item.label}</span>
                  <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">
                    {item.section}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[var(--color-border)] flex items-center gap-4 text-xs text-[var(--color-muted-foreground)]">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[var(--color-muted)] rounded text-[10px] font-mono">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[var(--color-muted)] rounded text-[10px] font-mono">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
