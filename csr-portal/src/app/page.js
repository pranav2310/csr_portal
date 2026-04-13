'use client'; 

import { useState } from 'react';
import { useRouter } from 'next/navigation'; 

export default function ProposalSubmission() {
  const router = useRouter();
  const [error, setError] = useState(''); 
  const [isSubmitted, setIsSubmitted] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store the initial empty state so we can easily reset it later
  const initialFormState = {
    projectName: '',
    implementingAgency: '',
    csr_no: '',
    proposalType: '',
    vipRefDate: '',
    vipRefDetails: '',
    workCentreName: '', 
    fy25_26: 0,
    fy26_27: 0,
    fy27_28: 0,
    remarks: '', 
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const proposedTotal = formData.fy25_26 + formData.fy26_27 + formData.fy27_28;

  const handleSubmit = async () => {
    setError(''); 
    if (!formData.projectName.trim()) { setError('Please enter a Project Name.'); return; }
    if (!formData.implementingAgency.trim()) { setError('Please enter the Implementing Agency.'); return; }
    if (!formData.csr_no.trim()) { setError('Please enter the CSR 1 Number.'); return; }
    if (!formData.proposalType) { setError('Please select a Proposal Type.'); return; }

    setIsSubmitting(true);
    try {
      const API_URL = process.env.BACKEND_API
      // const API_URL = 'http://127.0.0.1:8000'
      const response = await fetch(`${API_URL}/api/proposals/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          proposedTotal: proposedTotal,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to Submit proposal to server.');
      }
      
      const result = await response.json();
      console.log('Server Response:', result);
      setIsSubmitted(true);
    } catch(err) {
      console.error("Error submitting proposal:", err);
      setError('An error occurred while submitting your proposal. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setIsSubmitted(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100">
        
        {!isSubmitted ? (
          <>
            {/* UPDATED HEADER: Now includes the Admin Portal button */}
            <div className="mb-8 border-b pb-6 flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">CSR Portal</h2>
                <p className="text-gray-500 mt-1">New Proposal Submission</p>
              </div>
              <button 
                type="button"
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition shadow-sm"
              >
                Admin Portal →
              </button>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-10">
              
              {/* SECTION 1: BASIC INFO */}
              <section className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-700 border-b pb-2">1. Project Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                      placeholder="Enter project name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Implementing Agency <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="implementingAgency"
                      value={formData.implementingAgency}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                      placeholder="Enter agency name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CSR 1 No. <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="csr_no" 
                      value={formData.csr_no}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                      placeholder="Enter CSR number"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Type <span className="text-red-500">*</span></label>
                    <select
                      name="proposalType"
                      value={formData.proposalType}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                    >
                      <option value="">-- Select Type --</option>
                      <option value="FLAGSHIP">Flagship Proposals/Requests</option>
                      <option value="BOUNDARY">Boundary Management</option>
                      <option value="WC_CORP">Work Centre: Corporate Office</option>
                      <option value="WC_OTHER">Other Work Centre</option>
                    </select>
                  </div>
                </div>

                {/* DYNAMIC FIELD: Boundary Management */}
                {formData.proposalType === 'BOUNDARY' && (
                  <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 space-y-4 mt-4">
                    <h4 className="text-sm font-bold text-blue-800 tracking-wide uppercase">Boundary Management Info</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-blue-900 mb-1">VIP Reference Date</label>
                        <input
                          type="date"
                          name="vipRefDate"
                          value={formData.vipRefDate}
                          onChange={handleChange}
                          className="w-full p-3 border border-blue-200 rounded-lg outline-none text-gray-900 bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-blue-900 mb-1">VIP Reference Details</label>
                        <textarea
                          name="vipRefDetails"
                          value={formData.vipRefDetails}
                          onChange={handleChange}
                          rows="2"
                          className="w-full p-3 border border-blue-200 rounded-lg outline-none text-gray-900 bg-white"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}

                {/* NEW DYNAMIC FIELD: Other Work Centre */}
                {formData.proposalType === 'WC_OTHER' && (
                  <div className="bg-orange-50 p-5 rounded-lg border border-orange-100 space-y-4 mt-4">
                    <h4 className="text-sm font-bold text-orange-800 tracking-wide uppercase">Other Work Centre Info</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm text-orange-900 mb-1">Work Centre Name</label>
                        <input
                          type="text"
                          name="workCentreName"
                          value={formData.workCentreName}
                          onChange={handleChange}
                          className="w-full p-3 border border-orange-200 rounded-lg outline-none text-gray-900 bg-white"
                          placeholder="Enter Work Centre Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-orange-900 mb-1">VIP Reference</label>
                        <textarea
                          name="vipRefDetails"
                          value={formData.vipRefDetails}
                          onChange={handleChange}
                          rows="2"
                          className="w-full p-3 border border-orange-200 rounded-lg outline-none text-gray-900 bg-white"
                          placeholder="Enter VIP Reference Details"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* SECTION 2: FINANCIALS */}
              <section className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-700 border-b pb-2">2. Proposed Financials (Rs. in Lakhs)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FY 25-26</label>
                    <input type="number" name="fy25_26" value={formData.fy25_26 || ''} onChange={handleNumberChange} className="w-full p-3 border border-gray-300 rounded-lg text-right text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FY 26-27</label>
                    <input type="number" name="fy26_27" value={formData.fy26_27 || ''} onChange={handleNumberChange} className="w-full p-3 border border-gray-300 rounded-lg text-right text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FY 27-28</label>
                    <input type="number" name="fy27_28" value={formData.fy27_28 || ''} onChange={handleNumberChange} className="w-full p-3 border border-gray-300 rounded-lg text-right text-gray-900 bg-white" />
                  </div>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center mt-4">
                  <span className="font-semibold text-gray-700">Calculated Total:</span>
                  <span className="text-2xl font-bold text-blue-700">{proposedTotal.toFixed(2)} Lakhs</span>
                </div>
              </section>

              {/* SECTION 3: REMARKS */}
              <section className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-700 border-b pb-2">3. Additional Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                    placeholder="Enter any additional context here..."
                  ></textarea>
                </div>
              </section>

              {/* ERROR MESSAGE DISPLAY */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                  ⚠️ {error}
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <div className="pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`w-full py-4 text-white rounded-lg font-bold text-lg transition shadow-md ${
                    isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Final Proposal'}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* SUCCESS SCREEN */
          <div className="text-center py-10 space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-500 mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800">Proposal Submitted!</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Your proposal <strong>"{formData.projectName}"</strong> has been successfully submitted and is now pending administrative review.
            </p>
            
            <div className="pt-8">
              <button
                type="button"
                onClick={handleReset}
                className="px-8 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition"
              >
                Start New Proposal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}