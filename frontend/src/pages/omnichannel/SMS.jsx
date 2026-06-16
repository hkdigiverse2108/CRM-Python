import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Send, Users, MessageSquare, Clock } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const smsHistory = [];

const templates = [
  { name: 'Order Shipped', body: 'Hi {name}! Your order #{orderId} has been shipped. Track here: {trackingUrl}' },
  { name: 'Invoice Ready', body: 'Dear {name}, your invoice #{invoiceId} for ₹{amount} is ready. View: {invoiceUrl}' },
  { name: 'Flash Sale', body: '🎉 Flash Sale Alert! Get {discount}% off. Shop now: {shopUrl}. Limited time!' },
  { name: 'Appointment Reminder', body: 'Reminder: You have an appointment on {date} at {time}. Reply to confirm.' },
];

export default function SMS() {
  const { addToast } = useApp();
  const [recipients, setRecipients] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleSelectTemplate = (template) => {
    setMessage(template.body);
    setSelectedTemplate(template.name);
  };

  const handleSend = () => {
    if (!recipients || !message) return;
    addToast(`SMS broadcast sent to ${recipients}`);
    setRecipients('');
    setMessage('');
    setSelectedTemplate('');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="SMS Broadcast" subtitle="Send bulk SMS campaigns & notifications" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">Compose SMS</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Recipients</label>
            <input type="text" value={recipients} onChange={e => setRecipients(e.target.value)} placeholder="Enter numbers or select a list..." className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Templates</label>
            <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <button key={t.name} onClick={() => handleSelectTemplate(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedTemplate === t.name ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-muted)] hover:bg-[#e2e8f0]'}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your SMS message..." className="input-field min-h-[120px] resize-none" />
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{message.length}/160 characters</p>
          </div>
          <button onClick={handleSend} className="btn-primary w-full justify-center"><Send size={15} /> Send Broadcast</button>
        </div>

        {/* History */}
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-semibold">Send History</h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {smsHistory.map(sms => (
              <div key={sms.id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{sms.to}</span>
                  <span className={`badge ${sms.status === 'Delivered' ? 'badge-success' : 'badge-info'}`}>{sms.status}</span>
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)]">{sms.message}</p>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1 flex items-center gap-1"><Clock size={10} />{sms.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
