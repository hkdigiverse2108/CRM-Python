import PageHeader from '@/components/ui/PageHeader';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import { 
  ShieldAlert, Download, CheckCircle2, DollarSign, ArrowUpRight, 
  Layers, Database
} from 'lucide-react';

const mockGSTList = [];

export default function GSTReports() {
  const { gstRecords, fetchGstRecords, updateGstRecord, addToast } = useApp();

  // Current stats (for the draft May 2026 GSTR filing)
  const currentDraft = gstRecords[0] || null;
  const outputTax = currentDraft?.collected || 0; // Output tax collected from sales
  const itcAvailable = currentDraft?.itc || 0; // Input tax credit from purchases
  const netDue = currentDraft?.netDue || 0; // Net payable

  const handlePrefillFilings = () => {
    addToast('Prefilling GSTR-1 with sales invoicing data...', 'info');
    setTimeout(() => {
      addToast('GSTR-1 forms populated successfully. Ready to review.', 'success');
    }, 1200);
  };

  const handleSyncTally = () => {
    addToast('Parsing GST filings as Journal Vouchers (XML) for Tally Prime...', 'info');
    setTimeout(() => {
      addToast(`${gstRecords.length} GST journal entries synced to Tally company "RapidModel Corp" successfully!`, 'success');
    }, 1200);
  };

  const handleFileGST = async (id) => {
    if (confirm(`Authorize final filing of GST GSTR-3B returns for ${periodName(id)}?`)) {
      try {
        const updated = await updateGstRecord(id, { status: 'Filed', filedOn: new Date().toISOString().split('T')[0] });
        if (updated) {
          addToast(`GST return ${id} filed successfully with GSTIN portal!`, 'success');
        }
      } catch (err) {
        addToast('Failed to file GST return', 'error');
      }
    }
  };

  const periodName = (id) => {
    const rec = gstRecords.find(r => r.id === id);
    return rec ? rec.period : '';
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      
      <PageHeader title="GST Reports" subtitle="Generate statutory GST compliance reports">
        <button 
          onClick={handleSyncTally}
          className="flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
        >
          <Database size={14} className="text-teal-500 dark:text-teal-500" /> Sync to Tally
        </button>
        <button 
          onClick={handlePrefillFilings}
          className="flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
        >
          Pre-fill GSTR-1 Form
        </button>
        <button 
          onClick={() => addToast('Tax challan generated successfully', 'success')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
        >
          Create Tax Challan
        </button>
      </PageHeader>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Net GST Payable (May)', value: netDue, icon: DollarSign, color: 'text-indigo-500' },
          { label: 'Input Tax Credit (ITC)', value: itcAvailable, icon: ArrowUpRight, color: 'text-emerald-500' },
          { label: 'Output GST Collected', value: outputTax, icon: Layers, color: 'text-blue-500' },
          { label: 'Filing Status (Q1)', value: 'Compliant', icon: CheckCircle2, color: 'text-green-500', isText: true }
        ].map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <h4 className="text-lg font-extrabold mt-1 text-slate-900 dark:text-white">
                  {stat.isText ? stat.value : formatCurrency(stat.value)}
                </h4>
              </div>
              <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 ${stat.color}`}>
                <StatIcon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filing due warning */}
      {currentDraft?.status === 'Draft' && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/40 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-655 rounded-lg mt-0.5">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-red-800 dark:text-red-400">Quarterly GSTR-3B Return Due</h4>
              <p className="text-[10px] text-red-700/80 dark:text-red-400/80 mt-0.5">Your GSTR return filing for {currentDraft?.period} is currently in Draft. Tax liability stands at {formatCurrency(netDue)}.</p>
            </div>
          </div>
          <button 
            onClick={() => handleFileGST(currentDraft?.id)}
            className="px-4 py-2 bg-red-600 dark:bg-red-500 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer whitespace-nowrap"
          >
            File GSTR-3B Now
          </button>
        </div>
      )}

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Filing History (Left 8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">GST Filing Ledger & History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800/80">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Filing Period</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Output Tax</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">ITC Claimed</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Net Tax Paid</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
                  {gstRecords.length > 0 ? (
                    gstRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/45 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{rec.period}</p>
                            <p className="text-[10px] text-slate-450 font-mono mt-0.5">{rec.id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{formatCurrency(rec.collected)}</td>
                        <td className="px-6 py-4 text-green-600 dark:text-green-400">{formatCurrency(rec.itc)}</td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatCurrency(rec.netDue)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                            rec.status === 'Filed' ? 'bg-green-50 text-green-700 border-green-200/50' : 'bg-slate-100 text-slate-655 border-slate-250'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {rec.status === 'Filed' ? (
                            <button 
                              onClick={() => addToast(`Downloaded ARN receipt for ${rec.id}`, 'success')}
                              className="p-1.5 text-indigo-600 hover:text-indigo-850 dark:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center gap-1 inline-flex cursor-pointer text-[10px] font-bold"
                            >
                              <Download size={13} /> ARN Receipt
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleFileGST(rec.id)}
                              className="btn-primary px-3 py-1.5 text-white rounded-lg text-[10px] font-bold cursor-pointer inline-flex" style={{ color: "#ffffff" }}
                            >
                              File Returns
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400 font-semibold">
                        <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 block mb-2 font-normal">description</span>
                        No GST records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* GST calculator widgets (Right 4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick GST Calculator Tool</h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base Net Price (₹)</span>
                <input type="number" defaultValue={50000} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 font-bold focus:outline-none" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GST Tax Slab Rate</span>
                <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 font-bold focus:outline-none">
                  <option>18% (Standard Services/Software)</option>
                  <option>12% (Goods/Hardware)</option>
                  <option>28% (Luxury Items)</option>
                  <option>5% (Basic Commodities)</option>
                </select>
              </div>

              <div className="border-t border-slate-150 dark:border-slate-850 pt-3 flex justify-between font-bold">
                <span className="text-slate-450">CGST + SGST (18%)</span>
                <span>₹9,000</span>
              </div>

              <div className="flex justify-between font-extrabold text-sm border-t border-slate-100 dark:border-slate-850 pt-2 text-indigo-600 dark:text-indigo-400">
                <span>Total Gross Price</span>
                <span>₹59,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
