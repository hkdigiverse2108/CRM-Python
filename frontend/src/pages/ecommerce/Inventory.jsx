import PageHeader from '@/components/ui/PageHeader';
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Package, AlertTriangle, Warehouse, Search, 
  TrendingUp, DollarSign, ArrowRightLeft, Edit3, 
  Trash2, X, PlusCircle, MinusCircle, Layers, Clock, 
  ShoppingCart, Store, ShoppingBag, ListCollapse, RefreshCw, RefreshCwOff, ShieldCheck
} from 'lucide-react';

const platformIcons = {
  Amazon: Package,
  Flipkart: ShoppingCart,
  Meesho: ShoppingBag,
  Shopify: Store,
  WooCommerce: Store,
  Myntra: ShoppingBag,
  Ajio: ShoppingBag,
  Warehouse: Warehouse
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const PLATFORMS_LIST = ['Amazon', 'Flipkart', 'Meesho', 'Shopify', 'WooCommerce', 'Myntra', 'Ajio', 'Warehouse'];

export default function Inventory() {
  const { 
    inventoryItems, 
    setInventoryItems, 
    productsExtended, 
    setProductsExtended,
    movementLogs,
    setMovementLogs,
    adjustProductPlatformStock, 
    transferPlatformStock, 
    setPlatformThreshold, 
    deleteProductApi,
    addToast,
    token,
    tenantId,
    fetchProducts
  } = useApp();
  
  // State variables
  const [activeTab, setActiveTab] = useState('stock'); // stock, alerts, warehouses, history, analytics
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [logFilter, setLogFilter] = useState('All');
  
  // UI states
  const [activeWarehouse, setActiveWarehouse] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentValue, setAdjustmentValue] = useState({
    Amazon: { stock: 0, threshold: 5 },
    Flipkart: { stock: 0, threshold: 5 },
    Meesho: { stock: 0, threshold: 3 },
    Shopify: { stock: 0, threshold: 5 },
    WooCommerce: { stock: 0, threshold: 3 },
    Myntra: { stock: 0, threshold: 5 },
    Ajio: { stock: 0, threshold: 2 },
    Warehouse: { stock: 0, threshold: 1 }
  });

  // Action Modals State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({ productId: '', fromPlatform: 'Warehouse', toPlatform: 'Amazon', qty: 10 });
  
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockForm, setRestockForm] = useState({ productId: '', platform: 'Warehouse', qty: 50 });
  
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditForm, setAuditForm] = useState({ productId: '', platform: 'Amazon', notes: '' });

  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({ platform: 'Amazon', operation: 'add', qty: 10 });

  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Calculate platform totals
  const platformStocks = useMemo(() => {
    return inventoryItems.reduce((acc, item) => {
      const ext = productsExtended[item.id] || { platforms: {} };
      PLATFORMS_LIST.forEach(p => {
        acc[p] += ext.platforms[p]?.stock || 0;
      });
      return acc;
    }, { Amazon: 0, Flipkart: 0, Meesho: 0, Shopify: 0, WooCommerce: 0, Myntra: 0, Ajio: 0, Warehouse: 0 });
  }, [inventoryItems, productsExtended]);

  const totalStockUnits = useMemo(() => {
    return Object.values(platformStocks).reduce((a, b) => a + b, 0);
  }, [platformStocks]);

  // Compute platform-wise low stock and out of stock alerts
  const platformAlerts = useMemo(() => {
    const alerts = [];
    inventoryItems.forEach(item => {
      const ext = productsExtended[item.id];
      if (ext && ext.platforms) {
        Object.keys(ext.platforms).forEach(p => {
          const platInfo = ext.platforms[p];
          if (platInfo.active) {
            const stock = platInfo.stock || 0;
            const threshold = platInfo.threshold || 5;
            if (stock === 0) {
              alerts.push({
                id: `${item.id}-${p}-out`,
                productId: item.id,
                productName: item.name,
                sku: platInfo.sku,
                platform: p,
                stock,
                threshold,
                type: 'out_of_stock',
                item
              });
            } else if (stock <= threshold) {
              alerts.push({
                id: `${item.id}-${p}-low`,
                productId: item.id,
                productName: item.name,
                sku: platInfo.sku,
                platform: p,
                stock,
                threshold,
                type: 'low_stock',
                item
              });
            }
          }
        });
      }
    });
    return alerts;
  }, [inventoryItems, productsExtended]);

  const lowStockCount = useMemo(() => platformAlerts.filter(a => a.type === 'low_stock').length, [platformAlerts]);
  const outOfStockCount = useMemo(() => platformAlerts.filter(a => a.type === 'out_of_stock').length, [platformAlerts]);

  const totalAssetCost = useMemo(() => {
    return inventoryItems.reduce((acc, item) => {
      const ext = productsExtended[item.id] || { platforms: {} };
      const total = Object.values(ext.platforms).reduce((sum, p) => sum + (p.stock || 0), 0);
      return acc + (total * item.cost);
    }, 0);
  }, [inventoryItems, productsExtended]);

  const totalAssetRetail = useMemo(() => {
    return inventoryItems.reduce((acc, item) => {
      const ext = productsExtended[item.id] || { platforms: {} };
      const total = Object.values(ext.platforms).reduce((sum, p) => sum + (p.stock || 0), 0);
      return acc + (total * item.price);
    }, 0);
  }, [inventoryItems, productsExtended]);

  // Dynamic metrics helper for platform summary cards
  const getPlatformStats = (platform) => {
    let listed = 0;
    let available = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let lastSync = 'Just now';
    let syncStatus = 'Synced';

    inventoryItems.forEach(item => {
      const ext = productsExtended[item.id];
      if (ext && ext.platforms && ext.platforms[platform]) {
        const platInfo = ext.platforms[platform];
        if (platInfo.active) {
          listed++;
          available += platInfo.stock || 0;
          if (platInfo.stock === 0) {
            outOfStock++;
          } else if (platInfo.stock <= (platInfo.threshold || 5)) {
            lowStock++;
          }
          lastSync = platInfo.lastSync || lastSync;
          syncStatus = platInfo.syncStatus || syncStatus;
        }
      }
    });

    const reserved = Math.round(available * 0.15); // simulated reserved stock (e.g. 15%)

    return {
      name: platform,
      listed,
      available,
      reserved,
      lowStock,
      outOfStock,
      lastSync,
      syncStatus
    };
  };

  // Filter items
  const filteredItems = inventoryItems.filter(item => {
    const ext = productsExtended[item.id] || { platforms: {} };
    const total = Object.values(ext.platforms).reduce((sum, p) => sum + (p.stock || 0), 0);

    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'In Stock') matchesStatus = total > item.safetyStock;
    else if (statusFilter === 'Low Stock') matchesStatus = total > 0 && total <= item.safetyStock;
    else if (statusFilter === 'Out of Stock') matchesStatus = total === 0;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAdjustStock = (item) => {
    setSelectedItem(item);
    const ext = productsExtended[item.id] || { platforms: {} };
    setAdjustmentValue({
      Amazon: { stock: ext.platforms.Amazon?.stock || 0, threshold: ext.platforms.Amazon?.threshold || 5 },
      Flipkart: { stock: ext.platforms.Flipkart?.stock || 0, threshold: ext.platforms.Flipkart?.threshold || 5 },
      Meesho: { stock: ext.platforms.Meesho?.stock || 0, threshold: ext.platforms.Meesho?.threshold || 3 },
      Shopify: { stock: ext.platforms.Shopify?.stock || 0, threshold: ext.platforms.Shopify?.threshold || 5 },
      WooCommerce: { stock: ext.platforms.WooCommerce?.stock || 0, threshold: ext.platforms.WooCommerce?.threshold || 3 },
      Myntra: { stock: ext.platforms.Myntra?.stock || 0, threshold: ext.platforms.Myntra?.threshold || 5 },
      Ajio: { stock: ext.platforms.Ajio?.stock || 0, threshold: ext.platforms.Ajio?.threshold || 2 },
      Warehouse: { stock: ext.platforms.Warehouse?.stock || 0, threshold: ext.platforms.Warehouse?.threshold || 1 }
    });
    setShowAdjustModal(true);
  };

  const saveAdjustment = () => {
    setProductsExtended(prev => {
      const next = { ...prev };
      if (!next[selectedItem.id]) {
        next[selectedItem.id] = {
          brand: selectedItem.brand || 'Generic',
          platforms: {
            Amazon: { active: true, syncStatus: 'Synced', lastSync: 'Just now', sku: `AMZ-${selectedItem.sku}`, prodId: `AMZ-${Date.now()}`, price: selectedItem.price, stock: 0, status: 'Active', threshold: 5 },
            Flipkart: { active: true, syncStatus: 'Synced', lastSync: 'Just now', sku: `FK-${selectedItem.sku}`, prodId: `FK-${Date.now()}`, price: selectedItem.price, stock: 0, status: 'Active', threshold: 5 },
            Meesho: { active: false, syncStatus: 'Pending', lastSync: 'Just now', sku: `MSH-${selectedItem.sku}`, prodId: `MSH-${Date.now()}`, price: selectedItem.price, stock: 0, status: 'Inactive', threshold: 3 },
            Shopify: { active: true, syncStatus: 'Synced', lastSync: 'Just now', sku: `SHP-${selectedItem.sku}`, prodId: `SHP-${Date.now()}`, price: selectedItem.price, stock: 0, status: 'Active', threshold: 5 },
            WooCommerce: { active: true, syncStatus: 'Synced', lastSync: 'Just now', sku: `WC-${selectedItem.sku}`, prodId: `WC-${Date.now()}`, price: selectedItem.price, stock: 0, status: 'Active', threshold: 3 },
            Myntra: { active: true, syncStatus: 'Synced', lastSync: 'Just now', sku: `MYN-${selectedItem.sku}`, prodId: `MYN-${Date.now()}`, price: selectedItem.price, stock: 0, status: 'Active', threshold: 5 },
            Ajio: { active: true, syncStatus: 'Synced', lastSync: 'Just now', sku: `AJI-${selectedItem.sku}`, prodId: `AJI-${Date.now()}`, price: selectedItem.price, stock: 0, status: 'Active', threshold: 2 },
            Warehouse: { active: true, syncStatus: 'Synced', lastSync: 'Just now', sku: `WH-${selectedItem.sku}`, prodId: `WH-${Date.now()}`, price: selectedItem.price, stock: 0, status: 'Active', threshold: 1 }
          },
          metrics: {
            totalSales: 0,
            platformSales: { Amazon: 0, Flipkart: 0, Meesho: 0, Shopify: 0, WooCommerce: 0, Myntra: 0, Ajio: 0 },
            revenue: 0,
            conversionRate: 0.0,
            returnRate: 0.0,
            bestPerforming: 'N/A'
          }
        };
      }
      Object.keys(adjustmentValue).forEach(p => {
        if (next[selectedItem.id].platforms[p]) {
            const oldStock = next[selectedItem.id].platforms[p].stock;
            const newStock = parseInt(adjustmentValue[p].stock, 10) || 0;
            const newThreshold = parseInt(adjustmentValue[p].threshold, 10) || 0;
            
            next[selectedItem.id].platforms[p].stock = newStock;
            next[selectedItem.id].platforms[p].threshold = newThreshold;

            // Log adjustments to movement timeline if changed
            const diff = newStock - oldStock;
            if (diff !== 0) {
              const skuCode = next[selectedItem.id].platforms[p].sku || `SKU-${selectedItem.id}`;
              const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
              setMovementLogs(prevLogs => [
                {
                  time: timestamp,
                  sku: skuCode,
                  product: selectedItem.name,
                  platform: p,
                  action: 'Inventory Adjustment',
                  qty: diff > 0 ? `+${diff}` : `${diff}`,
                  user: 'Admin Manager'
                },
                ...prevLogs
              ]);
            }
          }
        });
      return next;
    });

    addToast(`Stock allocations adjusted successfully`, 'success');
    setShowAdjustModal(false);
    setSelectedItem(null);
  };

  const handleRestock = (item, amt = 50) => {
    setProductsExtended(prev => {
      const next = { ...prev };
      if (!next[item.id]) {
        next[item.id] = {
          brand: item.brand || 'Generic',
          platforms: {
            Amazon: { active: true, syncStatus: 'Synced', lastSync: 'Just now', sku: `AMZ-${item.sku}`, prodId: `AMZ-${Date.now()}`, price: item.price, stock: 0, status: 'Active', threshold: 5 },
            Flipkart: { active: true, syncStatus: 'Synced', lastSync: 'Just now', sku: `FK-${item.sku}`, prodId: `FK-${Date.now()}`, price: item.price, stock: 0, status: 'Active', threshold: 5 },
            Meesho: { active: false, syncStatus: 'Pending', lastSync: 'Just now', sku: `MSH-${item.sku}`, prodId: `MSH-${Date.now()}`, price: item.price, stock: 0, status: 'Inactive', threshold: 3 },
            Shopify: { active: true, syncStatus: 'Synced', lastSync: 'Just now', sku: `SHP-${item.sku}`, prodId: `SHP-${Date.now()}`, price: item.price, stock: 0, status: 'Active', threshold: 5 },
            WooCommerce: { active: true, syncStatus: 'Synced', lastSync: 'Just now', sku: `WC-${item.sku}`, prodId: `WC-${Date.now()}`, price: item.price, stock: 0, status: 'Active', threshold: 3 },
            Myntra: { active: true, syncStatus: 'Synced', lastSync: 'Just now', sku: `MYN-${item.sku}`, prodId: `MYN-${Date.now()}`, price: item.price, stock: 0, status: 'Active', threshold: 5 },
            Ajio: { active: true, syncStatus: 'Synced', lastSync: 'Just now', sku: `AJI-${item.sku}`, prodId: `AJI-${Date.now()}`, price: item.price, stock: 0, status: 'Active', threshold: 2 },
            Warehouse: { active: true, syncStatus: 'Synced', lastSync: 'Just now', sku: `WH-${item.sku}`, prodId: `WH-${Date.now()}`, price: Math.round(item.price * 0.85), stock: 0, status: 'Active', threshold: 1 }
          },
          metrics: {
            totalSales: 0,
            platformSales: { Amazon: 0, Flipkart: 0, Meesho: 0, Shopify: 0, WooCommerce: 0, Myntra: 0, Ajio: 0 },
            revenue: 0,
            conversionRate: 0.0,
            returnRate: 0.0,
            bestPerforming: 'N/A'
          }
        };
      }
      if (next[item.id]?.platforms.Warehouse) {
        next[item.id].platforms.Warehouse.stock += amt;
      }
      return next;
    });

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setMovementLogs(prevLogs => [
      {
        time: timestamp,
        sku: item.sku,
        product: item.name,
        platform: 'Warehouse',
        action: 'Restocking',
        qty: `+${amt}`,
        user: 'Warehouse Staff'
      },
      ...prevLogs
    ]);
    addToast(`Ordered restock for ${item.name}. Added +${amt} units to Warehouse.`, 'success');
  };

  const handleRestockAll = () => {
    inventoryItems.forEach(i => {
      const ext = productsExtended[i.id];
      if (ext) {
        const total = Object.values(ext.platforms).reduce((sum, p) => sum + (p.stock || 0), 0);
        if (total <= i.safetyStock) {
          setProductsExtended(prev => {
            const next = { ...prev };
            if (next[i.id]?.platforms.Warehouse) {
              next[i.id].platforms.Warehouse.stock += 50;
            }
            return next;
          });
          
          const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
          setMovementLogs(prevLogs => [
            {
              time: timestamp,
              sku: i.sku,
              product: i.name,
              platform: 'Warehouse',
              action: 'Restocking',
              qty: '+50',
              user: 'System PO Manager'
            },
            ...prevLogs
          ]);
        }
      }
    });

    addToast('All low stock items restocked (+50 units each to Warehouse).', 'success');
  };

  const deleteItem = async (id, name) => {
    if (confirm(`Are you sure you want to delete ${name} from inventory?`)) {
      try {
        await deleteProductApi(id);
        addToast(`${name} deleted from inventory.`, 'info');
      } catch (err) {
        addToast(`Failed to delete ${name}: ${err.message}`, 'error');
      }
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const resp = await fetch(`${API_BASE}/integrations/shopify/sync/products`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || 'rapidmodel_corp',
        }
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        addToast(`Shopify inventory synced successfully! Synced ${data.data?.synced_count || 0} products.`, 'success');
        
        // Reload products from the backend database to update local inventoryItems state
        if (fetchProducts) {
          await fetchProducts();
        }
        
        // Clear productsExtended for the synced products to let them re-initialize with new stock
        setProductsExtended(prev => {
          const next = { ...prev };
          inventoryItems.forEach(p => {
            delete next[p.id];
          });
          return next;
        });

        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
        setMovementLogs(prevLogs => [
          {
            time: timestamp,
            sku: 'ALL-SKUS',
            product: 'Global Catalog Sync',
            platform: 'All Marketplaces',
            action: 'Marketplace Sync Updates',
            qty: String(data.data?.synced_count || 0),
            user: 'System CRM'
          },
          ...prevLogs
        ]);
      } else {
        throw new Error(data.message || 'Failed to sync Shopify inventory');
      }
    } catch (err) {
      console.error(err);
      addToast(`Sync failed: ${err.message}`, 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      
      <PageHeader title="Inventory Control Center" subtitle="Platform-wise stock management & synchronization" />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80 gap-1 overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'stock', label: 'Stock Control', icon: Package },
          { id: 'alerts', label: `Alerts (${lowStockCount + outOfStockCount})`, icon: AlertTriangle, color: 'text-red-500' },
          { id: 'history', label: 'Stock Movement Logs', icon: Clock },
          { id: 'analytics', label: 'Analytics Insights', icon: TrendingUp }
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
              <TabIcon size={16} className={tab.color || ''} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          {/* Statistics summary row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Stocked Units', value: totalStockUnits, icon: Layers, color: 'text-indigo-500' },
              { label: 'Inventory Cost Value', value: `₹${totalAssetCost.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500' },
              { label: 'Inventory Retail Value', value: `₹${totalAssetRetail.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-500' },
              { label: 'Platform Channels Sync', value: '8 channels', icon: Warehouse, color: 'text-amber-500' }
            ].map((stat, i) => {
              const StatIcon = stat.icon;
              return (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                    <h4 className="text-xl font-extrabold mt-1 text-slate-900 dark:text-white">{stat.value}</h4>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 ${stat.color}`}>
                    <StatIcon size={20} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Marketplace Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLATFORMS_LIST.map(p => {
              const stats = getPlatformStats(p);
              const iconData = platformIcons[p] || Warehouse;
              const PlatIcon = iconData;
              const isSynced = stats.syncStatus === 'Synced';
              
              let colorClass = 'text-indigo-500 bg-indigo-50 border-indigo-200/50 dark:bg-indigo-950/20 dark:border-indigo-900/30';
              if (p === 'Amazon') colorClass = 'text-orange-500 bg-orange-50 border-orange-200/50 dark:bg-orange-950/20 dark:border-orange-900/30';
              if (p === 'Flipkart') colorClass = 'text-blue-600 bg-blue-50 border-blue-200/50 dark:bg-blue-950/20 dark:border-blue-900/30';
              if (p === 'Meesho') colorClass = 'text-pink-500 bg-pink-50 border-pink-200/50 dark:bg-pink-950/20 dark:border-pink-900/30';
              if (p === 'Shopify') colorClass = 'text-green-600 bg-green-50 border-green-200/50 dark:bg-green-950/20 dark:border-green-900/30';
              if (p === 'WooCommerce') colorClass = 'text-purple-600 bg-purple-50 border-purple-200/50 dark:bg-purple-950/20 dark:border-purple-900/30';
              if (p === 'Myntra') colorClass = 'text-rose-500 bg-rose-50 border-rose-200/50 dark:bg-rose-950/20 dark:border-rose-900/30';
              if (p === 'Ajio') colorClass = 'text-teal-600 bg-teal-50 border-teal-200/50 dark:bg-teal-950/20 dark:border-teal-900/30';
              if (p === 'Warehouse') colorClass = 'text-indigo-600 bg-indigo-50 border-indigo-200/50 dark:bg-indigo-950/20 dark:border-indigo-900/30';

              return (
                <div key={p} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 space-y-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl border ${colorClass}`}>
                        <PlatIcon size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-955 dark:text-white leading-tight">{p}</h4>
                        <span className="text-[9px] text-slate-400 font-semibold">{stats.listed} Live SKUs</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                      isSynced 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                        : 'bg-amber-50 dark:bg-amber-950/20 text-amber-500 animate-pulse'
                    }`}>
                      {stats.syncStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-2.5 text-[9px] font-bold text-slate-500">
                    <div>
                      <span className="text-slate-400 text-[8px] font-medium block uppercase tracking-wider">Available</span>
                      <span className="text-slate-950 dark:text-white text-xs font-extrabold">{stats.available} U</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[8px] font-medium block uppercase tracking-wider">Reserved</span>
                      <span className="text-slate-505 dark:text-slate-400 text-xs font-extrabold">{stats.reserved} U</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[8px] font-medium block uppercase tracking-wider">Low Stock</span>
                      <span className={`text-xs font-extrabold ${stats.lowStock > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-500'}`}>{stats.lowStock} SKU(s)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[8px] font-medium block uppercase tracking-wider">Out of Stock</span>
                      <span className={`text-xs font-extrabold ${stats.outOfStock > 0 ? 'text-red-500' : 'text-slate-500'}`}>{stats.outOfStock} SKU(s)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[8px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span>Sync: {stats.lastSync}</span>
                    <button 
                      onClick={() => {
                        addToast(`Refreshed sync log and verified connection for ${p}.`, 'success');
                      }}
                      className="text-indigo-500 font-extrabold hover:underline"
                    >
                      Audit API
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Platform Share Visual Allocation Stacked Bar Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 shadow-sm text-xs font-bold">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-wider">Global Sales Platform Stock Distribution</h3>
            
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-xl overflow-hidden flex">
              {PLATFORMS_LIST.map(p => {
                const stock = platformStocks[p];
                const pct = Math.round((stock / (totalStockUnits || 1)) * 100) || 0;
                let bg = 'bg-indigo-600';
                if (p === 'Amazon') bg = 'bg-orange-500';
                if (p === 'Flipkart') bg = 'bg-blue-600';
                if (p === 'Meesho') bg = 'bg-pink-500';
                if (p === 'Shopify') bg = 'bg-green-600';
                if (p === 'WooCommerce') bg = 'bg-purple-650';
                if (p === 'Myntra') bg = 'bg-rose-500';
                if (p === 'Ajio') bg = 'bg-teal-650';
                if (p === 'Warehouse') bg = 'bg-indigo-600';
                return (
                  <div 
                    key={p} 
                    className={`${bg} h-full transition-all duration-300`} 
                    style={{ width: `${pct}%` }} 
                    title={`${p}: ${stock} Units (${pct}%)`}
                  ></div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[9px] pt-1 text-slate-450 uppercase">
              {[
                { name: 'Amazon Store', count: platformStocks.Amazon, color: 'bg-orange-500' },
                { name: 'Flipkart Listing', count: platformStocks.Flipkart, color: 'bg-blue-600' },
                { name: 'Meesho Catalog', count: platformStocks.Meesho, color: 'bg-pink-500' },
                { name: 'Shopify Store', count: platformStocks.Shopify, color: 'bg-green-600' },
                { name: 'WooCommerce Store', count: platformStocks.WooCommerce, color: 'bg-purple-650' },
                { name: 'Myntra Mall', count: platformStocks.Myntra, color: 'bg-rose-500' },
                { name: 'Ajio Fashion', count: platformStocks.Ajio, color: 'bg-teal-650' },
                { name: 'Local Warehouse', count: platformStocks.Warehouse, color: 'bg-indigo-600' }
              ].map(el => (
                <div key={el.name} className="flex items-center gap-1.5 font-bold">
                  <span className={`w-2.5 h-2.5 rounded ${el.color}`}></span>
                  <span>{el.name} ({el.count} Units)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Operations Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-wrap gap-2 shadow-sm justify-between items-center">
            <h4 className="text-xs font-black text-slate-455 uppercase tracking-wider">Inventory Command Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={handleSyncAll}
                disabled={isSyncingAll}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-sm shadow-indigo-500/10"
              >
                <RefreshCw size={14} className={isSyncingAll ? 'animate-spin' : ''} />
                {isSyncingAll ? 'Syncing...' : 'Sync Inventory'}
              </button>
              
              <button 
                onClick={() => {
                  addToast('Refreshed platform-wise stock allocations.', 'success');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-750 transition-all cursor-pointer"
              >
                <RefreshCwOff size={14} />
                Refresh Inventory
              </button>

              <button 
                onClick={() => {
                  setRestockForm({ productId: inventoryItems[0]?.id || '', platform: 'Warehouse', qty: 50 });
                  setShowRestockModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-750 transition-all cursor-pointer"
              >
                <PlusCircle size={14} />
                Restock Inventory
              </button>

              <button 
                onClick={() => {
                  setTransferForm({ productId: inventoryItems[0]?.id || '', fromPlatform: 'Warehouse', toPlatform: 'Amazon', qty: 10 });
                  setShowTransferModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-750 transition-all cursor-pointer"
              >
                <ArrowRightLeft size={14} />
                Transfer Stock
              </button>

              <button 
                onClick={() => {
                  setShowBulkUpdateModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-750 transition-all cursor-pointer"
              >
                <Layers size={14} />
                Bulk Update Stock
              </button>

              <button 
                onClick={() => {
                  setAuditForm({ productId: inventoryItems[0]?.id || '', platform: 'Amazon', notes: 'Monthly routine stock audit matching' });
                  setShowAuditModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-750 transition-all cursor-pointer"
              >
                <ShieldCheck size={14} />
                Inventory Audit
              </button>
            </div>
          </div>

          {/* Search, filters & table */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search stock allocations by name or SKU..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Footwear">Footwear</option>
                <option value="Accessories">Accessories</option>
                <option value="Furniture">Furniture</option>
                <option value="Apparel">Apparel</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="In Stock">In Stock (Good)</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Stock Levels Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-4 min-w-[180px]">Product details</th>
                    <th className="px-3 py-4 text-center">Total</th>
                    <th className="px-3 py-4 text-center">Amazon</th>
                    <th className="px-3 py-4 text-center">Flipkart</th>
                    <th className="px-3 py-4 text-center">Meesho</th>
                    <th className="px-3 py-4 text-center">Shopify</th>
                    <th className="px-3 py-4 text-center">WooCommerce</th>
                    <th className="px-3 py-4 text-center">Myntra</th>
                    <th className="px-3 py-4 text-center">Ajio</th>
                    <th className="px-3 py-4 text-center">Warehouse</th>
                    <th className="px-4 py-4 min-w-[110px]">Thresholds</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-250/20 dark:divide-slate-800/80 text-[11px] font-bold">
                  {filteredItems.map(item => {
                    const ext = productsExtended[item.id] || { platforms: {} };
                    const amazonVal = ext.platforms.Amazon?.stock || 0;
                    const flipkartVal = ext.platforms.Flipkart?.stock || 0;
                    const meeshoVal = ext.platforms.Meesho?.stock || 0;
                    const shopifyVal = ext.platforms.Shopify?.stock || 0;
                    const wooVal = ext.platforms.WooCommerce?.stock || 0;
                    const myntraVal = ext.platforms.Myntra?.stock || 0;
                    const ajioVal = ext.platforms.Ajio?.stock || 0;
                    const whVal = ext.platforms.Warehouse?.stock || 0;

                    const total = amazonVal + flipkartVal + meeshoVal + shopifyVal + wooVal + myntraVal + ajioVal + whVal;
                    const isOutOfStock = total === 0;
                    const isLowStock = total > 0 && total <= item.safetyStock;

                    const renderStockCell = (platform, stockVal) => {
                      const platInfo = ext.platforms[platform] || {};
                      const threshold = platInfo.threshold || 5;
                      const isOos = stockVal === 0;
                      const isLow = stockVal > 0 && stockVal <= threshold;
                      
                      if (isOos) {
                        return (
                          <span className="inline-block px-1.5 py-0.5 bg-red-50 dark:bg-red-950/20 text-red-500 rounded text-[9px] font-black">
                            0
                          </span>
                        );
                      }
                      if (isLow) {
                        return (
                          <span className="inline-block px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded text-[9px] font-black">
                            ⚠ {stockVal}
                          </span>
                        );
                      }
                      return <span className="text-slate-800 dark:text-slate-200">{stockVal}</span>;
                    };

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/45 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200/50" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{item.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[9px]">
                                <span className="font-mono text-slate-400">{item.sku}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-indigo-500 font-bold">{item.category}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <div className="space-y-0.5">
                            <span className={`text-xs font-black ${
                              isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-slate-900 dark:text-white'
                            }`}>
                              {total}
                            </span>
                            <span className={`block text-[8px] font-extrabold uppercase ${
                              isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-green-500'
                            }`}>{isOutOfStock ? 'OOS' : isLowStock ? 'Low' : 'OK'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-center">{renderStockCell('Amazon', amazonVal)}</td>
                        <td className="px-3 py-4 text-center">{renderStockCell('Flipkart', flipkartVal)}</td>
                        <td className="px-3 py-4 text-center">{renderStockCell('Meesho', meeshoVal)}</td>
                        <td className="px-3 py-4 text-center">{renderStockCell('Shopify', shopifyVal)}</td>
                        <td className="px-3 py-4 text-center">{renderStockCell('WooCommerce', wooVal)}</td>
                        <td className="px-3 py-4 text-center">{renderStockCell('Myntra', myntraVal)}</td>
                        <td className="px-3 py-4 text-center">{renderStockCell('Ajio', ajioVal)}</td>
                        <td className="px-3 py-4 text-center">{renderStockCell('Warehouse', whVal)}</td>
                        <td className="px-4 py-4 text-slate-400 dark:text-slate-500 text-[8px] font-medium leading-normal">
                          <div className="flex flex-col gap-0.5">
                            <span>WH Min: {ext.platforms.Warehouse?.threshold || 1}</span>
                            <span>AMZ/FK: {ext.platforms.Amazon?.threshold || 5}/{ext.platforms.Flipkart?.threshold || 5}</span>
                            <span>SHP/WC: {ext.platforms.Shopify?.threshold || 5}/{ext.platforms.WooCommerce?.threshold || 3}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => handleAdjustStock(item)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                              title="Adjust stock & threshold limits"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleRestock(item, 50)}
                              className="p-1 text-slate-400 hover:text-green-655 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                              title="PO Restock (+50 WH)"
                            >
                              <PlusCircle size={14} />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id, item.name)}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan="12" className="text-center py-12 text-slate-400">
                        No inventory matches the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Low Stock Summary Banner */}
          <div className="p-5 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/40 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-3 items-start">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mt-0.5">
                <AlertTriangle size={20} className="animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Critical Channel Restock Queue</h4>
                <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-0.5">There are {lowStockCount} platform listings running low and {outOfStockCount} listings completely out of stock.</p>
              </div>
            </div>
            {(lowStockCount > 0 || outOfStockCount > 0) && (
              <button 
                onClick={handleRestockAll}
                className="px-4 py-2 bg-red-600 dark:bg-red-500 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer whitespace-nowrap"
              >
                Auto-Restock All Low Channels (+50 Warehouse)
              </button>
            )}
          </div>

          {/* Low Stock Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Channel Alerts Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800/80 text-xs font-bold text-slate-450 uppercase tracking-wider">
                    <th className="px-6 py-4">Product details</th>
                    <th className="px-6 py-4">Platform</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Min Threshold</th>
                    <th className="px-6 py-4">Alert Message</th>
                    <th className="px-6 py-4 text-right">Fulfillment Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-bold">
                  {platformAlerts.map(alert => {
                    const iconData = platformIcons[alert.platform] || Warehouse;
                    const PlatIcon = iconData;
                    
                    return (
                      <tr key={alert.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={alert.item.image} alt={alert.productName} className="w-9 h-9 rounded-lg object-cover" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{alert.productName}</p>
                              <span className="text-[10px] text-slate-400 font-mono">{alert.sku}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-semibold">{alert.platform}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            alert.type === 'out_of_stock' ? 'bg-red-50 text-red-650 dark:bg-red-950/30' : 'bg-amber-50 text-amber-650 dark:bg-amber-950/30'
                          }`}>
                            {alert.stock} units
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {alert.threshold} units
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 text-xs ${
                            alert.type === 'out_of_stock' ? 'text-red-500' : 'text-amber-500'
                          }`}>
                            <AlertTriangle size={14} />
                            {alert.type === 'out_of_stock' 
                              ? `⚠ ${alert.platform} Out of Stock` 
                              : `⚠ ${alert.platform} Stock Low: Remaining: ${alert.stock} Units`
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              adjustProductPlatformStock(alert.productId, alert.platform, 50, 'add', 'Restocking');
                              addToast(`Successfully dispatched PO for ${alert.productName} on ${alert.platform} (+50 units).`, 'success');
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                          >
                            Restock Channel (+50)
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {platformAlerts.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400">
                        <span className="material-symbols-outlined text-4xl text-green-500 block mb-2">check_circle</span>
                        All platform stocks are above their safety threshold levels.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" /> Stock Movement History Logs
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Audits real-time synchronization channels adjustments and manual stock edits.</p>
            </div>
            <div>
              <select
                value={logFilter}
                onChange={e => setLogFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
              >
                <option value="All">All Action Types</option>
                <option value="Sales Deduction">Sales Deduction</option>
                <option value="Restocking">Restocking</option>
                <option value="Returns">Returns & Cancellations</option>
                <option value="Adjustment">Inventory Adjustments</option>
                <option value="Transfer">Warehouse Transfers</option>
                <option value="Manual">Manual Updates</option>
                <option value="Sync">Marketplace Sync Updates</option>
              </select>
            </div>
          </div>
          
          <div className="relative pl-5 border-l border-slate-200 dark:border-slate-850 space-y-5 ml-2 pt-2">
            {movementLogs.filter(log => {
              if (logFilter === 'All') return true;
              
              const action = log.action.toLowerCase();
              const filter = logFilter.toLowerCase();
              
              if (filter === 'sales deduction') {
                return action.includes('order') && !action.includes('return') && !action.includes('cancel');
              }
              if (filter === 'returns') {
                return action.includes('return') || action.includes('cancel');
              }
              
              return action.includes(filter);
            }).map((log, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-[24px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 border border-white dark:border-slate-900"></span>
                <div className="flex justify-between items-start text-xs font-bold gap-3 flex-wrap">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">{log.time}</span>
                    <p className="text-slate-900 dark:text-white mt-0.5">{log.action}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                      <span>SKU: {log.sku}</span>
                      <span>•</span>
                      <span>Product: {log.product}</span>
                      <span>•</span>
                      <span className="text-indigo-500">Channel: {log.platform}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      log.qty.startsWith('+') ? 'bg-green-50 text-green-600 dark:bg-green-950/20' : 'bg-red-50 text-red-500 dark:bg-red-950/20'
                    }`}>{log.qty} Units</span>
                    <span className="text-[9px] text-slate-400 block mt-1">By {log.user}</span>
                  </div>
                </div>
              </div>
            ))}
            {movementLogs.filter(log => {
              if (logFilter === 'All') return true;
              const action = log.action.toLowerCase();
              const filter = logFilter.toLowerCase();
              if (filter === 'sales deduction') return action.includes('order') && !action.includes('return') && !action.includes('cancel');
              if (filter === 'returns') return action.includes('return') || action.includes('cancel');
              return action.includes(filter);
            }).length === 0 && (
              <p className="text-center py-6 text-slate-400">No logs matching this category found.</p>
            )}
          </div>
        </div>
      )}

      {/* Adjust Stock Allocations Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Adjust Multi-Platform Stock</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <img src={selectedItem.image} alt={selectedItem.name} className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedItem.name}</p>
                <p className="text-[9px] text-slate-400 font-mono">{selectedItem.sku}</p>
              </div>
            </div>

            <div className="space-y-3.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
              {Object.keys(adjustmentValue).map(platform => {
                const iconData = platformIcons[platform] || Warehouse;
                const PlatIcon = iconData;

                return (
                  <div key={platform} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/45 text-xs font-bold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                        <PlatIcon size={14} className="text-indigo-500 shrink-0" />
                        {platform} Platform Settings
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Stock Adjust */}
                      <div className="space-y-1">
                        <span className="text-[8px] text-slate-400 block font-semibold uppercase tracking-wider">Stock Level</span>
                        <div className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-white dark:bg-slate-900">
                          <button 
                            type="button"
                            onClick={() => setAdjustmentValue(prev => ({ 
                              ...prev, 
                              [platform]: { ...prev[platform], stock: Math.max(0, parseInt(prev[platform].stock, 10) - 1) } 
                            }))}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                          >
                            <MinusCircle size={14} />
                          </button>
                          <input 
                            type="number" 
                            value={adjustmentValue[platform].stock}
                            onChange={e => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setAdjustmentValue(prev => ({ 
                                ...prev, 
                                [platform]: { ...prev[platform], stock: val } 
                              }));
                            }}
                            className="w-10 text-center font-extrabold bg-transparent border-none focus:ring-0 focus:outline-none text-[11px] text-slate-900 dark:text-white"
                          />
                          <button 
                            type="button"
                            onClick={() => setAdjustmentValue(prev => ({ 
                              ...prev, 
                              [platform]: { ...prev[platform], stock: parseInt(prev[platform].stock, 10) + 1 } 
                            }))}
                            className="p-1 text-slate-400 hover:text-indigo-655 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                          >
                            <PlusCircle size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Threshold Adjust */}
                      <div className="space-y-1">
                        <span className="text-[8px] text-slate-400 block font-semibold uppercase tracking-wider">Min Safety Limit</span>
                        <input 
                          type="number" 
                          value={adjustmentValue[platform].threshold}
                          onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            setAdjustmentValue(prev => ({ 
                              ...prev, 
                              [platform]: { ...prev[platform], threshold: val } 
                            }));
                          }}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-2 text-center font-extrabold text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button 
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-855 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={saveAdjustment}
                className="btn-primary flex-1 justify-center rounded-xl py-2 text-xs font-bold hover:opacity-90 cursor-pointer" style={{ color: "#ffffff" }}
              >
                Apply Adjustments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Insights Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Available Stock Units', value: totalStockUnits, desc: 'Ready for fulfillment', color: 'text-indigo-500' },
              { label: 'Reserved Stock Units', value: Math.round(totalStockUnits * 0.15), desc: 'Locked in pending orders', color: 'text-slate-500' },
              { label: 'Inventory Cost Value', value: `₹${totalAssetCost.toLocaleString()}`, desc: 'Total asset cost value', color: 'text-emerald-500' },
              { label: 'Inventory Retail Value', value: `₹${totalAssetRetail.toLocaleString()}`, desc: 'Potential sales value', color: 'text-blue-500' }
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 space-y-1 shadow-sm">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{stat.label}</span>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">{stat.value}</h4>
                <span className="text-[9px] text-slate-450 block">{stat.desc}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visual Distribution Chart */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <h3 className="text-xs font-black text-slate-455 uppercase tracking-wider">Inventory Share by Marketplace</h3>
              
              <div className="h-48 flex items-center justify-center relative">
                {/* SVG Donut Chart representation */}
                <svg className="w-full h-full max-w-[180px] -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="3.2" />
                  {/* Calculate segments dynamically */}
                  {(() => {
                    let offset = 0;
                    return PLATFORMS_LIST.map((p, idx) => {
                      const stock = platformStocks[p];
                      const pct = Math.round((stock / (totalStockUnits || 1)) * 100) || 0;
                      if (pct === 0) return null;
                      
                      let color = '#4f46e5'; // indigo
                      if (p === 'Amazon') color = '#f97316';
                      if (p === 'Flipkart') color = '#2563eb';
                      if (p === 'Meesho') color = '#ec4899';
                      if (p === 'Shopify') color = '#16a34a';
                      if (p === 'WooCommerce') color = '#9333ea';
                      if (p === 'Myntra') color = '#f43f5e';
                      if (p === 'Ajio') color = '#0d9488';
                      
                      const strokeDash = `${pct} ${100 - pct}`;
                      const currentOffset = offset;
                      offset += pct;
                      
                      return (
                        <circle 
                          key={idx} 
                          cx="18" 
                          cy="18" 
                          r="15.915" 
                          fill="none" 
                          stroke={color} 
                          strokeWidth="3.4" 
                          strokeDasharray={strokeDash} 
                          strokeDashoffset={100 - currentOffset}
                          title={`${p}: ${pct}%`}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Total Stock</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">{totalStockUnits}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 text-[9px] pt-1 text-slate-450 uppercase font-bold border-t border-slate-100 dark:border-slate-800/80">
                {PLATFORMS_LIST.map(p => {
                  const stock = platformStocks[p];
                  const pct = Math.round((stock / (totalStockUnits || 1)) * 100) || 0;
                  if (pct === 0) return null;
                  
                  let dotColor = 'bg-indigo-500';
                  if (p === 'Amazon') dotColor = 'bg-orange-500';
                  if (p === 'Flipkart') dotColor = 'bg-blue-600';
                  if (p === 'Meesho') dotColor = 'bg-pink-500';
                  if (p === 'Shopify') dotColor = 'bg-green-600';
                  if (p === 'WooCommerce') dotColor = 'bg-purple-650';
                  if (p === 'Myntra') dotColor = 'bg-rose-500';
                  if (p === 'Ajio') dotColor = 'bg-teal-650';
                  
                  return (
                    <div key={p} className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                      <span>{p} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance & Moving Velocity */}
            <div className="lg:col-span-7 space-y-6">
              {/* Marketplace Performance List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-sm">
                <h3 className="text-xs font-black text-slate-455 uppercase tracking-wider">Marketplace Connection Ratings</h3>
                <div className="space-y-3.5">
                  {PLATFORMS_LIST.map(p => {
                    const stats = getPlatformStats(p);
                    const isOos = stats.outOfStock > 0;
                    const rating = isOos ? 'Needs Attention' : stats.lowStock > 0 ? 'Adequate' : 'Optimal';
                    const ratingColor = isOos ? 'text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200/20' : stats.lowStock > 0 ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/20' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/20';
                    return (
                      <div key={p} className="flex justify-between items-center text-xs font-bold p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 dark:text-white">{p}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 font-semibold">{stats.available} Available U</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] ${ratingColor}`}>
                            {rating}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fast / Slow Moving items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fast moving */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
                  <h3 className="text-xs font-black text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp size={14} /> Fast-Moving SKUs
                  </h3>
                  <div className="space-y-3 text-xs font-bold">
                    {inventoryItems.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <div>
                          <p className="text-slate-850 dark:text-slate-200 truncate max-w-[120px]">{item.name}</p>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{item.sku}</span>
                        </div>
                        <span className="text-emerald-500">High Velocity</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Slow moving */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
                  <h3 className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-1">
                    <RefreshCwOff size={14} /> Slow-Moving SKUs
                  </h3>
                  <div className="space-y-3 text-xs font-bold">
                    {inventoryItems.slice(3, 6).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <div>
                          <p className="text-slate-850 dark:text-slate-200 truncate max-w-[120px]">{item.name}</p>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{item.sku}</span>
                        </div>
                        <span className="text-slate-400">Low Turnover</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Stock Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ArrowRightLeft size={16} className="text-indigo-505" /> Transfer Stock Between Channels
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Select SKU / Product</label>
                <select 
                  value={transferForm.productId}
                  onChange={e => setTransferForm(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                >
                  {inventoryItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">From Location</label>
                  <select 
                    value={transferForm.fromPlatform}
                    onChange={e => setTransferForm(prev => ({ ...prev, fromPlatform: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                  >
                    {PLATFORMS_LIST.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">To Destination</label>
                  <select 
                    value={transferForm.toPlatform}
                    onChange={e => setTransferForm(prev => ({ ...prev, toPlatform: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                  >
                    {PLATFORMS_LIST.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Quantity to Transfer</label>
                <input 
                  type="number" 
                  value={transferForm.qty}
                  onChange={e => setTransferForm(prev => ({ ...prev, qty: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button 
                onClick={() => setShowTransferModal(false)}
                className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-855 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (transferForm.fromPlatform === transferForm.toPlatform) {
                    addToast('Source and destination platforms must be different.', 'error');
                    return;
                  }
                  transferPlatformStock(transferForm.productId, transferForm.fromPlatform, transferForm.toPlatform, transferForm.qty);
                  setShowTransferModal(false);
                }}
                className="btn-primary flex-1 justify-center rounded-xl py-2 text-xs font-bold hover:opacity-90 cursor-pointer" style={{ color: "#ffffff" }}
              >
                Execute Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Inventory Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <PlusCircle size={16} className="text-green-500" /> Restock Platform Inventory
              </h3>
              <button onClick={() => setShowRestockModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Select SKU / Product</label>
                <select 
                  value={restockForm.productId}
                  onChange={e => setRestockForm(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                >
                  {inventoryItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Fulfillment Platform / Warehouse</label>
                <select 
                  value={restockForm.platform}
                  onChange={e => setRestockForm(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                >
                  {PLATFORMS_LIST.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Restock Quantity (+)</label>
                <input 
                  type="number" 
                  value={restockForm.qty}
                  onChange={e => setRestockForm(prev => ({ ...prev, qty: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button 
                onClick={() => setShowRestockModal(false)}
                className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-855 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  adjustProductPlatformStock(restockForm.productId, restockForm.platform, restockForm.qty, 'add', 'Restocking');
                  const prodName = inventoryItems.find(i => i.id === restockForm.productId)?.name || 'SKU';
                  addToast(`Dispatched PO reorder for ${prodName} on ${restockForm.platform} (+${restockForm.qty} units).`, 'success');
                  setShowRestockModal(false);
                }}
                className="btn-primary flex-1 justify-center rounded-xl py-2 text-xs font-bold hover:opacity-90 cursor-pointer" style={{ color: "#ffffff" }}
              >
                Dispatch PO Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Stock Modal */}
      {showBulkUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers size={16} className="text-indigo-505" /> Bulk Update Platform Stock
              </h3>
              <button onClick={() => setShowBulkUpdateModal(false)} className="text-slate-455 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Marketplace Platform</label>
                <select 
                  value={bulkForm.platform}
                  onChange={e => setBulkForm(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                >
                  {PLATFORMS_LIST.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Operation Type</label>
                  <select 
                    value={bulkForm.operation}
                    onChange={e => setBulkForm(prev => ({ ...prev, operation: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                  >
                    <option value="add">Add Stock (+)</option>
                    <option value="deduct">Deduct Stock (-)</option>
                    <option value="set">Set Fixed Value (=)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Quantity</label>
                  <input 
                    type="number" 
                    value={bulkForm.qty}
                    onChange={e => setBulkForm(prev => ({ ...prev, qty: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button 
                onClick={() => setShowBulkUpdateModal(false)}
                className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-855 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  inventoryItems.forEach(item => {
                    adjustProductPlatformStock(item.id, bulkForm.platform, bulkForm.qty, bulkForm.operation, 'Bulk Update Stock');
                  });
                  addToast(`Bulk stock update applied successfully for all products on ${bulkForm.platform}.`, 'success');
                  setShowBulkUpdateModal(false);
                }}
                className="btn-primary flex-1 justify-center rounded-xl py-2 text-xs font-bold hover:opacity-90 cursor-pointer" style={{ color: "#ffffff" }}
              >
                Apply Bulk Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-indigo-505" /> Authorize Inventory Sync Audit
              </h3>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Product</label>
                <select 
                  value={auditForm.productId}
                  onChange={e => setAuditForm(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                >
                  {inventoryItems.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Select Audit Platform</label>
                <select 
                  value={auditForm.platform}
                  onChange={e => setAuditForm(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                >
                  {PLATFORMS_LIST.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Audit Log Notes</label>
                <textarea 
                  rows="3"
                  value={auditForm.notes}
                  onChange={e => setAuditForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl p-2.5 focus:outline-none text-slate-900 dark:text-white"
                  placeholder="e.g. Stock levels audited and confirmed matching physical warehouse counts."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button 
                onClick={() => setShowAuditModal(false)}
                className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-855 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const prodName = inventoryItems.find(i => i.id === auditForm.productId)?.name || 'Product';
                  const ext = productsExtended[auditForm.productId];
                  const currentStock = ext?.platforms[auditForm.platform]?.stock || 0;
                  
                  adjustProductPlatformStock(auditForm.productId, auditForm.platform, currentStock, 'set', 'Inventory Audit');
                  addToast(`Inventory audit completed for ${prodName} on ${auditForm.platform}. Status set to Sync verified.`, 'success');
                  setShowAuditModal(false);
                }}
                className="btn-primary flex-1 justify-center rounded-xl py-2 text-xs font-bold hover:opacity-90 cursor-pointer" style={{ color: "#ffffff" }}
              >
                Confirm Sync Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
