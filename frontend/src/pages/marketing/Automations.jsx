import { useState } from 'react';
import { automations as initialAutos } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { Zap, ArrowRight, Play, Pause, Clock, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function Automations() {
  const { addToast } = useApp();
  const [autos, setAutos] = useState(initialAutos);

  const toggleStatus = (id) => {
    setAutos(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'Active' ? 'Inactive' : 'Active' } : a));
    const auto = autos.find(a => a.id === id);
    addToast(`"${auto.name}" ${auto.status === 'Active' ? 'deactivated' : 'activated'}`);
  };

  return (
    <div className="space-y-5">
      <div><PageHeader title="Workflow Automations" subtitle="Automate marketing workflows & triggers" /><p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">{autos.filter(a => a.status === 'Active').length} active automations</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {autos.map(auto => (
          <div key={auto.id} className={`bg-white border rounded-xl p-5 transition-all ${auto.status === 'Active' ? 'border-[var(--color-primary)]/30' : 'border-[var(--color-border)]'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${auto.status === 'Active' ? 'bg-emerald-50 text-[var(--color-primary)]' : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'}`}>
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{auto.name}</h3>
                  <p className="text-[10px] text-[var(--color-muted-foreground)]">{auto.id}</p>
                </div>
              </div>
              <button onClick={() => toggleStatus(auto.id)}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${auto.status === 'Active' ? 'bg-[var(--color-primary)]' : 'bg-[#cbd5e1]'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${auto.status === 'Active' ? 'left-5.5 translate-x-0' : 'left-0.5'}`} />
              </button>
            </div>
            
            {/* Trigger → Action flow */}
            <div className="flex items-center gap-2 mt-3 text-xs">
              <div className="flex-1 bg-blue-50 text-blue-700 rounded-md px-2.5 py-1.5 text-center">
                <p className="font-medium">{auto.trigger}</p>
              </div>
              <ArrowRight size={14} className="text-[var(--color-muted-foreground)] shrink-0" />
              <div className="flex-1 bg-emerald-50 text-emerald-700 rounded-md px-2.5 py-1.5 text-center">
                <p className="font-medium">{auto.action}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)]">
              <span className="flex items-center gap-1"><Play size={10} /> {auto.runs} runs</span>
              <span className="flex items-center gap-1"><CheckCircle size={10} /> {auto.successRate}%</span>
              <span className="flex items-center gap-1"><Clock size={10} /> {auto.lastRun.split(' ')[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
