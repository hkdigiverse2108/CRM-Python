import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import { 
  FileText, Upload, Calendar, Search, Plus, 
  Download, Check, X, AlertCircle, FileSpreadsheet,
  ChevronLeft, ChevronRight, UserCheck
} from 'lucide-react';

export default function Documents() {
  const {
    employees,
    flatDocs = [],
    letterRequests = [],
    createLetterRequest,
    updateLetterRequestStatus,
    uploadDocument,
    user,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('submitted'); // 'submitted', 'requests'
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  
  // Request Modal state
  const [newRequest, setNewRequest] = useState({
    employeeId: user?.employee_id || employees[0]?.id || '',
    letterType: 'Offer Letter',
    reason: ''
  });

  const letterTypes = [
    'Offer Letter',
    'Appointment Letter',
    'Employee Document Submission',
    'Working Bond Letter',
    'Employment Agreement',
    'Non Disclosure Agreement',
    'Notice Period Initiation Letter',
    'Notice Period Acceptance Letter',
    'Relieving Letter',
    'Experience Letter',
    'Full & Final Settlement Letter',
    'Bond Complete Letter'
  ];

  // Submitted documents list
  const filteredSubmissions = useMemo(() => {
    return flatDocs.filter(d => {
      const matchSearch = (d.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.type || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [flatDocs, searchQuery]);

  // Letter requests list
  const filteredRequests = useMemo(() => {
    return letterRequests.filter(r => {
      const matchSearch = (r.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.letterType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.reason || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [letterRequests, searchQuery]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newRequest.employeeId || !newRequest.reason.trim()) {
      addToast('Please fill in all details.', 'warning');
      return;
    }
    const success = await createLetterRequest({
      employeeId: newRequest.employeeId,
      letterType: newRequest.letterType,
      reason: newRequest.reason
    });
    if (success) {
      setShowRequestModal(false);
      setNewRequest(prev => ({ ...prev, reason: '' }));
    }
  };

  const handleAction = async (requestId, status, actionText) => {
    await updateLetterRequestStatus(requestId, status, actionText);
  };

  // Status badging rules for Submitted Documents
  const renderDocumentStatus = (docName, docType) => {
    if (docType === 'Security Deposit') {
      return (
        <span className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 text-[10px] font-extrabold uppercase tracking-wide">
          COLLECTED: ₹0 / ₹2,000
        </span>
      );
    }
    
    // Default Accepted for demo documents matching user screens
    return (
      <span className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 text-[10px] font-extrabold uppercase tracking-wide">
        ACCEPTED
      </span>
    );
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      <div className="flex justify-between items-start">
        <PageHeader 
          title="Employee Documents" 
          subtitle="Manage submitted employee records and request official company letters." 
        />
        {activeTab === 'requests' && (
          <button 
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus size={15} /> Request New Letter
          </button>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80 gap-1 mt-2">
        <button
          onClick={() => { setActiveTab('submitted'); setSearchQuery(''); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'submitted'
              ? 'border-emerald-600 text-emerald-750 font-extrabold'
              : 'border-transparent text-slate-450 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Submitted Documents
        </button>
        <button
          onClick={() => { setActiveTab('requests'); setSearchQuery(''); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'border-emerald-600 text-emerald-750 font-extrabold'
              : 'border-transparent text-slate-450 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Official Letters & Requests
        </button>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search document or employee name..."
            className="w-full bg-card border border-border rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {activeTab === 'submitted' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted dark:bg-slate-800/40 text-muted-foreground font-bold border-b border-border/80 text-[10px] uppercase tracking-wider">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Document Name</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-semibold text-slate-700 dark:text-slate-200">
                {filteredSubmissions.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{doc.employeeName}</td>
                    <td className="px-6 py-4">{doc.name}</td>
                    <td className="px-6 py-4 text-muted-foreground flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      {doc.uploadDate ? formatDate(doc.uploadDate) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {renderDocumentStatus(doc.name, doc.type)}
                    </td>
                  </tr>
                ))}
                {filteredSubmissions.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-muted-foreground font-medium">
                      No documents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted dark:bg-slate-800/40 text-muted-foreground font-bold border-b border-border/80 text-[10px] uppercase tracking-wider">
                  <th className="px-6 py-4">Letter Type</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Requested Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-semibold text-slate-700 dark:text-slate-200">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{req.letterType}</td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate" title={req.reason}>{req.reason}</td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(req.requestedDate)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                        req.status === 'ACCEPTED' ? 'bg-success/15 text-success border-success/30' :
                        req.status === 'REJECTED' ? 'bg-danger/10 text-danger border-danger/20' :
                        'bg-amber-400/10 text-amber-600 border-amber-400/20'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAction(req.id, 'ACCEPTED', 'Accepted by Admin')}
                            className="w-7 h-7 rounded bg-success/15 text-success flex items-center justify-center hover:bg-success/25 transition-colors cursor-pointer"
                            title="Accept Request"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'REJECTED', 'Rejected by Admin')}
                            className="w-7 h-7 rounded bg-danger/15 text-danger flex items-center justify-center hover:bg-danger/25 transition-colors cursor-pointer"
                            title="Reject Request"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase italic">
                          {req.actionsTaken}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-muted-foreground font-medium">
                      No letter requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* REQUEST LETTER MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setShowRequestModal(false)} 
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="border-b border-border pb-2.5">
              <h3 className="text-sm font-bold text-foreground">Request Official Letter</h3>
            </div>
            
            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label>Select Employee</label>
                <select
                  value={newRequest.employeeId}
                  onChange={e => setNewRequest(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="bg-card border border-border w-full p-2.5 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label>Letter Type</label>
                <select
                  value={newRequest.letterType}
                  onChange={e => setNewRequest(prev => ({ ...prev, letterType: e.target.value }))}
                  className="bg-card border border-border w-full p-2.5 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  {letterTypes.map((type, idx) => (
                    <option key={idx} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label>Reason / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. For bank loan, higher education, etc."
                  value={newRequest.reason}
                  onChange={e => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-card border border-border rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-border text-muted-foreground hover:bg-muted font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
