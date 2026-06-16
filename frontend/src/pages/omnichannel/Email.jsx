import { useState } from 'react';
import { emails } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { Star, Search, PenSquare, X, Send, Paperclip } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function Email() {
  const { addToast } = useApp();
  const [allEmails, setAllEmails] = useState(emails);
  const [selected, setSelected] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [compose, setCompose] = useState({ to: '', subject: '', body: '' });

  const filtered = allEmails.filter(e =>
    e.from.toLowerCase().includes(search.toLowerCase()) ||
    e.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = () => {
    if (!compose.to || !compose.subject) return;
    addToast(`Email sent to ${compose.to}`);
    setComposeOpen(false);
    setCompose({ to: '', subject: '', body: '' });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader title="Email Inbox" subtitle="Manage email communications & campaigns" />
        <button onClick={() => setComposeOpen(true)} className="btn-primary"><PenSquare size={15} /> Compose</button>
      </div>

      <div className="flex gap-4 h-[calc(100vh-57px-8rem)]">
        {/* Email list */}
        <div className="w-[420px] bg-white border border-[var(--color-border)] rounded-xl flex flex-col shrink-0">
          <div className="p-3 border-b border-[var(--color-border)]">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              <input type="text" placeholder="Search emails..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-8 text-sm py-1.5" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(email => (
              <button key={email.id} onClick={() => { setSelected(email); setAllEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e)); }}
                className={`w-full text-left px-4 py-3 border-b border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors ${selected?.id === email.id ? 'bg-[var(--color-muted)]' : ''} ${!email.read ? 'bg-blue-50/30' : ''}`}>
                <div className="flex items-start justify-between">
                  <span className={`text-sm ${!email.read ? 'font-semibold' : 'font-medium'} truncate`}>{email.from}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {email.starred && <Star size={12} className="text-amber-400 fill-amber-400" />}
                    <span className="text-[10px] text-[var(--color-muted-foreground)]">{email.date.split(' ')[0].split('-').reverse().slice(0, 2).join('/')}</span>
                  </div>
                </div>
                <p className="text-sm font-medium truncate mt-0.5">{email.subject}</p>
                <p className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">{email.preview}</p>
                <div className="flex gap-1 mt-1.5">
                  {email.labels.map(l => <span key={l} className="badge badge-neutral text-[9px]">{l}</span>)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Email detail */}
        <div className="flex-1 bg-white border border-[var(--color-border)] rounded-xl overflow-y-auto">
          {selected ? (
            <div className="p-6">
              <h2 className="text-lg font-semibold">{selected.subject}</h2>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                  {selected.from.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium">{selected.from}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{selected.fromEmail} • {selected.date}</p>
                </div>
              </div>
              <div className="mt-6 text-sm leading-relaxed text-[var(--color-foreground)]">
                <p>{selected.preview}</p>
                <p className="mt-3">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
                <p className="mt-3">Best regards,<br />{selected.from}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
                <button onClick={() => { setCompose({ to: selected.fromEmail, subject: `Re: ${selected.subject}`, body: '' }); setComposeOpen(true); }} className="btn-outline text-sm">Reply</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-[var(--color-muted-foreground)]">Select an email to read</div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {composeOpen && (
        <div className="modal-overlay" onClick={() => setComposeOpen(false)}>
          <div className="modal-content w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-semibold">New Message</h3>
              <button onClick={() => setComposeOpen(false)} className="btn-ghost p-1"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input type="email" value={compose.to} onChange={e => setCompose({...compose, to: e.target.value})} placeholder="To" className="input-field" />
              <input type="text" value={compose.subject} onChange={e => setCompose({...compose, subject: e.target.value})} placeholder="Subject" className="input-field" />
              <textarea value={compose.body} onChange={e => setCompose({...compose, body: e.target.value})} placeholder="Write your email..." className="input-field min-h-[200px] resize-none" />
              <div className="flex items-center justify-between">
                <button className="btn-ghost p-2"><Paperclip size={16} /></button>
                <button onClick={handleSend} className="btn-primary"><Send size={14} /> Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
