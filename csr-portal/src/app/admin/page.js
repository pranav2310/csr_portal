'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PROPOSAL_TYPES = ['FLAGSHIP', 'BOUNDARY', 'WC_CORP', 'WC_OTHER'];

  const fetchProposals = async () => {
    try {
      const API_URL = "https://csr-portal-one.vercel.app"
      // const API_URL = 'http://127.0.0.1:8000';
      const response = await fetch(`${API_URL}/api/proposals`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setProposals(data);
    } catch (err) {
      setError('Could not load proposals. Is the Python server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString || isoString.includes('1970')) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleDownload = (type) => {
    const API_URL = process.env.BACKEND_API || 'http://127.0.0.1:8000';
    window.open(process.env.BACKEND_API ||`${API_URL}/api/export-collation/${type}`, '_blank');
  };

  // --- REVIEW MODAL LOGIC ---
  const openReviewModal = (proposal) => {
    setSelectedProposal({
      ...proposal,
      rec_fy25_26: proposal.rec_fy25_26 || 0,
      rec_fy26_27: proposal.rec_fy26_27 || 0,
      rec_fy27_28: proposal.rec_fy27_28 || 0,
      adminRemarks: proposal.adminRemarks || '',
      status: proposal.status || 'Submitted'
    });
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setSelectedProposal(prev => ({
      ...prev,
      [name]: name.startsWith('rec_') ? (parseFloat(value) || 0) : value
    }));
  };

  const submitReview = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/proposals/${selectedProposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rec_fy25_26: selectedProposal.rec_fy25_26,
          rec_fy26_27: selectedProposal.rec_fy26_27,
          rec_fy27_28: selectedProposal.rec_fy27_28,
          adminRemarks: selectedProposal.adminRemarks,
          status: selectedProposal.status
        })
      });

      if (!response.ok) throw new Error("Failed to update proposal");
      
      // Refresh the table and close modal
      await fetchProposals();
      setSelectedProposal(null);
    } catch (err) {
      alert("Error saving review: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center font-bold text-xl text-gray-600 bg-gray-50">Loading Admin Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex justify-between items-center mb-10 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800">Collation Dashboard</h1>
            <p className="text-gray-500 mt-2 text-lg">Manage and export classified CSR proposals</p>
          </div>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-bold shadow-sm">
            ← Back to Submit Form
          </button>
        </header>

        {error && <div className="p-4 mb-6 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium">{error}</div>}

        <div className="space-y-12">
          {PROPOSAL_TYPES.map((type) => {
            const typeProposals = proposals.filter(p => p.proposalType === type);
            
            return (
              <section key={type} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-100 p-6 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">{type.replace('_', ' ')}</h2>
                    <span className="bg-blue-200 text-blue-800 text-xs font-black px-3 py-1 rounded-full">{typeProposals.length} Items</span>
                  </div>
                  <button onClick={() => handleDownload(type)} className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-green-700 transition">
                    Export {type} Excel
                  </button>
                </div>

                {typeProposals.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 italic">No proposals found for this category.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white text-gray-500 text-sm uppercase tracking-wider border-b">
                          <th className="p-4 font-bold">Date</th>
                          <th className="p-4 font-bold">Project Name</th>
                          <th className="p-4 font-bold">CSR No.</th>
                          <th className="p-4 font-bold text-right">Proposed</th>
                          <th className="p-4 font-bold text-center">Status</th>
                          <th className="p-4 font-bold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {typeProposals.map((prop) => (
                          <tr key={prop.id} className="hover:bg-gray-50 transition">
                            <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(prop.createdAt)}</td>
                            <td className="p-4 font-semibold text-gray-900">{prop.projectName}</td>
                            <td className="p-4 font-mono text-sm text-blue-600">{prop.csr_no}</td>
                            <td className="p-4 text-right font-bold text-gray-800">₹{prop.proposedTotal?.toFixed(2)} L</td>
                            <td className="p-4 text-center">
                              <span className={`text-xs font-bold px-3 py-1 rounded-full 
                                ${prop.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' : 
                                  prop.status === 'Forwarded to Next Stage' ? 'bg-blue-100 text-blue-800' : 
                                  'bg-green-100 text-green-800'}`}>
                                {prop.status || 'Submitted'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button onClick={() => openReviewModal(prop)} className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded hover:bg-gray-700 transition">
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>

      </div>

      {/* --- REVIEW MODAL UI --- */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="bg-gray-900 p-5 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Admin Review: {selectedProposal.projectName}</h3>
              <button onClick={() => setSelectedProposal(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Proposed Reference Box */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm">
                <span className="font-bold text-blue-800 block mb-2">Original Proposal Request:</span>
                <div className="flex gap-4 text-blue-900">
                  <span>FY 25-26: ₹{selectedProposal.fy25_26}L</span>
                  <span>FY 26-27: ₹{selectedProposal.fy26_27}L</span>
                  <span>FY 27-28: ₹{selectedProposal.fy27_28}L</span>
                  <span className="font-bold ml-auto">TOTAL: ₹{selectedProposal.proposedTotal}L</span>
                </div>
              </div>

              {/* Input: Recommendations */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Recommended Amounts (Rs. in Lakhs)</label>
                <div className="grid grid-cols-3 gap-4">
                  <input type="number" name="rec_fy25_26" value={selectedProposal.rec_fy25_26} onChange={handleModalChange} placeholder="FY 25-26" className="w-full p-2 border rounded" />
                  <input type="number" name="rec_fy26_27" value={selectedProposal.rec_fy26_27} onChange={handleModalChange} placeholder="FY 26-27" className="w-full p-2 border rounded" />
                  <input type="number" name="rec_fy27_28" value={selectedProposal.rec_fy27_28} onChange={handleModalChange} placeholder="FY 27-28" className="w-full p-2 border rounded" />
                </div>
              </div>

              {/* Input: Status & Remarks */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Update Status</label>
                  <select name="status" value={selectedProposal.status} onChange={handleModalChange} className="w-full p-2 border rounded bg-white">
                    <option value="Submitted">Submitted (Under Review)</option>
                    <option value="Forwarded to Next Stage">Forwarded to Next Stage</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Admin Remarks</label>
                  <textarea name="adminRemarks" value={selectedProposal.adminRemarks} onChange={handleModalChange} rows="2" className="w-full p-2 border rounded" placeholder="Internal notes..."></textarea>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button onClick={() => setSelectedProposal(null)} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded">Cancel</button>
                <button onClick={submitReview} disabled={isSubmitting} className="px-5 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">
                  {isSubmitting ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}