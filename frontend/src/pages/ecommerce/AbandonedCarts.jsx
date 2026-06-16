import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/ui/PageHeader';
import { 
  ShoppingCart, AlertTriangle, Search, Mail, 
  MessageSquare, Trash2, TrendingUp, Percent,
  Phone, User, Clock, CheckCircle, RefreshCw, Send, XCircle
} from 'lucide-react';

const initialCarts = [];

export default function AbandonedCarts() {
  const { addToast } = useApp();
  const [carts, setCarts] = useState(initialCarts);
  const [selectedCartId, setSelectedCartId] = useState(initialCarts[0]?.id || null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [autoWhatsApp, setAutoWhatsApp] = useState(true);
  const [autoEmail, setAutoEmail] = useState(false);

  const selectedCart = carts.find(c => c.id === selectedCartId) || carts.find(c => c.id === initialCarts[0]?.id) || null;

  // Recovery helper
  const handleRecover = (cartId, channel) => {
    addToast(`${channel} recovery reminder sent!`, 'success');
    setCarts(prev => prev.map(c => {
      if (c.id === cartId) {
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          ...c,
          status: 'In Progress',
          recoveryStep: `${channel} Sent`,
          timeline: [...c.timeline, `${channel} Recovery Sent (${nowStr} ago)`]
        };
      }
      return c;
    }));
  };

  // Mark recovered helper
  const handleMarkAsRecovered = (cartId) => {
    addToast('Cart marked as recovered!', 'success');
    setCarts(prev => prev.map(c => {
      if (c.id === cartId) {
        return {
          ...c,
          status: 'Recovered',
          recoveryStep: 'Purchased',
          timeline: [...c.timeline, 'Purchased via Recovery Link (Just now)']
        };
      }
      return c;
    }));
  };

  // Delete cart entry helper
  const handleDeleteCart = (cartId) => {
    addToast('Abandoned cart entry deleted.', 'info');
    const remaining = carts.filter(c => c.id !== cartId);
    setCarts(remaining);
    if (selectedCartId === cartId) {
      setSelectedCartId(remaining[0]?.id || null);
    }
  };

  // Filter carts
  const filteredCarts = carts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.email.toLowerCase().includes(search.toLowerCase()) ||
                          c.phone.includes(search) ||
                          c.itemsText.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && c.status === statusFilter;
  });

  // Calculate statistics
  const totalCartsCount = carts.length;
  const recoveredCartsCount = carts.filter(c => c.status === 'Recovered').length;
  const recoveryRate = totalCartsCount > 0 ? Math.round((recoveredCartsCount / totalCartsCount) * 100) : 0;
  
  // Parse numeric values (assuming ₹ prefix)
  const parseVal = (str) => {
    const clean = str.replace(/[^\d]/g, '');
    return parseInt(clean, 10) || 0;
  };

  const totalAbandonedVal = carts
    .filter(c => c.status !== 'Recovered')
    .reduce((sum, c) => sum + parseVal(c.price), 0);

  const totalRecoveredVal = carts
    .filter(c => c.status === 'Recovered')
    .reduce((sum, c) => sum + parseVal(c.price), 0);

  const formatCurrency = (val) => {
    return '₹' + val.toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto animate-fade-in">
      {/* PageHeader Banner */}
      <PageHeader 
        title="Abandoned Carts Recovery" 
        subtitle="Track unfinished checkouts, audit recovery flows, and trigger direct reminders."
      >
        {/* Quick Settings Toggles */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 border border-slate-700/50 p-3 rounded-2xl text-xs font-semibold text-white">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mr-1">Automations:</span>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={autoWhatsApp}
              onChange={() => {
                setAutoWhatsApp(!autoWhatsApp);
                addToast(`Auto-WhatsApp Recovery flows ${!autoWhatsApp ? 'ENABLED' : 'DISABLED'}`, 'info');
              }}
              className="accent-indigo-500 rounded cursor-pointer"
            />
            <span>Auto WhatsApp</span>
          </label>
          <div className="w-px h-4 bg-slate-700" />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={autoEmail}
              onChange={() => {
                setAutoEmail(!autoEmail);
                addToast(`Auto-Email Recovery flows ${!autoEmail ? 'ENABLED' : 'DISABLED'}`, 'info');
              }}
              className="accent-indigo-500 rounded cursor-pointer"
            />
            <span>Auto Email</span>
          </label>
        </div>
      </PageHeader>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Abandoned Value</p>
              <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-1">{formatCurrency(totalAbandonedVal)}</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 rounded-xl">
              <ShoppingCart size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
            <span className="font-bold text-rose-500">+{totalCartsCount - recoveredCartsCount} pending</span> carts drop-off
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Recovered Value</p>
              <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-1">{formatCurrency(totalRecoveredVal)}</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
            <span className="font-bold text-emerald-500">{recoveredCartsCount} orders</span> checkout recovered
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Recovery Rate</p>
              <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-1">{recoveryRate}%</h3>
            </div>
            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-650 dark:text-teal-400 rounded-xl">
              <Percent size={20} />
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-teal-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${recoveryRate}%` }} />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Abandoned Carts</p>
              <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-1">{totalCartsCount}</h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-550 dark:text-amber-400 rounded-xl">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-555 mt-3 flex items-center gap-1.5">
            <span className="font-bold text-indigo-500">64% drop-off</span> checkout funnel leak
          </p>
        </div>
      </div>

      {/* Filters & Workspace Grid */}
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by customer name, email, item..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['All', 'Pending', 'In Progress', 'Recovered', 'Failed'].map(f => (
              <button 
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === f 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                {f} Carts
              </button>
            ))}
          </div>
        </div>

        {/* Carts Workspace List & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Carts List (7 columns) */}
          <div className="lg:col-span-7 space-y-3">
            {filteredCarts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center rounded-2xl">
                <ShoppingCart className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={40} />
                <h4 className="text-sm font-bold text-slate-705 dark:text-slate-350">No abandoned carts found</h4>
                <p className="text-xs text-slate-500 mt-1">Try resetting your search query or status filter.</p>
              </div>
            ) : (
              filteredCarts.map(cart => {
                const isSelected = selectedCartId === cart.id;
                
                // Status styles
                const statusStyles = {
                  'Pending': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                  'In Progress': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
                  'Recovered': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
                  'Failed': 'bg-rose-100 text-rose-805 dark:bg-rose-900/30 dark:text-rose-300'
                };

                return (
                  <div 
                    key={cart.id}
                    onClick={() => setSelectedCartId(cart.id)}
                    className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-sm transition-all hover:shadow-md cursor-pointer ${
                      isSelected 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/10' 
                        : 'border-slate-200 dark:border-slate-808/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Customer Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center shadow-inner">
                          {cart.initial}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-950 dark:text-white">{cart.name}</h4>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${statusStyles[cart.status]}`}>
                              {cart.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{cart.email}</p>
                        </div>
                      </div>

                      {/* Value and Time */}
                      <div className="text-right">
                        <h4 className="text-xs font-black text-slate-950 dark:text-white">{cart.price}</h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                          <Clock size={10} /> {cart.time}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-808/60 my-3" />

                    {/* Cart Items Details */}
                    <div className="flex items-center justify-between text-[11px] text-slate-555 dark:text-slate-400">
                      <p className="truncate max-w-[280px]">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{cart.itemsCount} Items:</span> {cart.itemsText}
                      </p>
                      <span className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Seq: {cart.recoveryStep}
                      </span>
                    </div>

                    {/* Inline Actions */}
                    {isSelected && (
                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCart(cart.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                          title="Delete Entry"
                        >
                          <Trash2 size={13} />
                        </button>
                        {cart.status !== 'Recovered' && (
                          <>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRecover(cart.id, 'SMS');
                              }}
                              className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              Send SMS
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRecover(cart.id, 'WhatsApp');
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                            >
                              <MessageSquare size={10} /> WhatsApp
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRecovered(cart.id);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                            >
                              <CheckCircle size={10} /> Mark Recovered
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Detail sidebar (5 columns) */}
          <div className="lg:col-span-5">
            {selectedCart ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-6 sticky top-6">
                {/* Profile Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center justify-center shadow-inner">
                      {selectedCart.initial}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white">{selectedCart.name}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">ID: {selectedCart.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteCart(selectedCart.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Customer contact Info */}
                <div className="grid grid-cols-1 gap-2.5 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-655 dark:text-slate-350">
                    <Mail size={12} className="text-slate-450" />
                    <span>{selectedCart.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-655 dark:text-slate-350">
                    <Phone size={12} className="text-slate-450" />
                    <span>{selectedCart.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-655 dark:text-slate-350">
                    <Clock size={12} className="text-slate-450" />
                    <span>{selectedCart.time}</span>
                  </div>
                </div>

                {/* Items & Value Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cart Contents</h4>
                  <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/20 flex items-center justify-between text-xs font-bold">
                      <span>{selectedCart.itemsCount} Items</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{selectedCart.price}</span>
                    </div>
                    <div className="p-4 text-xs text-slate-655 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900">
                      {selectedCart.itemsText}
                    </div>
                  </div>
                </div>

                {/* Timeline Feed */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Checkout Timeline</h4>
                  <div className="relative border-l border-slate-200 dark:border-slate-800 pl-5 ml-2.5 space-y-4 text-xs">
                    {selectedCart.timeline.map((event, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[24.5px] top-1 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900" />
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{event}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recovery Actions Block */}
                {selectedCart.status !== 'Recovered' && (
                  <div className="border-t border-slate-100 dark:border-slate-808/80 pt-4 grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleRecover(selectedCart.id, 'WhatsApp')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-sm"
                    >
                      <MessageSquare size={13} /> Send WhatsApp
                    </button>
                    <button 
                      onClick={() => handleRecover(selectedCart.id, 'Email')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-655 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-sm"
                    >
                      <Mail size={13} /> Send Email
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                Select an abandoned cart to view recovery timeline & trigger reminders.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
