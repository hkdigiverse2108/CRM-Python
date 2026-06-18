import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Search, Phone, Mail, Building2, Plus, X, Edit, Trash2, Tag, Zap, MessageSquare, Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function Contacts() {
  const { contacts, addContact, updateContact, deleteContact, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [editContactData, setEditContactData] = useState(null);
  
  const [selectedTagFilter, setSelectedTagFilter] = useState('');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('All Sources');
  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState('All Segments');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Statuses');

  const [newContact, setNewContact] = useState({
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
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleCreateContact = (e) => {
    e.preventDefault();
    if (!newContact.name) {
      addToast('Contact Name is required', 'warning');
      return;
    }
    
    const tagList = newContact.tags
      ? newContact.tags.split(',').map(t => t.trim()).filter(Boolean)
      : ['call_followup'];

    addContact({
      ...newContact,
      avatar: newContact.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase(),
      tags: tagList,
      engagement: Math.floor(Math.random() * 80) + 20,
      source: 'Direct',
      status: 'Active'
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

  // Setup sample elements if contact list is empty, with same details as screenshot
  const displayContacts = contacts.length > 0 ? contacts.map(c => ({
    ...c,
    engagement: c.engagement || 50,
    source: c.source || 'Direct',
    status: c.status || 'Active',
    tags: Array.isArray(c.tags) ? c.tags : ['call_followup']
  })) : [
    { id: 'CFA939', name: 'Contact from Phone Call', avatar: 'CO', phone: '7862017545', email: '-', engagement: 38, source: 'Direct', tags: ['call_followup'], status: 'Active' },
    { id: '4ECFFD', name: 'Harikrushn', avatar: 'HA', phone: '918780564463', email: '-', engagement: 88, source: 'Direct', tags: [], status: 'Active' },
    { id: '8061D9', name: 'Amit Suvagia', avatar: 'AM', phone: '919978838133', email: '-', engagement: 70, source: 'Direct', tags: [], status: 'Active' },
    { id: '57921F', name: 'Rishi Ginoya', avatar: 'RI', phone: '919624954426', email: '-', engagement: 88, source: 'Direct', tags: [], status: 'Active' },
  ];

  const filtered = displayContacts.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (c.phone || '').includes(search) ||
                          (c.email || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesTag = !selectedTagFilter || c.tags.some(t => t.toLowerCase().includes(selectedTagFilter.toLowerCase()));
    const matchesSource = selectedSourceFilter === 'All Sources' || c.source === selectedSourceFilter;
    const matchesStatus = selectedStatusFilter === 'All Statuses' || c.status === selectedStatusFilter;

    return matchesSearch && matchesTag && matchesSource && matchesStatus;
  });

  const getEngagementBadge = (score) => {
    if (score >= 80) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded border border-red-200 bg-red-50/50 text-red-600 font-bold text-[10px] w-fit">
          💧 {score}
        </span>
      );
    } else if (score >= 50) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded border border-orange-200 bg-orange-50/50 text-orange-600 font-bold text-[10px] w-fit">
          💧 {score}
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded border border-sky-200 bg-sky-50/50 text-sky-600 font-bold text-[10px] w-fit">
          💧 {score}
        </span>
      );
    }
  };

  const getAvatarColor = (initials) => {
    const bgColors = {
      'CO': 'bg-purple-100 text-purple-750',
      'HA': 'bg-pink-100 text-pink-750',
      'AM': 'bg-sky-100 text-sky-750',
      'RI': 'bg-emerald-100 text-emerald-750'
    };
    return bgColors[initials] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb and Actions Banner */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Contacts & Audience</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your customer database, labels/tags, and configure tag automation rules.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm">
            <Users size={14} /> Contacts List
          </button>
          <button onClick={() => addToast('Manage tags panel')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all border border-slate-200 dark:border-slate-700">
            <Tag size={14} /> Manage Tags
          </button>
          <button onClick={() => addToast('Auto-Tag rules configuration')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all border border-slate-200 dark:border-slate-700">
            <Zap size={14} /> Auto-Tag Rules
          </button>
        </div>
      </div>

      {/* Main contacts database count & search filters panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Contacts & Audience ({filtered.length})</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your subscribers, view tag analytics, and bulk import customers.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => addToast('Importing contacts list')} className="flex items-center gap-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 transition-colors">
              Import CSV
            </button>
            <button onClick={() => setShowAddContact(true)} className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">
              <Plus size={14} /> Add Contact
            </button>
          </div>
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
          <div className="relative flex items-center border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-xs shadow-inner flex-1 min-w-[200px]">
            <Search size={14} className="text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs w-full placeholder-slate-400 dark:text-white"
            />
          </div>

          <div className="relative flex items-center border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-xs">
            <span className="material-symbols-outlined text-[16px] text-slate-400 mr-1.5">filter_list</span>
            <input
              type="text"
              placeholder="Filter by tag..."
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs w-28 placeholder-slate-400 dark:text-white"
            />
          </div>

          <select 
            value={selectedSourceFilter} 
            onChange={(e) => setSelectedSourceFilter(e.target.value)}
            className="border border-slate-205 dark:border-slate-850 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option>All Sources</option>
            <option>Direct</option>
            <option>Shopify</option>
            <option>Meta Lead Form</option>
          </select>

          <select 
            value={selectedSegmentFilter} 
            onChange={(e) => setSelectedSegmentFilter(e.target.value)}
            className="border border-slate-205 dark:border-slate-855 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option>All Segments</option>
            <option>VIP</option>
            <option>Leads</option>
          </select>

          <select 
            value={selectedStatusFilter} 
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="border border-slate-205 dark:border-slate-855 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option>All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        {/* Contacts Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                </th>
                <th>NAME</th>
                <th>WHATSAPP PHONE</th>
                <th>EMAIL</th>
                <th>ENGAGEMENT</th>
                <th>SOURCE</th>
                <th>TAGS</th>
                <th>STATUS</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const initials = c.avatar || c.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td>
                      <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(initials)}`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-white truncate text-xs">{c.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded">ID: {c.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-slate-700 dark:text-slate-350">{c.phone || '-'}</td>
                    <td className="text-xs text-slate-500">{c.email || '-'}</td>
                    <td>{getEngagementBadge(c.engagement)}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 text-[11px] font-semibold">
                        {c.source}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span>
                            {tag}
                          </span>
                        ))}
                        {c.tags.length === 0 && <span className="text-slate-400 text-[11px]">-</span>}
                      </div>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 text-[10px] font-bold w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end items-center gap-2.5">
                        <button 
                          onClick={() => { navigate('/omnichannel/whatsapp'); addToast(`Chatting with ${c.name}`); }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Open WhatsApp Chat"
                        >
                          <MessageSquare size={15} />
                        </button>
                        <button 
                          onClick={(e) => handleStartEdit(c, e)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Contact"
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteClick(c.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete Contact"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-400 text-xs">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 block mb-2">contacts</span>
                    No contacts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <>
          <div className="sheet-overlay" onClick={() => setShowAddContact(false)} />
          <div className="sheet-content w-full max-w-2xl p-6 overflow-y-auto bg-white dark:bg-slate-900">
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

      {/* Edit Contact Modal */}
      {showEditContact && editContactData && (
        <>
          <div className="sheet-overlay" onClick={() => { setShowEditContact(false); setEditContactData(null); }} />
          <div className="sheet-content w-full max-w-2xl p-6 overflow-y-auto bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Edit CRM Contact Details</h2>
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
