import React, { useState, useEffect } from 'react';
import { Bookmark, Save, Trash2, PlusCircle } from 'lucide-react';

export default function SavedViewsToggle({ 
  currentFilters, 
  onLoadView, 
  onAddToast 
}) {
  const [views, setViews] = useState([]);
  const [newViewName, setNewViewName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [activeViewName, setActiveViewName] = useState('');

  // Load views from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('crm-saved-views');
    if (saved) {
      try {
        setViews(JSON.parse(saved));
      } catch (e) {
        setViews([]);
      }
    }
  }, []);

  const saveCurrentView = () => {
    if (!newViewName.trim()) {
      if (onAddToast) onAddToast('Please enter a name for the view', 'warning');
      return;
    }

    const newView = {
      name: newViewName.trim(),
      filters: { ...currentFilters }
    };

    const updatedViews = [...views.filter(v => v.name !== newView.name), newView];
    setViews(updatedViews);
    localStorage.setItem('crm-saved-views', JSON.stringify(updatedViews));
    setActiveViewName(newView.name);
    setNewViewName('');
    setShowSaveInput(false);
    if (onAddToast) onAddToast(`View "${newView.name}" saved successfully!`, 'success');
  };

  const deleteView = (name, e) => {
    e.stopPropagation();
    const updatedViews = views.filter(v => v.name !== name);
    setViews(updatedViews);
    localStorage.setItem('crm-saved-views', JSON.stringify(updatedViews));
    if (activeViewName === name) {
      setActiveViewName('');
    }
    if (onAddToast) onAddToast(`View "${name}" deleted`, 'info');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-white/40 dark:bg-slate-900/30 backdrop-blur-md rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs">
      <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 mr-1.5">
        <Bookmark size={13} />
        <span>Saved Views:</span>
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        {views.length === 0 && !showSaveInput && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">No saved views. Filter columns and save below!</span>
        )}

        {views.map((v) => {
          const isActive = activeViewName === v.name;
          return (
            <button
              key={v.name}
              onClick={() => {
                setActiveViewName(v.name);
                onLoadView(v.filters);
                if (onAddToast) onAddToast(`Applied View: "${v.name}"`, 'success');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all ${
                isActive
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              <span>{v.name}</span>
              <Trash2 
                size={10} 
                className={`ml-1 hover:text-rose-500 ${isActive ? 'text-indigo-250' : 'text-slate-400'}`}
                onClick={(e) => deleteView(v.name, e)} 
              />
            </button>
          );
        })}

        {showSaveInput ? (
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-indigo-200 dark:border-indigo-900">
            <input 
              type="text" 
              placeholder="View name..."
              value={newViewName}
              onChange={e => setNewViewName(e.target.value)}
              className="px-1.5 py-0.5 text-[10px] outline-none bg-transparent w-24 text-slate-700 dark:text-slate-200 font-semibold"
              onKeyDown={e => {
                if (e.key === 'Enter') saveCurrentView();
              }}
            />
            <button 
              onClick={saveCurrentView}
              className="p-1 text-emerald-600 hover:text-emerald-700 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              title="Save View"
            >
              <Save size={12} />
            </button>
            <button 
              onClick={() => setShowSaveInput(false)}
              className="p-1 text-slate-400 hover:text-slate-500 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowSaveInput(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-indigo-300 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 text-[10px] font-bold transition-all"
          >
            <PlusCircle size={10} />
            <span>Save Current View</span>
          </button>
        )}
      </div>
    </div>
  );
}
