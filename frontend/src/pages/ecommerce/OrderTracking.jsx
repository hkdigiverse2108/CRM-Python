import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { 
  ArrowLeft, Truck, Package, MapPin, Calendar, Clock, User, 
  ShieldAlert, RefreshCw, CheckCircle, Info, ChevronRight, Phone,
  AlertTriangle, Check, Search, ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, updateOrderStatus, addToast } = useApp();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Find order in global state
  const order = orders.find(o => o.id === orderId);

  useEffect(() => {
    // Simulate API loading
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (!order) {
        setError('Order not found. Please check the Order ID and try again.');
      } else {
        setError(null);
      }
      setIsLoading(false);
    }, 850);

    return () => clearTimeout(timer);
  }, [orderId, order]);

  const handleForceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      addToast('Tracking data successfully synchronized with courier APIs.', 'success');
    }, 1200);
  };

  // Render Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Fetching live carrier details...</p>
      </div>
    );
  }

  // Render Error / Order Not Found State
  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl animate-[slideUp_200ms_ease]">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto text-red-500">
          <ShieldAlert size={36} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-950 dark:text-white">Order Tracking Unavailable</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {error || 'We could not locate any tracking or fulfillment records matching this order identifier.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/ecommerce/orders')}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Orders Hub
        </button>
      </div>
    );
  }

  // Handle Cancelled/Missing Tracking States gracefully
  if (order.status === 'Cancelled' || !order.tracking) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl animate-[slideUp_200ms_ease]">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center mx-auto text-amber-500">
          <AlertTriangle size={36} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-950 dark:text-white">Tracking Not Active</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {order.status === 'Cancelled' 
              ? 'This order has been Cancelled. Shipping and live route tracking logs have been archived.'
              : 'Tracking has not been activated yet for this order. It might still be processing or waiting for courier pickup.'}
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl text-left text-[11px] font-bold text-slate-550 space-y-2">
          <div className="flex justify-between"><span>Status:</span><span className="text-red-500">{order.status}</span></div>
          <div className="flex justify-between"><span>Channel:</span><span className="text-slate-800 dark:text-white">{order.source}</span></div>
          <div className="flex justify-between"><span>Customer:</span><span className="text-slate-850 dark:text-slate-300">{order.customer}</span></div>
          <div className="flex justify-between"><span>Date:</span><span>{order.date}</span></div>
        </div>
        <button
          onClick={() => navigate('/ecommerce/orders')}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Orders Hub
        </button>
      </div>
    );
  }

  // Helper to check status mapping
  const timelineSteps = [
    { key: 'confirmed', label: 'Order Confirmed', description: 'Order verified & fulfillment started' },
    { key: 'packed', label: 'Packed', description: 'Package wrapped & labeled' },
    { key: 'shipped', label: 'Shipped', description: 'Handed over to carrier partner' },
    { key: 'hub', label: 'Reached Sorting Hub', description: 'Sorted at sorting terminal' },
    { key: 'transit', label: 'In Transit', description: 'On the way to destination' },
    { key: 'out', label: 'Out for Delivery', description: 'Courier agent carrying packet' },
    { key: 'delivered', label: 'Delivered', description: 'Received & signed' }
  ];

  // Map order state to index of step completed
  const getFulfillmentIndex = (status) => {
    switch (status) {
      case 'Processing': return 1;
      case 'Packed': return 2;
      case 'Shipped': return 3;
      case 'In Transit': return 5;
      case 'Out for Delivery': return 6;
      case 'Delivered': return 7;
      default: return 1;
    }
  };

  const currentIdx = getFulfillmentIndex(order.status);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      
      <div className="space-y-3">
        <button 
          onClick={() => navigate('/ecommerce/orders')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} /> Back to Orders Hub
        </button>
        <PageHeader title={`Tracking Hub: ${order.id}`} subtitle="Real-time shipment tracking & delivery status">
          <select 
            value={order.status}
            onChange={(e) => {
              updateOrderStatus(order.id, e.target.value);
              addToast(`Fulfillment state adjusted to ${e.target.value}`, 'success');
            }}
            className="bg-slate-905 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer text-white shadow-sm"
          >
            <option value="Processing">Processing</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped</option>
            <option value="In Transit">In Transit</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Returned">Returned</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button 
            onClick={handleForceSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Carrier'}
          </button>
        </PageHeader>
      </div>

      {/* Main Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Progress and Timeline (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Shipment Progress Bar Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-wider">Fulfillment Completion Status</h3>
            
            <div className="space-y-4">
              {/* Progress bar line */}
              <div className="h-2 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                  style={{ width: `${order.progress}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Estimated progress:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm font-extrabold">{order.progress}%</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  order.status === 'Delivered' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500'
                }`}>
                  Status: {order.status}
                </span>
              </div>
            </div>
            
            {/* Visual map route mockup */}
            <div className="h-32 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden relative bg-slate-50 dark:bg-slate-950/30 flex items-center justify-center select-none pointer-events-none">
              <svg className="w-full h-full opacity-60 dark:opacity-30" viewBox="0 0 400 120">
                <path d="M10 20 L390 20 L390 100 L10 100 Z" fill="none" stroke="currentColor" className="text-indigo-400/10" strokeWidth="1" />
                <line x1="40" y1="20" x2="40" y2="100" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.8" />
                <line x1="120" y1="20" x2="120" y2="100" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.8" />
                <line x1="200" y1="20" x2="200" y2="100" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.8" />
                <line x1="280" y1="20" x2="280" y2="100" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.8" />
                <line x1="360" y1="20" x2="360" y2="100" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.8" />
                <line x1="20" y1="50" x2="380" y2="50" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.8" />
                <path d="M40 50 L120 50 L120 80 L280 80 L280 50 L360 50" stroke="currentColor" className="text-indigo-450/40" strokeWidth="2.5" fill="none" strokeDasharray="3" />
              </svg>
              
              <div className="absolute flex flex-col items-center">
                <span className="flex h-4 w-4 relative">
                  <span className="pulse-active absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                  <MapPin size={18} className="relative inline-flex text-indigo-600 dark:text-indigo-400 drop-shadow-md" />
                </span>
                <span className="bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded mt-1.5 shadow-md">{order.currentLocation || 'Delhi Hub'}</span>
              </div>
            </div>
          </div>

          {/* Tracking Timeline Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-wider">Carrier Route Log Timeline</h3>
            
            <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6 ml-3 pt-1">
              {timelineSteps.map((step, idx) => {
                const stepNum = idx + 1;
                // Determine step states
                const isCompleted = currentIdx >= stepNum || (order.status === 'Delivered');
                const isCurrent = order.status !== 'Delivered' && (
                  (order.status === 'Processing' && stepNum === 1) ||
                  (order.status === 'Packed' && stepNum === 2) ||
                  (order.status === 'Shipped' && stepNum === 3) ||
                  (order.status === 'In Transit' && (stepNum === 4 || stepNum === 5)) ||
                  (order.status === 'Out for Delivery' && stepNum === 6)
                );
                
                let iconBg = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400';
                if (isCompleted) {
                  iconBg = 'bg-emerald-500 border-emerald-500 text-white';
                } else if (isCurrent) {
                  iconBg = 'bg-amber-500 border-amber-500 text-white animate-pulse';
                }

                // Get dynamic time if completed
                let stepTime = '';
                if (step.key === 'confirmed') stepTime = order.date + ' 10:15 AM';
                if (step.key === 'packed' && currentIdx >= 2) stepTime = order.date + ' 04:30 PM';
                if (step.key === 'shipped' && currentIdx >= 3) stepTime = order.shipDate + ' 09:00 AM';
                if (step.key === 'hub' && currentIdx >= 4) stepTime = order.lastUpdate;
                if (step.key === 'transit' && currentIdx >= 5) stepTime = order.lastUpdate;
                if (step.key === 'out' && currentIdx >= 6) stepTime = 'Just now';
                if (step.key === 'delivered' && order.status === 'Delivered') stepTime = order.lastUpdate;

                return (
                  <div key={step.key} className="relative">
                    {/* Circle Node indicator */}
                    <span className={`absolute -left-[35px] top-0.5 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${iconBg}`}>
                      {isCompleted ? <Check size={10} /> : stepNum}
                    </span>
                    
                    <div className="flex justify-between items-start text-xs font-bold gap-3 flex-wrap">
                      <div className="space-y-0.5">
                        <p className={`text-sm ${
                          isCompleted ? 'text-slate-900 dark:text-white font-extrabold' : isCurrent ? 'text-amber-500 font-extrabold' : 'text-slate-400'
                        }`}>
                          {step.label}
                        </p>
                        <p className="text-[10px] text-slate-450 font-medium leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                      
                      {stepTime ? (
                        <span className="text-[10px] text-slate-400 font-semibold">{stepTime}</span>
                      ) : (
                        <span className="text-[10px] text-slate-300 dark:text-slate-700 italic font-medium">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipment Events detailed log history list */}
          {order.events && order.events.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-slate-450 uppercase tracking-wider">Detailed Transit Event Logs</h4>
              <div className="bg-slate-50 dark:bg-slate-950/20 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-850 border border-slate-200/40 dark:border-slate-850">
                {order.events.map((evt, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-100/30 dark:hover:bg-slate-900/40 transition-colors flex gap-3.5">
                    <Clock size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs font-bold space-y-1">
                      <div className="flex justify-between items-center text-slate-400 text-[10px] font-semibold">
                        <span>{evt.time}</span>
                        <span className="text-slate-500 font-mono">{evt.location}</span>
                      </div>
                      <p className="text-slate-850 dark:text-slate-300 font-medium">{evt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Cards Dashboard widgets (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Delivery Estimate Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm text-xs font-bold">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-500" /> Delivery Estimate
            </h3>
            
            <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-3">
              <div>
                <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">EXPECTED DELIVERY</span>
                <span className="text-slate-905 dark:text-white text-sm font-extrabold">{order.expectedDelivery || 'TBD'}</span>
              </div>
              
              <div>
                <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">EST. TIME REMAINING</span>
                <span className="text-indigo-600 dark:text-indigo-400 text-sm font-extrabold">{order.deliveryRemaining || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-200/30">
                <span className="text-slate-450">Fulfillment:</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{order.status}</span>
              </div>
            </div>
          </div>

          {/* Current Location Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm text-xs font-bold">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-indigo-500" /> Current Location
            </h3>
            
            <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-3">
              <div>
                <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">CURRENT CITY & STATE</span>
                <span className="text-slate-905 dark:text-white text-sm font-extrabold">{order.currentLocation || 'Delhi Hub'}</span>
                <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">{order.city}, {order.state}, {order.country}</span>
              </div>
              
              <div>
                <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">LAST UPDATED TIMESTAMP</span>
                <span className="text-slate-850 dark:text-slate-200 text-xs font-extrabold">{order.lastUpdate || 'Just now'}</span>
              </div>

              {order.nextHub && (
                <div>
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">NEXT LOGISTICS HUB</span>
                  <span className="text-slate-850 dark:text-slate-200 text-xs font-extrabold">{order.nextHub}</span>
                </div>
              )}
            </div>
          </div>

          {/* Courier Information Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm text-xs font-bold">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
              <Truck size={14} className="text-indigo-500" /> Courier Information
            </h3>
            
            <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-3">
              <div>
                <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">COURIER PARTNER</span>
                <span className="text-slate-905 dark:text-white text-sm font-extrabold">{order.courier || 'TBD'}</span>
              </div>
              
              <div>
                <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">AWB TRACKING NUMBER</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs select-all bg-indigo-50 dark:bg-indigo-950/20 px-2 py-1.5 rounded-lg border border-indigo-200/30 flex items-center justify-between mt-1">
                  {order.tracking}
                  <span className="text-[8px] bg-indigo-200/50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded">Copy</span>
                </span>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">SHIPPING DATE</span>
                <span className="text-slate-850 dark:text-slate-200 text-xs font-extrabold">{order.shipDate || 'Awaiting Shipment'}</span>
              </div>
            </div>
          </div>

          {/* Customer Information Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm text-xs font-bold">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} className="text-indigo-500" /> Customer Information
            </h3>
            
            <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-3">
              <div>
                <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">CUSTOMER NAME</span>
                <span className="text-slate-905 dark:text-white text-sm font-extrabold">{order.customer}</span>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">CONTACT NUMBER</span>
                <span className="text-slate-800 dark:text-slate-250 text-xs font-extrabold flex items-center gap-1.5 mt-0.5">
                  <Phone size={12} className="text-slate-400" />
                  +91 98765 {Math.floor(10000 + Math.random() * 90000)}
                </span>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">SHIPPING ADDRESS</span>
                <p className="text-slate-700 dark:text-slate-350 text-xs font-semibold leading-relaxed mt-0.5">{order.address}</p>
                <p className="text-[10px] text-slate-450 mt-1 font-semibold">{order.city}, {order.state}, {order.country} - {order.pinCode || '110001'}</p>
              </div>
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm text-xs font-bold">
            <h3 className="text-xs font-black text-slate-455 uppercase tracking-wider">Order Summary</h3>
            
            <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-450 font-semibold">Order ID:</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{order.id}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-450 font-semibold">Order Number:</span>
                <span className="text-slate-900 dark:text-white font-mono">{order.id.replace('ORD-', '#')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-450 font-semibold">Source Channel:</span>
                <span className="text-indigo-500 font-extrabold">{order.source}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-450 font-semibold">Order Date:</span>
                <span className="text-slate-850 dark:text-slate-300 font-semibold">{order.date}</span>
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-1.5">
                <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">ITEMS IN ORDER</span>
                <p className="text-slate-800 dark:text-slate-250 text-xs font-extrabold truncate">{order.items}</p>
                {order.unitPrice && (
                  <div className="flex justify-between text-[11px] mt-1 text-slate-500">
                    <span>Unit Price:</span>
                    <span>₹{order.unitPrice.toLocaleString()}</span>
                  </div>
                )}
                {order.tax !== undefined && (
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Tax:</span>
                    <span>₹{order.tax.toLocaleString()}</span>
                  </div>
                )}
                {order.discount !== undefined && (
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Discount:</span>
                    <span className="text-green-500">-₹{order.discount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-slate-850">
                <span className="text-slate-450 font-semibold">Payment Status:</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  order.paymentStatus === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                }`}>{order.paymentStatus || 'Pending'}</span>
              </div>

              {order.notes && (
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">ORDER NOTES</span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 italic font-medium">{order.notes}</p>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs">
                <span className="text-slate-900 dark:text-white font-extrabold text-sm">Total Value:</span>
                <span className="text-indigo-655 dark:text-indigo-400 font-black text-sm">{formatCurrency(order.value)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
