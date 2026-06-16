import PageHeader from '@/components/ui/PageHeader';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationAnalytics } from '@/data/ecommerceData';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { 
  Search, ShoppingBag, ShoppingCart, Package, Store, MessageCircle, 
  MapPin, Truck, Calendar, Clock, Clipboard, ArrowRight, Eye, ChevronRight,
  X, Plus, PlusCircle
} from 'lucide-react';

const sourceIcons = {
  'Amazon': { icon: Package, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20' },
  'Flipkart': { icon: ShoppingCart, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20' },
  'Meesho': { icon: ShoppingBag, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20' },
  'Shopify': { icon: Store, color: 'text-green-600 bg-green-50 dark:bg-green-950/20' },
  'WooCommerce': { icon: Store, color: 'text-green-600 bg-green-50 dark:bg-green-950/20' },
  'Myntra': { icon: ShoppingBag, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20' },
  'Ajio': { icon: ShoppingBag, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20' },
  'WhatsApp': { icon: MessageCircle, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
};

// Coordinates of cities on India SVG representation map (width 500, height 500)
const cityMapCoords = {
  'Delhi': { x: 195, y: 155, state: 'Delhi' },
  'Ahmedabad': { x: 120, y: 245, state: 'Gujarat' },
  'Surat': { x: 125, y: 275, state: 'Gujarat' },
  'Rajkot': { x: 90, y: 255, state: 'Gujarat' },
  'Mumbai': { x: 135, y: 325, state: 'Maharashtra' },
  'Bangalore': { x: 200, y: 415, state: 'Karnataka' },
};

export default function Orders() {
  const navigate = useNavigate();
  const { 
    orders, 
    setOrders, 
    inventoryItems, 
    productsExtended, 
    adjustProductPlatformStock, 
    updateOrderStatus, 
    addToast 
  } = useApp();
  
  // State variables
  const [activeTab, setActiveTab] = useState('orders'); // orders, analytics
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [hoveredCity, setHoveredCity] = useState(null);
  
  // Simulation states
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simulateForm, setSimulateForm] = useState({
    productId: '',
    platform: 'Amazon',
    customer: '',
    qty: 1,
    city: 'Delhi',
    unitPrice: 0,
    discount: 0,
    tax: 0,
    paymentStatus: 'Pending',
    deliveryStatus: 'Processing',
    notes: ''
  });
  
  const sources = ['All', 'Amazon', 'Flipkart', 'Meesho', 'Shopify', 'WhatsApp'];

  const handleSimulateOrder = (e) => {
    e.preventDefault();
    const prodId = simulateForm.productId || (inventoryItems[0]?.id || '');
    const product = inventoryItems.find(i => i.id === prodId);
    if (!product) {
      addToast('No product found to simulate order.', 'error');
      return;
    }
    
    // Check if there is enough stock on the platform
    const ext = productsExtended[product.id];
    const platStock = ext?.platforms[simulateForm.platform]?.stock || 0;
    if (platStock < simulateForm.qty) {
      addToast(`Insufficient stock on ${simulateForm.platform} (Available: ${platStock} units).`, 'error');
      return;
    }

    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Deduct stock via AppContext
    adjustProductPlatformStock(product.id, simulateForm.platform, simulateForm.qty, 'deduct', `Order ${orderId} Received`);

    const unitPrice = parseFloat(simulateForm.unitPrice) || product.price || 99;
    const discount = parseFloat(simulateForm.discount) || 0;
    const tax = parseFloat(simulateForm.tax) || 0;
    const totalVal = (unitPrice * simulateForm.qty) - discount + tax;

    const newOrder = {
      id: orderId,
      source: simulateForm.platform,
      customer: simulateForm.customer || 'Amit Sharma',
      value: totalVal,
      status: simulateForm.deliveryStatus || 'Processing',
      date: new Date().toISOString().split('T')[0],
      items: `${simulateForm.qty}x ${product.name}`,
      tracking: `${simulateForm.platform.toUpperCase().substring(0, 3)}-AWB-${Math.floor(100000 + Math.random() * 900000)}`,
      courier: 'Delhivery',
      shipDate: '',
      expectedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryRemaining: '4 Days',
      currentLocation: 'Delhi Warehouse',
      city: simulateForm.city,
      state: cityMapCoords[simulateForm.city]?.state || 'Delhi',
      country: 'India',
      pinCode: '110021',
      address: `Sector 5, Pocket D, ${simulateForm.city}, ${cityMapCoords[simulateForm.city]?.state || 'Delhi'}`,
      lastUpdate: 'Just now',
      progress: 10,
      nextHub: 'Transit Hub',
      productId: product.id,
      qty: simulateForm.qty,
      unitPrice: unitPrice,
      discount: discount,
      tax: tax,
      paymentStatus: simulateForm.paymentStatus || 'Pending',
      notes: simulateForm.notes || '',
      timeline: [
        { name: 'Order Confirmed', done: true, time: 'Just now' },
        { name: 'Packed', done: false, time: '' },
        { name: 'Shipped', done: false, time: '' },
        { name: 'Reached Hub', done: false, time: '' },
        { name: 'In Transit', done: false, time: '' },
        { name: 'Out for Delivery', done: false, time: '' },
        { name: 'Delivered', done: false, time: '' }
      ],
      events: [
        { time: 'Just now', location: 'System E-Com', description: `Order received via ${simulateForm.platform} integration.` }
      ]
    };

    setOrders(prev => [newOrder, ...prev]);
    addToast(`Successfully simulated new order ${orderId} from ${simulateForm.platform}! Stock decremented.`, 'success');
    setShowSimulateModal(false);
  };

  const filteredOrders = orders.filter(o =>
    (sourceFilter === 'All' || (o.source || '').toLowerCase() === sourceFilter.toLowerCase()) &&
    (o.id.toLowerCase().includes(search.toLowerCase()) || 
     o.customer.toLowerCase().includes(search.toLowerCase()) || 
     o.city.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = locationAnalytics.salesByCity.reduce((acc, c) => acc + c.revenue, 0);
  const totalOrders = locationAnalytics.salesByCity.reduce((acc, c) => acc + c.orders, 0);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      
      <PageHeader title="Orders Management" subtitle="Track and manage all e-commerce orders across platforms">
        <button 
          onClick={() => {
            const firstProd = inventoryItems[0];
            setSimulateForm({
              productId: firstProd?.id || '',
              platform: 'Amazon',
              customer: 'Amit Patel',
              qty: 1,
              city: 'Ahmedabad',
              unitPrice: firstProd?.price || 1200,
              discount: 50,
              tax: 90,
              paymentStatus: 'Paid',
              deliveryStatus: 'Processing',
              notes: 'Fulfill immediately.'
            });
            setShowSimulateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          <Plus size={14} /> Simulate E-com Order
        </button>
      </PageHeader>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80 gap-1 overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'orders', label: 'Order Fulfillment', icon: Package },
          { id: 'analytics', label: 'Buyer Location Analytics', icon: MapPin }
        ].map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive 
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <TabIcon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'orders' && (
        <div className="space-y-5">
          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Search by ID, customer name or city..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
              />
            </div>
            
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {sources.map(s => (
                <button 
                  key={s} 
                  onClick={() => setSourceFilter(s)} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    sourceFilter === s 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-850 dark:hover:text-white border border-slate-200 dark:border-slate-800/80'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800/80">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Source Channel</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Customer Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Destination City</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Order Value</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">AWB Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Fulfillment Tracking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-250/20 dark:divide-slate-800/80 text-xs">
                  {filteredOrders.map(o => {
                    const srcKey = Object.keys(sourceIcons).find(k => k.toLowerCase() === (o.source || '').toLowerCase());
                    const src = srcKey ? sourceIcons[srcKey] : null;
                    const Icon = src?.icon || Package;
                    return (
                      <tr key={o.id} className="hover:bg-slate-50/45 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{o.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center ${src?.color}`}>
                              <Icon size={14} />
                            </div>
                            <span className="font-semibold">{o.source}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{o.customer}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-350">
                            <MapPin size={12} className="text-indigo-500 shrink-0" />
                            <span>{o.city}, {o.state}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">₹{o.value.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`badge ${
                            o.status === 'Delivered' ? 'badge-success' :
                            o.status === 'Shipped' || o.status === 'In Transit' ? 'badge-info' :
                            o.status === 'Cancelled' ? 'badge-danger' :
                            'badge-warning'
                          }`}>{o.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {o.status !== 'Cancelled' ? (
                            <button 
                              onClick={() => navigate(`/ecommerce/orders/track/${o.id}`)} 
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl text-[10px] font-bold cursor-pointer transition-all border border-indigo-100 dark:border-indigo-900/30"
                            >
                              <Eye size={12} /> Track Order Details
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold italic">Cancelled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-400">
                        No orders match your search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar widgets */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* High level analytics */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Buyer Location Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Total E-com Revenue</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white mt-1 block">₹{totalRevenue.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Sales Orders</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white mt-1 block">{totalOrders} Orders</span>
                </div>
              </div>
            </div>

            {/* Top Purchasing Cities Widget */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Top Performing Cities</span>
                <span className="text-[10px] text-indigo-500 font-bold">Revenue</span>
              </h3>
              
              <div className="space-y-3">
                {locationAnalytics.salesByCity.map((c, i) => (
                  <div 
                    key={c.city} 
                    className="flex justify-between items-center text-xs font-bold p-2.5 rounded-xl border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredCity(c.city)}
                    onMouseLeave={() => setHoveredCity(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] text-slate-400">#{i+1}</span>
                      <span className="text-slate-900 dark:text-white">{c.city}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-950 dark:text-white">₹{c.revenue.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{c.orders} Sales</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Regions Widget */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sales Share By State</h3>
              <div className="space-y-3">
                {locationAnalytics.salesByState.map(s => (
                  <div key={s.state} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800 dark:text-slate-200">{s.state}</span>
                      <span className="text-slate-400">{s.percentage}% (₹{s.revenue.toLocaleString()})</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${s.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Location Map Visualizer */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white tracking-tight flex items-center gap-1.5">
                <MapPin size={16} className="text-indigo-500" /> Interactive Sales Hotspots Map
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Hover or tap on regional bubbles to view order statistics in real-time.</p>
            </div>

            <div className="h-[400px] relative border border-slate-100 dark:border-slate-850 bg-slate-50/60 dark:bg-slate-950/20 rounded-xl mt-4 flex items-center justify-center overflow-hidden">
              {/* Graphic stylized SVG representing India Map outlines */}
              <svg className="w-full h-full max-w-[400px] max-h-[380px] p-2" viewBox="0 0 400 450" fill="none">
                {/* Background outline paths */}
                <path d="M120 70 L200 90 L240 100 L280 120 L300 150 L270 200 L240 250 L220 300 L210 380 L200 440 L180 430 L160 380 L130 350 L120 320 L100 290 L75 270 L80 230 L100 190 Z" fill="currentColor" className="text-slate-200 dark:text-slate-800/40" stroke="currentColor" className="text-slate-350 dark:text-slate-800" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M240 250 L280 230 L320 220 L350 250 L310 295 L280 320 Z" fill="currentColor" className="text-slate-250 dark:text-slate-800/20" stroke="currentColor" className="text-slate-350 dark:text-slate-800" strokeWidth="1" strokeDasharray="3 3" />
                
                {/* Visual links between major hubs */}
                <path d="M195 155 L120 245" stroke="currentColor" className="text-indigo-400/30" strokeWidth="1" strokeDasharray="4" />
                <path d="M135 325 L125 275" stroke="currentColor" className="text-indigo-400/30" strokeWidth="1" strokeDasharray="4" />
                <path d="M135 325 L200 415" stroke="currentColor" className="text-indigo-400/30" strokeWidth="1" strokeDasharray="4" />

                {/* Hotspot City Nodes */}
                {Object.keys(cityMapCoords).map(cityName => {
                  const city = cityMapCoords[cityName];
                  const details = locationAnalytics.salesByCity.find(c => c.city === cityName) || { revenue: 0, orders: 0 };
                  const isHovered = hoveredCity === cityName;
                  // Dynamic size based on sales volume
                  const r = details.revenue > 200000 ? 14 : details.revenue > 100000 ? 10 : 7;

                  return (
                    <g 
                      key={cityName} 
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredCity(cityName)}
                      onMouseLeave={() => setHoveredCity(null)}
                    >
                      <circle 
                        cx={city.x} 
                        cy={city.y} 
                        r={r + (isHovered ? 4 : 0)} 
                        className={`transition-all duration-300 ${
                          isHovered ? 'fill-indigo-500 opacity-30 animate-pulse' : 'fill-indigo-600 opacity-20'
                        }`} 
                      />
                      <circle 
                        cx={city.x} 
                        cy={city.y} 
                        r={r/2} 
                        className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900" 
                        strokeWidth="1.5" 
                      />
                      {/* Name Label */}
                      <text 
                        x={city.x + r + 2} 
                        y={city.y + 4} 
                        className="text-[9px] font-bold fill-slate-700 dark:fill-slate-400 pointer-events-none select-none"
                      >
                        {cityName}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Dynamic Popup Tooltip card on hover */}
              {hoveredCity && (() => {
                const details = locationAnalytics.salesByCity.find(c => c.city === hoveredCity) || { revenue: 0, orders: 0 };
                const coords = cityMapCoords[hoveredCity];
                return (
                  <div 
                    className="absolute bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-2xl z-20 pointer-events-none w-44 animate-[slideUp_120ms_ease]"
                    style={{ 
                      left: `${Math.min(coords.x - 30, 220)}px`, 
                      top: `${Math.max(coords.y - 100, 20)}px` 
                    }}
                  >
                    <p className="text-[10px] font-extrabold text-slate-950 dark:text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      {hoveredCity} Hub
                    </p>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{coords.state}, India</p>
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-450">Revenue:</span>
                      <span className="text-indigo-600 dark:text-indigo-400">₹{details.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-450">Orders:</span>
                      <span className="text-slate-700 dark:text-slate-350">{details.orders} fulfilled</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="p-3 bg-slate-50 dark:bg-slate-800/20 text-center rounded-xl mt-4">
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Region Hotspots: West & North Region Strongest</span>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Order Fulfillment Tracking Side Drawer Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg h-full bg-white dark:bg-[#131b2c] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between animate-[slideInRight_200ms_ease]" onClick={e => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-950 dark:text-white">Order Details {selectedOrder.id}</h3>
                  <select 
                    value={selectedOrder.status}
                    onChange={(e) => {
                      updateOrderStatus(selectedOrder.id, e.target.value);
                      setSelectedOrder(prev => ({ ...prev, status: e.target.value }));
                      addToast(`Order status updated to ${e.target.value}`, 'success');
                    }}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none cursor-pointer"
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
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Purchased on {selectedOrder.date} via {selectedOrder.source}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-1.5 rounded-lg text-slate-450 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-xs">
              
              {/* Shipment Route visual animations */}
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl space-y-4">
                <h4 className="font-extrabold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                  <Truck size={14} className="text-indigo-500" /> Route & Fulfillment Tracker
                </h4>
                
                {/* SVG Visual Shipment Route */}
                <div className="h-16 relative flex items-center justify-between px-6 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden">
                  <div className="absolute left-6 right-6 h-1 bg-slate-100 dark:bg-slate-850 top-1/2 -translate-y-1/2">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-500" 
                      style={{ width: `${selectedOrder.progress}%` }}
                    ></div>
                  </div>
                  
                  {/* Origin */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-5.5 h-5.5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[8px] font-black">WH</div>
                    <span className="text-[9px] font-bold mt-1 text-slate-400">Origin</span>
                  </div>

                  {/* Truck Animation Node along Route */}
                  <div 
                    className="absolute z-15 -translate-y-1/2 top-1/2 text-indigo-500 font-bold transition-all duration-500"
                    style={{ left: `calc(${selectedOrder.progress}% - 12px)` }}
                  >
                    <Truck size={20} className="drop-shadow-sm bg-white dark:bg-slate-950 p-0.5 rounded-full border border-indigo-400" />
                  </div>

                  {/* Destination */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${
                      selectedOrder.progress === 100 ? 'bg-green-650' : 'bg-slate-350 dark:bg-slate-800'
                    }`}>
                      <MapPin size={10} />
                    </div>
                    <span className="text-[9px] font-bold mt-1 text-slate-400">{selectedOrder.city}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px] font-bold border-t border-slate-200/50 dark:border-slate-800/80 pt-3">
                  <div>
                    <span className="text-slate-400 block font-semibold">COURIER PARTNER</span>
                    <span className="text-slate-800 dark:text-slate-200">{selectedOrder.courier || 'TBD'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">AWB TRACKING ID</span>
                    <span className="text-slate-850 dark:text-slate-200 font-mono select-all flex items-center gap-1">
                      {selectedOrder.tracking || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">SHIPPED DATE</span>
                    <span className="text-slate-850 dark:text-slate-200">{selectedOrder.shipDate || 'Awaiting Shipment'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">EXPECTED DELIVERY</span>
                    <span className="text-slate-850 dark:text-slate-200">{selectedOrder.expectedDelivery || 'TBD'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">CURRENT LOCATION</span>
                    <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                      <MapPin size={10} /> {selectedOrder.currentLocation || 'Warehouse'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">EST. TIME REMAINING</span>
                    <span className="text-slate-850 dark:text-slate-200">{selectedOrder.deliveryRemaining || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Buyer / Destination location details */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl space-y-4">
                <h4 className="font-extrabold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin size={14} className="text-indigo-500" /> Buyer Shipping Details
                </h4>

                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-semibold">CUSTOMER NAME</span>
                    <span className="text-slate-850 dark:text-slate-200 text-sm">{selectedOrder.customer}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">CITY</span>
                    <span className="text-slate-850 dark:text-slate-200">{selectedOrder.city}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">STATE</span>
                    <span className="text-slate-850 dark:text-slate-200">{selectedOrder.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">COUNTRY</span>
                    <span className="text-slate-850 dark:text-slate-200">{selectedOrder.country}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">PIN CODE</span>
                    <span className="text-slate-850 dark:text-slate-200">{selectedOrder.pinCode}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-semibold">FULL SHIPPING ADDRESS</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed mt-0.5 block">{selectedOrder.address}</span>
                  </div>
                </div>

                {/* Styled static map preview representing geographic buyer location */}
                <div className="h-32 border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden relative bg-slate-50 dark:bg-slate-950 flex items-center justify-center select-none pointer-events-none">
                  {/* Visual mockup of city map coordinates */}
                  <svg className="w-full h-full opacity-60 dark:opacity-40" viewBox="0 0 300 120">
                    <path d="M10 20 L290 20 L290 100 L10 100 Z" fill="none" stroke="currentColor" className="text-indigo-400/20" strokeWidth="1" />
                    {/* Mock streets grid */}
                    <line x1="30" y1="10" x2="30" y2="110" stroke="currentColor" className="text-slate-350 dark:text-slate-800" strokeWidth="0.8" />
                    <line x1="90" y1="10" x2="90" y2="110" stroke="currentColor" className="text-slate-350 dark:text-slate-800" strokeWidth="0.8" />
                    <line x1="180" y1="10" x2="180" y2="110" stroke="currentColor" className="text-slate-350 dark:text-slate-800" strokeWidth="0.8" />
                    <line x1="250" y1="10" x2="250" y2="110" stroke="currentColor" className="text-slate-350 dark:text-slate-800" strokeWidth="0.8" />
                    <line x1="10" y1="40" x2="290" y2="40" stroke="currentColor" className="text-slate-350 dark:text-slate-800" strokeWidth="0.8" />
                    <line x1="10" y1="80" x2="290" y2="80" stroke="currentColor" className="text-slate-350 dark:text-slate-800" strokeWidth="0.8" />
                    {/* Highlighted path/route */}
                    <path d="M30 40 L90 40 L90 80 L180 80" stroke="currentColor" className="text-indigo-500/40" strokeWidth="2.5" fill="none" />
                  </svg>
                  
                  {/* Pulse pin on location */}
                  <div className="absolute flex flex-col items-center">
                    <span className="flex h-3.5 w-3.5 relative">
                      <span className="pulse-active absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                      <MapPin size={16} className="relative inline-flex text-indigo-600 dark:text-indigo-400 drop-shadow-md" />
                    </span>
                    <span className="bg-indigo-600 text-white text-[7px] font-bold px-1 py-0.5 rounded mt-1.5 shadow-md tracking-wide">{selectedOrder.city}</span>
                  </div>
                </div>
              </div>

              {/* Vertical Stepper Timeline */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-850 dark:text-slate-200">Timeline Tracking Progress</h4>
                
                <div className="relative pl-5 border-l border-slate-200 dark:border-slate-850 space-y-5 ml-2">
                  {selectedOrder.timeline.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Node point */}
                      <span className={`absolute -left-[25px] top-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                        step.done 
                          ? 'bg-indigo-600 border-indigo-600 shadow-sm' 
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                      }`}></span>
                      <div>
                        <p className={`font-bold ${step.done ? 'text-slate-850 dark:text-slate-100' : 'text-slate-400'}`}>
                          {step.done ? '✓' : '○'} {step.name}
                        </p>
                        {step.time && <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{step.time}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complete events log history list */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <h4 className="font-extrabold text-slate-850 dark:text-slate-200">Shipment Event History Logs</h4>
                <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-850 border border-slate-100 dark:border-slate-850">
                  {selectedOrder.events.map((evt, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-100/50 dark:hover:bg-slate-900/60 transition-colors flex gap-2">
                      <Clock size={11} className="text-slate-400 shrink-0 mt-0.5" />
                      <div className="flex-1 text-[10px] font-semibold">
                        <div className="flex justify-between items-center text-slate-400 text-[9px] font-bold">
                          <span>{evt.time}</span>
                          <span className="text-slate-500 font-mono">{evt.location}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 font-medium">{evt.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Drawer Footer actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 flex gap-2.5">
              <button 
                onClick={() => addToast(`Fulfillment manifest compiled and sync sent to ${selectedOrder.source}.`, 'success')}
                className="btn-primary flex-1 justify-center rounded-xl py-2 text-xs font-bold hover:opacity-90 cursor-pointer" style={{ color: "#ffffff" }}
              >
                Force Sync Channel Status
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Simulate New Order Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <PlusCircle size={16} className="text-indigo-500" /> Simulate E-Commerce Order
              </h3>
              <button onClick={() => setShowSimulateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSimulateOrder} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Product SKU / Name</label>
                <select 
                  value={simulateForm.productId}
                  onChange={e => {
                    const selectedItem = inventoryItems.find(i => i.id === e.target.value);
                    setSimulateForm(prev => ({ 
                      ...prev, 
                      productId: e.target.value,
                      unitPrice: selectedItem?.price || 0
                    }));
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white font-semibold"
                >
                  {inventoryItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.sku}) - ₹{i.price}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Select Platform</label>
                  <select 
                    value={simulateForm.platform}
                    onChange={e => setSimulateForm(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white font-semibold"
                  >
                    {['Amazon', 'Flipkart', 'Meesho', 'Shopify', 'WooCommerce', 'Myntra', 'Ajio', 'Warehouse'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Quantity</label>
                  <input 
                    type="number" 
                    value={simulateForm.qty}
                    onChange={e => setSimulateForm(prev => ({ ...prev, qty: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Unit Price (₹)</label>
                  <input 
                    type="number" 
                    value={simulateForm.unitPrice}
                    onChange={e => setSimulateForm(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Discount (₹)</label>
                  <input 
                    type="number" 
                    value={simulateForm.discount}
                    onChange={e => setSimulateForm(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Tax (₹)</label>
                  <input 
                    type="number" 
                    value={simulateForm.tax}
                    onChange={e => setSimulateForm(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Payment Status</label>
                  <select 
                    value={simulateForm.paymentStatus}
                    onChange={e => setSimulateForm(prev => ({ ...prev, paymentStatus: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Order Status</label>
                  <select 
                    value={simulateForm.deliveryStatus}
                    onChange={e => setSimulateForm(prev => ({ ...prev, deliveryStatus: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Processing">Processing</option>
                    <option value="Packed">Packed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Customer Name</label>
                <input 
                  type="text" 
                  value={simulateForm.customer}
                  onChange={e => setSimulateForm(prev => ({ ...prev, customer: e.target.value }))}
                  required
                  placeholder="e.g. Amit Patel"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Destination City</label>
                <select 
                  value={simulateForm.city}
                  onChange={e => setSimulateForm(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white font-semibold"
                >
                  {Object.keys(cityMapCoords).map(cityName => (
                    <option key={cityName} value={cityName}>{cityName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Notes</label>
                <textarea 
                  value={simulateForm.notes}
                  onChange={e => setSimulateForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special instructions or remarks..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <button 
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-855 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-1 justify-center rounded-xl py-2 text-xs font-bold hover:opacity-90 cursor-pointer" style={{ color: "#ffffff" }}
                >
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
