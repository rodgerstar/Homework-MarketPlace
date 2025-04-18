import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

function JobBids() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigningBidId, setAssigningBidId] = useState(null);

  // Fetch jobs with pending bids
  const fetchJobsWithBids = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:5000/api/superadmin/jobs/with-bids', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Jobs with pending bids response:', response.data); // Debug log
      setJobs(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch jobs with bids';
      console.error('Fetch error:', err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial fetch and polling
  useEffect(() => {
    fetchJobsWithBids();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchJobsWithBids();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchJobsWithBids]);

  // Assign writer to a bid
  const handleAssignWriter = async (bidId, jobId, writerName) => {
    if (
      !window.confirm(
        `Are you sure you want to assign ${writerName || 'this writer'} to this job? This will start the job.`
      )
    )
      return;

    setAssigningBidId(bidId);
    try {
      await axios.patch(
        `http://localhost:5000/api/superadmin/bids/${bidId}/assign`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
      toast.success('Writer assigned successfully! Job started.');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to assign writer';
      toast.error(errorMsg);
      if (
        errorMsg.includes('Bid not found') ||
        errorMsg.includes('Only pending bids') ||
        errorMsg.includes('Invalid token')
      ) {
        fetchJobsWithBids();
      }
    } finally {
      setAssigningBidId(null);
    }
  };

  // Download PDF
  const handleDownloadPDF = async (pdfUrl, title) => {
    try {
      const response = await axios.get(pdfUrl, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download PDF. The link may have expired.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-dark-green">Jobs with Pending Bids</h2>

      {error && (
        <p className="text-red-500 mb-4 text-center" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-4 border rounded-lg animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-gray-500 text-center">No jobs with pending bids.</p>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-4 border rounded-lg bg-gray-50"
              role="region"
              aria-labelledby={`job-${job.id}-title`}
            >
              <h3 id={`job-${job.id}-title`} className="text-lg font-semibold text-dark-green mb-2">
                {job.title || 'Untitled Job'}
              </h3>
              <p className="text-gray-600 mb-2 line-clamp-3">{job.description || 'No description'}</p>
              <p className="text-gray-500 mb-1">
                Client: {job.client?.name || 'Unknown'} ({job.client?.email || 'N/A'})
              </p>
              <p className="text-gray-500 mb-1">
                Client Budget: ${job.client_bid_amount ? parseFloat(job.client_bid_amount).toFixed(2) : 'N/A'}
              </p>
              <p className="text-gray-500 mb-1">
                Admin Bid: ${job.admin_bid_amount ? parseFloat(job.admin_bid_amount).toFixed(2) : 'Not set'}
              </p>
              <p className="text-gray-500 mb-1">
                Writer Due:{' '}
                {job.expected_return_date
                  ? new Date(job.expected_return_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Not set'}
              </p>
              {job.pdf_url ? (
                <button
                  onClick={() => handleDownloadPDF(job.pdf_url, job.title || 'document')}
                  className="text-lime-green hover:underline mb-2 inline-flex items-center text-sm"
                  aria-label={`Download PDF for ${job.title || 'document'}`}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    ></path>
                  </svg>
                  Download PDF
                </button>
              ) : (
                <p className="text-gray-500 italic mb-2 text-sm">No PDF Available</p>
              )}
              <h4 className="text-md font-semibold mt-4 mb-2">Bids</h4>
              {job.bids && job.bids.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-dark-green text-white">
                        <th className="border border-gray-200 p-3 text-left text-sm font-semibold">
                          Writer
                        </th>
                        <th className="border border-gray-200 p-3 text-left text-sm font-semibold">
                          Bid Amount ($)
                        </th>
                        <th className="border border-gray-200 p-3 text-left text-sm font-semibold">
                          Status
                        </th>
                        <th className="border border-gray-200 p-3 text-left text-sm font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {job.bids.map((bid) => (
                        <tr key={bid.id} className="hover:bg-gray-100 transition-colors duration-200">
                          <td className="border border-gray-200 p-3 text-sm">
                            {bid.writer?.name || 'Unknown'} ({bid.writer?.email || 'N/A'})
                          </td>
                          <td className="border border-gray-200 p-3 text-sm">
                            ${bid.amount ? parseFloat(bid.amount).toFixed(2) : 'N/A'}
                          </td>
                          <td className="border border-gray-200 p-3 text-sm capitalize">
                            {bid.status || 'N/A'}
                          </td>
                          <td className="border border-gray-200 p-3 text-sm">
                            {bid.status === 'pending' && (
                              <button
                                onClick={() =>
                                  handleAssignWriter(bid.id, job.id, bid.writer?.name)
                                }
                                className={`text-blue-500 hover:underline ${
                                  assigningBidId === bid.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                disabled={assigningBidId === bid.id}
                                aria-label={`Assign ${bid.writer?.name || 'writer'} to job ${job.title || 'job'}`}
                              >
                                {assigningBidId === bid.id ? 'Assigning...' : 'Assign Writer'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No pending bids for this job.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JobBids;