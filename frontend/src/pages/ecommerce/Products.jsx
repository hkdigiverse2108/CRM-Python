import PageHeader from '@/components/ui/PageHeader';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Package, Search, Plus, RefreshCw, TrendingUp, DollarSign, 
  Edit3, Trash2, X, PlusCircle, Layers, Send, Globe, Percent, 
  ShoppingCart, Store, ShoppingBag, Eye, Award, Warehouse
} from 'lucide-react';

const platformIcons = {
  Amazon: { icon: Package, color: 'text-orange-500 bg-orange-50 border-orange-200/50 dark:bg-orange-950/20 dark:border-orange-900/30' },
  Flipkart: { icon: ShoppingCart, color: 'text-blue-600 bg-blue-50 border-blue-200/50 dark:bg-blue-950/20 dark:border-blue-900/30' },
  Meesho: { icon: ShoppingBag, color: 'text-pink-500 bg-pink-50 border-pink-200/50 dark:bg-pink-950/20 dark:border-pink-900/30' },
  Shopify: { icon: Store, color: 'text-green-600 bg-green-50 border-green-200/50 dark:bg-green-950/20 dark:border-green-900/30' },
  WooCommerce: { icon: Store, color: 'text-purple-600 bg-purple-50 border-purple-200/50 dark:bg-purple-950/20 dark:border-purple-900/30' },
  Myntra: { icon: ShoppingBag, color: 'text-rose-500 bg-rose-50 border-rose-200/50 dark:bg-rose-950/20 dark:border-rose-900/30' },
  Ajio: { icon: ShoppingBag, color: 'text-teal-600 bg-teal-50 border-teal-200/50 dark:bg-teal-950/20 dark:border-teal-900/30' },
  Warehouse: { icon: Warehouse, color: 'text-indigo-600 bg-indigo-50 border-indigo-200/50 dark:bg-indigo-950/20 dark:border-indigo-900/30' }
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function Products() {
  const { inventoryItems, setInventoryItems, productsExtended, setProductsExtended, addToast, createProduct, updateProduct, deleteProductApi, token, tenantId, fetchProducts } = useApp();
  
  // State variables
  const [activeTab, setActiveTab] = useState('catalog'); // catalog, channels, recovery
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // UI states
  const [shopifySyncing, setShopifySyncing] = useState(false);
  const [wooSyncing, setWooSyncing] = useState(false);
  const [recoveredCarts, setRecoveredCarts] = useState({});
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredBadge, setHoveredBadge] = useState(null); // { itemId, platform }

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '', sku: '', category: 'Electronics', stock: 10, safetyStock: 5, cost: 0, price: 0, warehouse: 'Chicago',
    brand: '', description: '', tax: 0, discount: 0, status: 'Active', notes: '',
    platforms: ['Amazon', 'Flipkart']
  });
  const [editProduct, setEditProduct] = useState({
    id: '', name: '', sku: '', category: '', cost: 0, price: 0, warehouse: '',
    brand: '', description: '', tax: 0, discount: 0, status: 'Active', notes: '',
    platforms: []
  });

  // Calculate catalog stats
  const totalSKUs = inventoryItems.length;
  const avgMargin = Math.round(
    inventoryItems.reduce((acc, item) => acc + ((item.price - item.cost) / item.price) * 100, 0) / (totalSKUs || 1)
  );
  const totalRetailValue = inventoryItems.reduce((acc, item) => acc + (item.stock * item.price), 0);
  const activeChannels = 4; // Amazon, Flipkart, Meesho, Shopify
  const totalAtRisk = abandonedCarts.reduce((sum, c) => sum + (parseInt(c.price.replace(/[^\d]/g, ''), 10) || 0), 0);

  // Filter products
  const filteredProducts = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSync = async (platform) => {
    if (platform === 'shopify') {
      setShopifySyncing(true);
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
          addToast(`Shopify product sync completed successfully. Synced ${data.data?.synced_count || 0} products.`, 'success');
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
        } else {
          throw new Error(data.message || 'Failed to sync Shopify products');
        }
      } catch (err) {
        console.error(err);
        addToast(`Shopify sync failed: ${err.message}`, 'error');
      } finally {
        setShopifySyncing(false);
      }
    } else {
      setWooSyncing(true);
      setTimeout(() => {
        setWooSyncing(false);
        addToast('WooCommerce catalog sync completed successfully.', 'success');
      }, 1500);
    }
  };

  const handleRecover = (id, customerName) => {
    if (recoveredCarts[id]) return;
    addToast(`WhatsApp recovery flow initiated for ${customerName}`, 'success');
    setRecoveredCarts(prev => ({ ...prev, [id]: true }));
  };

  const deleteProduct = async (id, name) => {
    if (confirm(`Are you sure you want to delete ${name} from the catalog?`)) {
      try {
        await deleteProductApi(id);
        addToast(`${name} deleted from catalog.`, 'info');
      } catch (err) {
        addToast(`Failed to delete ${name}: ${err.message}`, 'error');
      }
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }
    try {
      const productData = {
        name: newProduct.name,
        sku: newProduct.sku,
        category: newProduct.category,
        stock: parseInt(newProduct.stock, 10) || 0,
        safetyStock: parseInt(newProduct.safetyStock, 10) || 5,
        cost: parseFloat(newProduct.cost) || 0,
        price: parseFloat(newProduct.price) || 0,
        warehouse: newProduct.warehouse,
        brand: newProduct.brand || 'Generic',
        description: newProduct.description || '',
        tax: parseFloat(newProduct.tax) || 0,
        discount: parseFloat(newProduct.discount) || 0,
        status: newProduct.status || 'Active',
        notes: newProduct.notes || '',
        platforms: newProduct.platforms || ['Amazon', 'Flipkart'],
      };
      const created = await createProduct(productData);
      
      // Build productsExtended entry from returned data's platforms array
      if (created) {
        const selectedPlatforms = created.platforms || newProduct.platforms || [];
        const extendedInfo = {
          brand: created.brand || 'Generic',
          platforms: {},
          metrics: {
            totalSales: 0,
            platformSales: { Amazon: 0, Flipkart: 0, Meesho: 0, Shopify: 0, WooCommerce: 0, Myntra: 0, Ajio: 0 },
            revenue: 0,
            conversionRate: 0.0,
            returnRate: 0.0,
            bestPerforming: 'N/A'
          }
        };
        ['Amazon', 'Flipkart', 'Meesho', 'Shopify', 'WooCommerce', 'Myntra', 'Ajio', 'Warehouse'].forEach(p => {
          const isActive = selectedPlatforms.includes(p);
          extendedInfo.platforms[p] = {
            active: isActive,
            syncStatus: isActive ? 'Synced' : 'Pending',
            lastSync: 'Just now',
            sku: `${p.slice(0, 3).toUpperCase()}-${created.sku}`,
            prodId: `${p.slice(0, 3).toUpperCase()}-${Date.now()}`,
            price: created.price,
            stock: isActive ? Math.round(created.stock * 0.2) : 0,
            status: isActive ? 'Active' : 'Inactive',
            threshold: 5
          };
        });
        setProductsExtended(prev => ({ ...prev, [created.id]: extendedInfo }));
      }

      addToast(`${newProduct.name} added to catalog.`, 'success');
      setShowAddModal(false);
      setNewProduct({ name: '', sku: '', category: 'Electronics', stock: 10, safetyStock: 5, cost: 0, price: 0, warehouse: 'Chicago', brand: '', description: '', tax: 0, discount: 0, status: 'Active', notes: '', platforms: ['Amazon', 'Flipkart'] });
    } catch (err) {
      addToast(`Failed to create product: ${err.message}`, 'error');
    }
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    // Use the platforms from the item itself (from API) instead of productsExtended
    const itemPlatforms = item.platforms || [];

    setEditProduct({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      cost: item.cost,
      price: item.price,
      warehouse: item.warehouse || 'Chicago',
      brand: item.brand || 'Generic',
      description: item.description || '',
      tax: item.tax || 0,
      discount: item.discount || 0,
      status: item.status || 'Active',
      notes: item.notes || '',
      stock: item.stock || 0,
      safetyStock: item.safetyStock || 5,
      platforms: itemPlatforms.length > 0 ? itemPlatforms : ['Amazon', 'Flipkart']
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        name: editProduct.name,
        sku: editProduct.sku,
        category: editProduct.category,
        cost: parseFloat(editProduct.cost) || 0,
        price: parseFloat(editProduct.price) || 0,
        warehouse: editProduct.warehouse,
        brand: editProduct.brand,
        description: editProduct.description,
        tax: parseFloat(editProduct.tax) || 0,
        discount: parseFloat(editProduct.discount) || 0,
        status: editProduct.status,
        notes: editProduct.notes,
        stock: parseInt(editProduct.stock, 10) || 0,
        safetyStock: parseInt(editProduct.safetyStock, 10) || 5,
        platforms: editProduct.platforms || [],
      };
      const updated = await updateProduct(editProduct.id, updateData);

      // Update productsExtended based on new platforms
      if (updated) {
        const selectedPlatforms = updated.platforms || editProduct.platforms || [];
        setProductsExtended(prev => {
          const existingExtended = prev[editProduct.id] || { platforms: {} };
          const updatedPlatforms = { ...existingExtended.platforms };

          ['Amazon', 'Flipkart', 'Meesho', 'Shopify', 'WooCommerce', 'Myntra', 'Ajio', 'Warehouse'].forEach(p => {
            const isActive = selectedPlatforms.includes(p);
            if (updatedPlatforms[p]) {
              updatedPlatforms[p] = { ...updatedPlatforms[p], active: isActive, status: isActive ? 'Active' : 'Inactive' };
            } else {
              updatedPlatforms[p] = {
                active: isActive, syncStatus: isActive ? 'Synced' : 'Pending', lastSync: 'Just now',
                sku: `${p.slice(0, 3).toUpperCase()}-${updated.sku}`,
                prodId: `${p.slice(0, 3).toUpperCase()}-${Date.now()}`,
                price: updated.price, stock: isActive ? Math.round(updated.stock * 0.2) : 0,
                status: isActive ? 'Active' : 'Inactive', threshold: 5
              };
            }
          });

          return { ...prev, [editProduct.id]: { ...existingExtended, brand: updated.brand, platforms: updatedPlatforms } };
        });
      }

      addToast(`Product ${editProduct.name} updated successfully.`, 'success');
      setShowEditModal(false);
    } catch (err) {
      addToast(`Failed to update product: ${err.message}`, 'error');
    }
  };

  const openProductDetails = (item) => {
    const extendedInfo = productsExtended[item.id] || {
      brand: item.brand || 'Generic',
      platforms: {
        Amazon: { active: true, syncStatus: 'Synced', lastSync: '5m ago', sku: `AMZ-${item.sku}`, prodId: 'B08XYZ101', price: item.price, stock: Math.round(item.stock * 0.2), status: 'Active' },
        Flipkart: { active: true, syncStatus: 'Synced', lastSync: '8m ago', sku: `FK-${item.sku}`, prodId: 'FKT-10291', price: Math.round(item.price * 0.95), stock: Math.round(item.stock * 0.2), status: 'Active' },
        Meesho: { active: false, syncStatus: 'Pending', lastSync: '1h ago', sku: `MSH-${item.sku}`, prodId: 'MEE-83910', price: Math.round(item.price * 0.9), stock: 0, status: 'Inactive' },
        Shopify: { active: true, syncStatus: 'Synced', lastSync: '2m ago', sku: `SHP-${item.sku}`, prodId: 'SH-829102', price: item.price, stock: Math.round(item.stock * 0.2), status: 'Active' },
        WooCommerce: { active: true, syncStatus: 'Synced', lastSync: '12m ago', sku: `WC-${item.sku}`, prodId: 'WC-82910', price: item.price, stock: Math.round(item.stock * 0.1), status: 'Active' },
        Myntra: { active: true, syncStatus: 'Synced', lastSync: '20m ago', sku: `MYN-${item.sku}`, prodId: 'MY-82910', price: item.price, stock: Math.round(item.stock * 0.1), status: 'Active' },
        Ajio: { active: true, syncStatus: 'Synced', lastSync: '18m ago', sku: `AJI-${item.sku}`, prodId: 'AJ-82910', price: item.price, stock: Math.round(item.stock * 0.1), status: 'Active' },
        Warehouse: { active: true, syncStatus: 'Synced', lastSync: '1m ago', sku: `WH-${item.sku}`, prodId: 'WH-LOCAL', price: Math.round(item.price * 0.85), stock: Math.round(item.stock * 0.1), status: 'Active' }
      },
      metrics: {
        totalSales: 450,
        platformSales: { Amazon: 200, Flipkart: 150, Meesho: 0, Shopify: 100, WooCommerce: 0, Myntra: 0, Ajio: 0 },
        revenue: item.price * 450,
        conversionRate: 2.5,
        returnRate: 3.2,
        bestPerforming: 'Amazon'
      }
    };
    setSelectedProductDetails({ 
      ...item, 
      ...extendedInfo, 
      brand: item.brand || 'Generic',
      description: item.description || '',
      tax: item.tax || 0,
      discount: item.discount || 0,
      status: item.status || 'Active',
      notes: item.notes || ''
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      
      <PageHeader title="Product Catalog" subtitle="Manage your product listings and inventory">
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          <Plus size={16} /> Create Product
        </button>
      </PageHeader>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80 gap-1 overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'catalog', label: 'Product Catalog', icon: Layers },
          { id: 'channels', label: 'Marketplace Integrations', icon: Globe },
          { id: 'recovery', label: 'Checkout Recovery', icon: Send }
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
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Stats Summary Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Catalog SKUs', value: totalSKUs, icon: Layers, color: 'text-indigo-500' },
              { label: 'Average Gross Margin', value: `${avgMargin}%`, icon: Percent, color: 'text-emerald-500' },
              { label: 'Est. Catalog Value', value: `₹${totalRetailValue.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-500' },
              { label: 'Marketplaces Live', value: `${activeChannels} Channels`, icon: Globe, color: 'text-amber-500' }
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

          {/* Search, Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-2">
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
            </div>
          </div>

          {/* Products Grid/Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800/80">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Product details</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Marketplace Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cost Price</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Retail Price</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-250/20 dark:divide-slate-800/80 text-xs">
                  {filteredProducts.map(item => {
                    const extended = productsExtended[item.id] || { platforms: {} };

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/45 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200/50" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</p>
                              <p className="text-[10px] font-mono text-slate-400 mt-0.5">{item.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                          {item.category}
                        </td>
                        <td className="px-6 py-4">
                          {/* Platform availability badges */}
                          <div className="flex flex-wrap items-center gap-1.5 relative max-w-[280px]">
                            {['Amazon', 'Flipkart', 'Meesho', 'Shopify', 'WooCommerce', 'Myntra', 'Ajio', 'Warehouse'].filter(p => {
                              // Check item.platforms array from API first (case-insensitive)
                              if (item.platforms && Array.isArray(item.platforms)) {
                                return item.platforms.some(plat => plat.toLowerCase() === p.toLowerCase());
                              }
                              const platInfo = extended.platforms?.[p];
                              return platInfo ? platInfo.active : false;
                            }).map(p => {
                              const platInfo = extended.platforms?.[p] || { active: true, sku: `T-${item.sku}`, prodId: 'N/A', price: item.price, stock: 10, status: 'Active', syncStatus: 'Synced', lastSync: '5m ago' };
                              const iconData = platformIcons[p];
                              const PlatIcon = iconData.icon;
                              const isHovered = hoveredBadge?.itemId === item.id && hoveredBadge?.platform === p;

                              return (
                                <div 
                                  key={p} 
                                  className="relative cursor-pointer"
                                  onMouseEnter={() => setHoveredBadge({ itemId: item.id, platform: p })}
                                  onMouseLeave={() => setHoveredBadge(null)}
                                >
                                  <div className={`px-2 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
                                    platInfo.active 
                                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200 dark:border-emerald-900/30' 
                                      : 'bg-slate-50 dark:bg-slate-800/30 text-slate-400 border-slate-200 dark:border-slate-800/80 opacity-60'
                                  }`}>
                                    <PlatIcon size={12} />
                                    <span className="text-[9px] font-bold">{p}</span>
                                  </div>

                                  {/* Badge detail hover tooltip card */}
                                  {isHovered && (
                                    <div className="absolute z-50 top-full mt-1.5 left-1/2 -translate-x-1/2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-2xl space-y-1.5 animate-[fadeIn_100ms_ease] text-left pointer-events-none">
                                      <p className="text-[10px] font-black text-slate-900 dark:text-white flex items-center gap-1">
                                        <PlatIcon size={12} className={platInfo.active ? 'text-green-500' : 'text-slate-400'} />
                                        {p} Listing Details
                                      </p>
                                      <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5 space-y-1 text-[9px] font-bold text-slate-450">
                                        <div className="flex justify-between"><span>SKU:</span><span className="text-slate-800 dark:text-slate-200 font-mono">{platInfo.sku}</span></div>
                                        <div className="flex justify-between"><span>List ID:</span><span className="text-slate-800 dark:text-slate-200 font-mono">{platInfo.prodId}</span></div>
                                        <div className="flex justify-between"><span>Price:</span><span className="text-slate-850 dark:text-slate-200">₹{platInfo.price}</span></div>
                                        <div className="flex justify-between"><span>Stock:</span><span className="text-slate-850 dark:text-slate-200">{platInfo.stock} units</span></div>
                                        <div className="flex justify-between"><span>Sync:</span><span className="text-indigo-500">{platInfo.syncStatus} ({platInfo.lastSync})</span></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-950 dark:text-white">
                          ₹{item.cost.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">
                          ₹{item.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => openProductDetails(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                              title="Unified Details Dashboard"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                              title="Edit product info"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => deleteProduct(item.id, item.name)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400">
                        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 block mb-2">inventory_2</span>
                        No products match the filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'channels' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Amazon', 'Flipkart', 'Meesho', 'Shopify', 'WooCommerce', 'Myntra', 'Ajio', 'Warehouse'].map(p => {
              const iconData = platformIcons[p];
              const PlatIcon = iconData.icon;
              return (
                <div key={p} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                      <PlatIcon size={24} className="text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1 gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{p} Integration</h4>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-550 dark:text-slate-450">SKUs Listed: {totalSKUs}</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
                    <span className="text-[11px] font-medium text-slate-400">Auto-sync: Enabled</span>
                    <button 
                      disabled={shopifySyncing}
                      onClick={() => handleSync(p.toLowerCase())}
                      className="text-xs font-bold text-indigo-655 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {shopifySyncing ? 'Syncing...' : 'Sync Now'}
                      <RefreshCw size={12} className={shopifySyncing ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'recovery' && (
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Abandoned Checkout Recovery</h3>
              <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">Automated WhatsApp recovery flow logs and checkout restoration triggers.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/45 text-purple-700 dark:text-purple-400 rounded-xl text-xs font-bold self-start border border-purple-100 dark:border-purple-900/20">
              <TrendingUp size={15} />
              ₹{totalAtRisk.toLocaleString('en-IN')}.00 At Risk
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800/80">
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Cart Details</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Recovery Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {abandonedCarts.map(cart => (
                  <tr key={cart.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-655 dark:text-indigo-400 flex items-center justify-center font-bold">{cart.initial}</div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{cart.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{cart.time}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{cart.items}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{cart.text}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {cart.price}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleRecover(cart.id, cart.name)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer ${
                          recoveredCarts[cart.id] 
                            ? 'bg-slate-350 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                            : 'bg-green-500 hover:scale-[1.03]'
                        }`}
                      >
                        <Send size={12} />
                        {recoveredCarts[cart.id] ? 'Flow Dispatched' : 'Send WhatsApp Recovery'}
                      </button>
                    </td>
                  </tr>
                ))}
                {abandonedCarts.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-slate-400 font-semibold">
                      <div className="flex flex-col items-center gap-1.5">
                        <ShoppingCart size={32} className="text-slate-300 dark:text-slate-700" />
                        <span>No abandoned checkouts found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unified Product details modal */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 animate-[slideUp_150ms_ease] max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800/80 pb-4">
              <div className="flex gap-4 items-center">
                <img src={selectedProductDetails.image} alt={selectedProductDetails.name} className="w-16 h-16 object-cover rounded-xl border border-slate-200/60" />
                <div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white leading-tight">{selectedProductDetails.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                    <span>SKU: {selectedProductDetails.sku}</span>
                    <span>•</span>
                    <span>Brand: {selectedProductDetails.brand}</span>
                    <span>•</span>
                    <span>Category: {selectedProductDetails.category}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedProductDetails(null)} className="text-slate-450 hover:text-slate-700 dark:hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            {/* Extended fields */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Brand</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">{selectedProductDetails.brand || 'Generic'}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-455 uppercase tracking-wider block">Tax (%)</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">{selectedProductDetails.tax || 0}%</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-455 uppercase tracking-wider block">Discount (₹)</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">₹{(selectedProductDetails.discount || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-455 uppercase tracking-wider block">Status</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">{selectedProductDetails.status || 'Active'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-bold text-slate-455 uppercase tracking-wider block">Description</span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 block">{selectedProductDetails.description || 'No description provided.'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-bold text-slate-455 uppercase tracking-wider block">Notes</span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 block">{selectedProductDetails.notes || 'No notes available.'}</span>
              </div>
            </div>

            {/* Performance metrics dashboard widgets */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={14} className="text-indigo-500" /> Marketplace Performance Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {[
                  { label: 'Total Sales Qty', value: `${selectedProductDetails.metrics.totalSales} Units` },
                  { label: 'Revenue Generated', value: `₹${selectedProductDetails.metrics.revenue.toLocaleString()}` },
                  { label: 'Conversion Rate', value: `${selectedProductDetails.metrics.conversionRate}%` },
                  { label: 'Avg Return Rate', value: `${selectedProductDetails.metrics.returnRate}%`, color: 'text-red-500' }
                ].map((m, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{m.label}</span>
                    <span className={`text-sm font-extrabold mt-1 block ${m.color || 'text-slate-900 dark:text-white'}`}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform-Wise Listing & Stock Status */}
            <div className="border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-850/50 border-b border-slate-200/60 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Platform-Wise Listing & Stock Status</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px] font-bold">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-850/30 border-b border-slate-200 dark:border-slate-800 text-slate-450 uppercase">
                      <th className="p-3">Platform</th>
                      <th className="p-3">Platform SKU</th>
                      <th className="p-3">Product ID</th>
                      <th className="p-3">Listing Status</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Sync Status</th>
                      <th className="p-3 text-right">Available Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                    {Object.keys(selectedProductDetails.platforms).map(p => {
                      const pInfo = selectedProductDetails.platforms[p];
                      const iconData = platformIcons[p] || { icon: Package, color: '' };
                      const PlatIcon = iconData.icon;
                      
                      return (
                        <tr key={p} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3 flex items-center gap-2">
                            <div className={`p-1 rounded-md ${iconData.color}`}>
                              <PlatIcon size={12} />
                            </div>
                            <span className="text-slate-900 dark:text-white">{p}</span>
                          </td>
                          <td className="p-3 font-mono">{pInfo.sku || 'N/A'}</td>
                          <td className="p-3 font-mono">{pInfo.prodId || 'N/A'}</td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] ${
                              pInfo.active || pInfo.status === 'Active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-200/25'
                                : 'bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-200/25'
                            }`}>
                              {pInfo.status || (pInfo.active ? 'Active' : 'Inactive')}
                            </span>
                          </td>
                          <td className="p-3">₹{(pInfo.price || 0).toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 text-[9px] ${
                              pInfo.syncStatus === 'Synced' ? 'text-indigo-500' : 'text-amber-500'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${pInfo.syncStatus === 'Synced' ? 'bg-indigo-500 animate-pulse' : 'bg-amber-500'}`}></span>
                              {pInfo.syncStatus || 'Synced'}
                            </span>
                          </td>
                          <td className="p-3 text-right text-slate-950 dark:text-white font-extrabold text-xs">{pInfo.stock || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Performance Share */}
            <div className="border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 space-y-3.5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Marketplace Sales Distribution</h4>
              <div className="space-y-2 text-xs font-bold">
                {Object.keys(selectedProductDetails.metrics.platformSales).map(p => {
                  const sales = selectedProductDetails.metrics.platformSales[p];
                  const total = selectedProductDetails.metrics.totalSales;
                  const pct = Math.round((sales / total) * 100) || 0;
                  return (
                    <div key={p} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">{p} Channel:</span>
                        <span>{sales} Units ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setSelectedProductDetails(null)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Close Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <PlusCircle className="text-indigo-655" /> Add New Catalog Product
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product Name *</label>
                  <input 
                    type="text" 
                    required
                    value={newProduct.name}
                    onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. UltraBoost Runners v5" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SKU Code *</label>
                  <input 
                    type="text" 
                    required
                    value={newProduct.sku}
                    onChange={e => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="e.g. UB-RUN-V5-01" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                  <select 
                    value={newProduct.category}
                    onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none font-semibold"
                  >
                    <option>Electronics</option>
                    <option>Footwear</option>
                    <option>Accessories</option>
                    <option>Furniture</option>
                    <option>Apparel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Brand</label>
                  <input 
                    type="text" 
                    value={newProduct.brand}
                    onChange={e => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="Brand name" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</label>
                  <select 
                    value={newProduct.status}
                    onChange={e => setNewProduct(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Initial Stock Qty</label>
                  <input 
                    type="number" 
                    value={newProduct.stock}
                    onChange={e => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Safety Stock Limit</label>
                  <input 
                    type="number" 
                    value={newProduct.safetyStock}
                    onChange={e => setNewProduct(prev => ({ ...prev, safetyStock: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cost Price (₹)</label>
                  <input 
                    type="number" 
                    value={newProduct.cost}
                    onChange={e => setNewProduct(prev => ({ ...prev, cost: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Retail Price (₹)</label>
                  <input 
                    type="number" 
                    value={newProduct.price}
                    onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tax (%)</label>
                  <input 
                    type="number" 
                    value={newProduct.tax}
                    onChange={e => setNewProduct(prev => ({ ...prev, tax: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discount (₹)</label>
                  <input 
                    type="number" 
                    value={newProduct.discount}
                    onChange={e => setNewProduct(prev => ({ ...prev, discount: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fulfillment Warehouse</label>
                  <select 
                    value={newProduct.warehouse}
                    onChange={e => setNewProduct(prev => ({ ...prev, warehouse: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none font-semibold"
                  >
                    <option>Chicago</option>
                    <option>Berlin</option>
                    <option>Singapore</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Platforms *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    {['Amazon', 'Flipkart', 'Meesho', 'Shopify', 'WooCommerce', 'Myntra', 'Ajio', 'Warehouse'].map(p => {
                      const isSelected = newProduct.platforms?.includes(p);
                      return (
                        <label key={p} className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-250 dark:border-indigo-900/50 text-indigo-655 dark:text-indigo-400' 
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-850'
                        }`}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {
                              const updated = isSelected 
                                ? newProduct.platforms?.filter(x => x !== p) 
                                : [...(newProduct.platforms || []), p];
                              setNewProduct(prev => ({ ...prev, platforms: updated }));
                            }}
                            className="accent-indigo-600 rounded animate-none"
                          />
                          {p}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
                  <textarea 
                    value={newProduct.description}
                    onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Product details..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notes</label>
                  <textarea 
                    value={newProduct.notes}
                    onChange={e => setNewProduct(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Internal remarks..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl py-2 text-xs font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 cursor-pointer"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Product Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-[slideUp_150ms_ease] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Edit3 className="text-indigo-655" /> Edit Product Details
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product Name *</label>
                  <input 
                    type="text" 
                    required
                    value={editProduct.name}
                    onChange={e => setEditProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SKU Code *</label>
                  <input 
                    type="text" 
                    required
                    value={editProduct.sku}
                    onChange={e => setEditProduct(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                  <select 
                    value={editProduct.category}
                    onChange={e => setEditProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none font-semibold"
                  >
                    <option>Electronics</option>
                    <option>Footwear</option>
                    <option>Accessories</option>
                    <option>Furniture</option>
                    <option>Apparel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Brand</label>
                  <input 
                    type="text" 
                    value={editProduct.brand}
                    onChange={e => setEditProduct(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</label>
                  <select 
                    value={editProduct.status}
                    onChange={e => setEditProduct(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cost Price (₹)</label>
                  <input 
                    type="number" 
                    value={editProduct.cost}
                    onChange={e => setEditProduct(prev => ({ ...prev, cost: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Retail Price (₹)</label>
                  <input 
                    type="number" 
                    value={editProduct.price}
                    onChange={e => setEditProduct(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tax (%)</label>
                  <input 
                    type="number" 
                    value={editProduct.tax}
                    onChange={e => setEditProduct(prev => ({ ...prev, tax: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discount (₹)</label>
                  <input 
                    type="number" 
                    value={editProduct.discount}
                    onChange={e => setEditProduct(prev => ({ ...prev, discount: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fulfillment Warehouse</label>
                  <select 
                    value={editProduct.warehouse}
                    onChange={e => setEditProduct(prev => ({ ...prev, warehouse: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none font-semibold"
                  >
                    <option>Chicago</option>
                    <option>Berlin</option>
                    <option>Singapore</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Platforms *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    {['Amazon', 'Flipkart', 'Meesho', 'Shopify', 'WooCommerce', 'Myntra', 'Ajio', 'Warehouse'].map(p => {
                      const isSelected = editProduct.platforms?.includes(p);
                      return (
                        <label key={p} className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-250 dark:border-indigo-900/50 text-indigo-655 dark:text-indigo-400' 
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-850'
                        }`}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {
                              const updated = isSelected 
                                ? editProduct.platforms?.filter(x => x !== p) 
                                : [...(editProduct.platforms || []), p];
                              setEditProduct(prev => ({ ...prev, platforms: updated }));
                            }}
                            className="accent-indigo-600 rounded animate-none"
                          />
                          {p}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
                  <textarea 
                    value={editProduct.description}
                    onChange={e => setEditProduct(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notes</label>
                  <textarea 
                    value={editProduct.notes}
                    onChange={e => setEditProduct(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl py-2 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-855 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl py-2 text-xs font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
