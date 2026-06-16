import { useState } from 'react';
import { callLogs } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { Phone, PhoneOff, PhoneIncoming, PhoneOutgoing, PhoneMissed, Delete, Mic, MicOff, Volume2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function CallDialer() {
  const { addToast } = useApp();
  const [dialNumber, setDialNumber] = useState('');
  const [calling, setCalling] = useState(false);

  const dialPad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  const handleCall = () => {
    if (!dialNumber) return;
    setCalling(true);
    addToast(`Calling ${dialNumber}...`);
    setTimeout(() => setCalling(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Call Dialer" subtitle="Cloud telephony & call management system" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dialer */}
        <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 flex flex-col items-center">
          <div className="w-full mb-4">
            <div className="flex items-center justify-between bg-[var(--color-muted)] rounded-lg px-4 py-3">
              <span className="text-xl font-mono tracking-widest text-center flex-1">{dialNumber || 'Enter number'}</span>
              {dialNumber && (
                <button onClick={() => setDialNumber(prev => prev.slice(0, -1))} className="btn-ghost p-1"><Delete size={18} /></button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
            {dialPad.map(key => (
              <button key={key} onClick={() => setDialNumber(prev => prev + key)}
                className="w-full h-12 rounded-full bg-[var(--color-muted)] hover:bg-[#e2e8f0] text-lg font-medium transition-colors flex items-center justify-center">
                {key}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-6">
            {calling ? (
              <button onClick={() => setCalling(false)} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors">
                <PhoneOff size={22} />
              </button>
            ) : (
              <button onClick={handleCall} className="w-14 h-14 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white flex items-center justify-center transition-colors">
                <Phone size={22} />
              </button>
            )}
          </div>
          {calling && (
            <div className="mt-4 text-center">
              <p className="text-sm font-medium animate-pulse">Calling {dialNumber}...</p>
              <div className="flex items-center justify-center gap-4 mt-3">
                <button className="btn-ghost p-2"><Mic size={16} /></button>
                <button className="btn-ghost p-2"><Volume2 size={16} /></button>
              </div>
            </div>
          )}
        </div>

        {/* Call Logs */}
        <div className="lg:col-span-2 bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-semibold">Call Logs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Contact</th><th>Type</th><th>Duration</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {callLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div className="font-medium text-sm">{log.contact}</div>
                      <div className="text-xs text-[var(--color-muted-foreground)]">{log.company}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {log.type === 'Outbound' ? <PhoneOutgoing size={13} className="text-blue-500" /> : <PhoneIncoming size={13} className="text-emerald-500" />}
                        <span className="text-sm">{log.type}</span>
                      </div>
                    </td>
                    <td className="text-sm font-mono">{log.duration}</td>
                    <td>
                      <span className={`badge ${log.status === 'Completed' ? 'badge-success' : log.status === 'Missed' ? 'badge-danger' : 'badge-warning'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="text-sm text-[var(--color-muted-foreground)]">{log.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
