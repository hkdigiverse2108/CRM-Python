import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Search, Phone, Mail, Building2, Plus, X, Edit, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function Contacts() {
  const { contacts, addContact, updateContact, deleteContact, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [editContactData, setEditContactData] = useState(null);
  const [newContact, setNewContact] = useState({
    name: '',
    company: '',
    role: '', // Designation
    department: '',
    phone: '', // Mobile Number
    altPhone: '', // Alternate Number
    email: '', // Email Address
    whatsapp: '', // WhatsApp Number
    website: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    birthday: '',
    anniversary: '',
    notes: '',
    tags: ''
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  const isEcom = location.pathname.includes('/ecommerce');
  const title = isEcom ? 'Customers' : 'Contacts';

  const filtered = contacts.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateContact = (e) => {
    e.preventDefault();
    if (!newContact.name) {
      addToast('Contact Name is required', 'warning');
      return;
    }
    
    // Split tags by comma
    const tagList = newContact.tags
      ? newContact.tags.split(',').map(t => t.trim()).filter(Boolean)
      : ['Lead'];

    addContact({
      ...newContact,
      avatar: newContact.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase(),
      tags: tagList
    });

    setShowAddContact(false);
    setNewContact({
      name: '',
      company: '',
      role: '',
      department: '',
      phone: '',
      altPhone: '',
      email: '',
      whatsapp: '',
      website: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
      birthday: '',
      anniversary: '',
      notes: '',
      tags: ''
    });
  };

  const handleStartEdit = (contact, e) => {
    e.stopPropagation();
    setEditContactData({
      ...contact,
      tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : (contact.tags || '')
    });
    setShowEditContact(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editContactData.name) {
      addToast('Contact Name is required', 'warning');
      return;
    }
    const tagList = typeof editContactData.tags === 'string'
      ? editContactData.tags.split(',').map(t => t.trim()).filter(Boolean)
      : (Array.isArray(editContactData.tags) ? editContactData.tags : []);

    updateContact(editContactData.id, {
      ...editContactData,
      avatar: editContactData.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase(),
      tags: tagList
    });
    setShowEditContact(false);
    setEditContactData(null);
  };

  const handleDeleteClick = (contactId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteContact(contactId);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title={title} subtitle={isEcom ? `${filtered.length} customers in your store` : `${filtered.length} contacts in your CRM`}>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#818cf8' }} />
          <input type="text" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="text-xs rounded-lg pl-8 pr-3 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-primary" style={{ background: 'rgba(49,46,129,0.4)', border: '1px solid rgba(99,102,241,0.3)', color: '#ffffff' }} />
        </div>
        <button onClick={() => setView('grid')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view === 'grid' ? 'bg-primary' : ''}`} style={{ color: '#ffffff', background: view === 'grid' ? undefined : 'rgba(49,46,129,0.4)', border: '1px solid rgba(99,102,241,0.3)' }}>Grid</button>
        <button onClick={() => setView('table')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view === 'table' ? 'bg-primary' : ''}`} style={{ color: '#ffffff', background: view === 'table' ? undefined : 'rgba(49,46,129,0.4)', border: '1px solid rgba(99,102,241,0.3)' }}>Table</button>
        <button onClick={() => setShowAddContact(true)} className="btn-primary py-1.5 px-3.5 text-xs rounded-xl" style={{ color: '#ffffff' }}>
          <Plus size={14} />
          <span>Create Contact</span>
        </button>
      </PageHeader>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(contact => (
            <div 
              key={contact.id} 
              onClick={() => navigate('/crm/customer-360')}
              className="bg-white dark:bg-slate-900 border border-[var(--color-border)] rounded-xl p-4 hover:shadow-sm transition-all cursor-pointer hover:border-indigo-500/50"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-emerald-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {contact.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-slate-800 dark:text-white">{contact.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] truncate">{contact.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={(e) => handleStartEdit(contact, e)} className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Edit Contact"><Edit size={13} /></button>
                  <button onClick={(e) => handleDeleteClick(contact.id, e)} className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Delete Contact"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-[var(--color-muted-foreground)]">
                <div className="flex items-center gap-2"><Building2 size={12} /><span className="truncate">{contact.company}</span></div>
                <div className="flex items-center gap-2"><Mail size={12} /><span className="truncate">{contact.email}</span></div>
                <div className="flex items-center gap-2"><Phone size={12} /><span>{contact.phone}</span></div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {(contact.tags || []).map(tag => (
                  <span key={tag} className="badge badge-neutral text-[10px]">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-[var(--color-border)] rounded-xl overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Company</th><th>Role</th><th>Email</th><th>Phone</th><th>Tags</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr 
                  key={c.id} 
                  onClick={() => navigate('/crm/customer-360')}
                  className="cursor-pointer hover:bg-indigo-50/10"
                >
                  <td className="font-semibold text-xs text-slate-800 dark:text-white">{c.name}</td>
                  <td className="text-xs text-slate-600 dark:text-slate-305 font-medium">{c.company}</td>
                  <td className="text-xs text-[var(--color-muted-foreground)]">{c.role}</td>
                  <td className="text-xs text-[var(--color-muted-foreground)]">{c.email}</td>
                  <td className="text-xs text-slate-600 dark:text-slate-305 font-semibold">{c.phone}</td>
                  <td><div className="flex gap-1">{(c.tags || []).slice(0, 2).map(t => <span key={t} className="badge badge-neutral text-[10px]">{t}</span>)}</div></td>
                  <td className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button onClick={(e) => handleStartEdit(c, e)} className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Edit Contact"><Edit size={13} /></button>
                      <button onClick={(e) => handleDeleteClick(c.id, e)} className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer" title="Delete Contact"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Contact Drawer / Sheet */}
      {showAddContact && (
        <>
          <div className="sheet-overlay" onClick={() => setShowAddContact(false)} />
          <div className="sheet-content w-full max-w-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Add New CRM Contact</h2>
              <button onClick={() => setShowAddContact(false)} className="btn-ghost p-1"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreateContact} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold mb-1 block">Contact Name *</label><input type="text" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} className="input-field" placeholder="Full Name" required /></div>
              <div><label className="text-xs font-semibold mb-1 block">Company Name</label><input type="text" value={newContact.company} onChange={e => setNewContact({...newContact, company: e.target.value})} className="input-field" placeholder="Company Name" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Designation (Role)</label><input type="text" value={newContact.role} onChange={e => setNewContact({...newContact, role: e.target.value})} className="input-field" placeholder="e.g. Sales Manager" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Department</label><input type="text" value={newContact.department} onChange={e => setNewContact({...newContact, department: e.target.value})} className="input-field" placeholder="e.g. Marketing" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Mobile Number</label><input type="text" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} className="input-field" placeholder="Phone Number" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Alternate Number</label><input type="text" value={newContact.altPhone} onChange={e => setNewContact({...newContact, altPhone: e.target.value})} className="input-field" placeholder="Alternate Number" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Email Address</label><input type="email" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} className="input-field" placeholder="Email Address" /></div>
              <div><label className="text-xs font-semibold mb-1 block">WhatsApp Number</label><input type="text" value={newContact.whatsapp} onChange={e => setNewContact({...newContact, whatsapp: e.target.value})} className="input-field" placeholder="WhatsApp Number" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Website</label><input type="text" value={newContact.website} onChange={e => setNewContact({...newContact, website: e.target.value})} className="input-field" placeholder="Website" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Postal Code</label><input type="text" value={newContact.postalCode} onChange={e => setNewContact({...newContact, postalCode: e.target.value})} className="input-field" placeholder="Postal Code" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Address Line 1</label><input type="text" value={newContact.address1} onChange={e => setNewContact({...newContact, address1: e.target.value})} className="input-field" placeholder="Address Line 1" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Address Line 2</label><input type="text" value={newContact.address2} onChange={e => setNewContact({...newContact, address2: e.target.value})} className="input-field" placeholder="Address Line 2" /></div>
              <div><label className="text-xs font-semibold mb-1 block">City</label><input type="text" value={newContact.city} onChange={e => setNewContact({...newContact, city: e.target.value})} className="input-field" placeholder="City" /></div>
              <div><label className="text-xs font-semibold mb-1 block">State</label><input type="text" value={newContact.state} onChange={e => setNewContact({...newContact, state: e.target.value})} className="input-field" placeholder="State" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Country</label><input type="text" value={newContact.country} onChange={e => setNewContact({...newContact, country: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Birthday</label><input type="date" value={newContact.birthday} onChange={e => setNewContact({...newContact, birthday: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Anniversary</label><input type="date" value={newContact.anniversary} onChange={e => setNewContact({...newContact, anniversary: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Tags (comma-separated)</label><input type="text" value={newContact.tags} onChange={e => setNewContact({...newContact, tags: e.target.value})} className="input-field" placeholder="Partner, Client" /></div>
              
              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block">Notes</label>
                <textarea rows="2" value={newContact.notes} onChange={e => setNewContact({...newContact, notes: e.target.value})} className="input-field" placeholder="Important details..."></textarea>
              </div>

              <div className="col-span-2 flex gap-4 mt-4">
                <button type="button" onClick={() => setShowAddContact(false)} className="btn-outline w-full justify-center py-2 text-xs">Cancel</button>
                <button type="submit" className="btn-primary w-full justify-center py-2 text-xs" style={{ color: '#ffffff' }}>Create Contact</button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Edit Contact Drawer / Sheet */}
      {showEditContact && editContactData && (
        <>
          <div className="sheet-overlay" onClick={() => { setShowEditContact(false); setEditContactData(null); }} />
          <div className="sheet-content w-full max-w-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-slate-808 dark:text-white uppercase tracking-wider">Edit CRM Contact Details</h2>
              <button onClick={() => { setShowEditContact(false); setEditContactData(null); }} className="btn-ghost p-1"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
              <div><label className="text-xs font-semibold mb-1 block">Contact Name *</label><input type="text" value={editContactData.name} onChange={e => setEditContactData({...editContactData, name: e.target.value})} className="input-field" placeholder="Full Name" required /></div>
              <div><label className="text-xs font-semibold mb-1 block">Company Name</label><input type="text" value={editContactData.company || ''} onChange={e => setEditContactData({...editContactData, company: e.target.value})} className="input-field" placeholder="Company Name" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Designation (Role)</label><input type="text" value={editContactData.role || ''} onChange={e => setEditContactData({...editContactData, role: e.target.value})} className="input-field" placeholder="e.g. Sales Manager" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Department</label><input type="text" value={editContactData.department || ''} onChange={e => setEditContactData({...editContactData, department: e.target.value})} className="input-field" placeholder="e.g. Marketing" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Mobile Number</label><input type="text" value={editContactData.phone || ''} onChange={e => setEditContactData({...editContactData, phone: e.target.value})} className="input-field" placeholder="Phone Number" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Alternate Number</label><input type="text" value={editContactData.altPhone || ''} onChange={e => setEditContactData({...editContactData, altPhone: e.target.value})} className="input-field" placeholder="Alternate Number" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Email Address</label><input type="email" value={editContactData.email || ''} onChange={e => setEditContactData({...editContactData, email: e.target.value})} className="input-field" placeholder="Email Address" /></div>
              <div><label className="text-xs font-semibold mb-1 block">WhatsApp Number</label><input type="text" value={editContactData.whatsapp || ''} onChange={e => setEditContactData({...editContactData, whatsapp: e.target.value})} className="input-field" placeholder="WhatsApp Number" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Website</label><input type="text" value={editContactData.website || ''} onChange={e => setEditContactData({...editContactData, website: e.target.value})} className="input-field" placeholder="Website" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Postal Code</label><input type="text" value={editContactData.postalCode || ''} onChange={e => setEditContactData({...editContactData, postalCode: e.target.value})} className="input-field" placeholder="Postal Code" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Address Line 1</label><input type="text" value={editContactData.address1 || ''} onChange={e => setEditContactData({...editContactData, address1: e.target.value})} className="input-field" placeholder="Address Line 1" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Address Line 2</label><input type="text" value={editContactData.address2 || ''} onChange={e => setEditContactData({...editContactData, address2: e.target.value})} className="input-field" placeholder="Address Line 2" /></div>
              <div><label className="text-xs font-semibold mb-1 block">City</label><input type="text" value={editContactData.city || ''} onChange={e => setEditContactData({...editContactData, city: e.target.value})} className="input-field" placeholder="City" /></div>
              <div><label className="text-xs font-semibold mb-1 block">State</label><input type="text" value={editContactData.state || ''} onChange={e => setEditContactData({...editContactData, state: e.target.value})} className="input-field" placeholder="State" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Country</label><input type="text" value={editContactData.country || ''} onChange={e => setEditContactData({...editContactData, country: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Birthday</label><input type="date" value={editContactData.birthday || ''} onChange={e => setEditContactData({...editContactData, birthday: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Anniversary</label><input type="date" value={editContactData.anniversary || ''} onChange={e => setEditContactData({...editContactData, anniversary: e.target.value})} className="input-field" /></div>
              <div><label className="text-xs font-semibold mb-1 block">Tags (comma-separated)</label><input type="text" value={editContactData.tags || ''} onChange={e => setEditContactData({...editContactData, tags: e.target.value})} className="input-field" placeholder="Partner, Client" /></div>
              
              <div className="col-span-2">
                <label className="text-xs font-semibold mb-1 block">Notes</label>
                <textarea rows="2" value={editContactData.notes || ''} onChange={e => setEditContactData({...editContactData, notes: e.target.value})} className="input-field" placeholder="Important details..."></textarea>
              </div>

              <div className="col-span-2 flex gap-4 mt-4">
                <button type="button" onClick={() => { setShowEditContact(false); setEditContactData(null); }} className="btn-outline w-full justify-center py-2 text-xs">Cancel</button>
                <button type="submit" className="btn-primary w-full justify-center py-2 text-xs" style={{ color: '#ffffff' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
