import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

function AvailableJobs() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biddingJob, setBiddingJob] = useState(null);
  const [bidAmount, setBidAmount] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:5000/api/jobs/available', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch available jobs');
      toast.error(err.response?.data?.error || 'Failed to fetch available jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Optional: Poll for updates every 30 seconds to avoid stale jobs
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleBidClick = (job) => {
    setBiddingJob(job);
    setBidAmount('');
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();

    if (!bidAmount || Number(bidAmount) <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    try {
      await axios.post(
        'http://localhost:5000/api/jobs/bid',
        { job_id: biddingJob.id, amount: parseFloat(bidAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== biddingJob.id));
      setBiddingJob(null);
      setBidAmount('');
      toast.success('Bid placed successfully! Awaiting admin approval.');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to place bid';
      toast.error(errorMsg);
      if (errorMsg.includes('Job not found') || errorMsg.includes('Invalid job ID')) {
        // Refresh jobs if the job is no longer valid
        fetchJobs();
      }
    }
  };

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
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold mb-10 text-dark-green text-center">Available Jobs</h2>

      {error && (
        <p className="text-red-600 mb-8 text-center font-medium text-lg">{error}</p>
      )}

      {loading ? (
        <p className="text-gray-600 text-center text-lg">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-gray-600 text-center text-lg">No available jobs at the moment.</p>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="relative bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-4 right-4 bg-lime-green text-white text-sm font-semibold px-3 py-1 rounded-full shadow-sm">
                ${parseFloat(job.admin_bid_amount).toFixed(2)}
              </div>
              <h3 className="text-xl font-bold text-dark-green mb-3 pr-20 truncate">{job.title}</h3>
              <p className="text-sm text-gray-500 mb-2">
                <span className="font-medium">Posted:</span>{' '}
                {new Date(job.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                <span className="font-medium">Due:</span>{' '}
                {job.expected_return_date
                  ? new Date(job.expected_return_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Not set'}
              </p>
              <p className="text-gray-600 mb-4 line-clamp-3 min-h-[4.5rem] text-sm">{job.description}</p>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {job.pdf_url ? (
                    <span className="text-dark-green flex items-center">
                      <svg
                        className="w-4 h-4 mr-1 text-lime-green"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M7 9a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z"></path>
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5z"></path>
                      </svg>
                      PDF Available
                    </span>
                  ) : (
                    <span className="text-gray-500 italic">No PDF Available</span>
                  )}
                </p>
                {job.pdf_url && (
                  <button
                    onClick={() => handleDownloadPDF(job.pdf_url, job.title)}
                    className="inline-flex items-center px-4 py-2 bg-dark-green text-white text-sm font-medium rounded-md hover:bg-lime-green transition-colors duration-200 shadow-sm"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      ></path>
                    </svg>
                    Download
                  </button>
                )}
              </div>
              <button
                onClick={() => handleBidClick(job)}
                className="w-full bg-dark-green text-white py-2 rounded-md hover:bg-lime-green transition-colors duration-200 font-medium text-sm shadow-sm"
              >
                Place Bid
              </button>
            </div>
          ))}
        </div>
      )}

      {biddingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-dark-green">Place Your Bid</h3>
            <form onSubmit={handleBidSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <p className="mt-1 p-2 w-full border rounded-md bg-gray-100 text-gray-600">{biddingJob.title}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Reference Bid Amount ($)</label>
                <p className="mt-1 p-2 w-full border rounded-md bg-gray-100 text-gray-600">
                  ${parseFloat(biddingJob.admin_bid_amount).toFixed(2)}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Your Bid Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
                  required
                  min="0.01"
                  placeholder="Enter your bid (e.g., 100.50)"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setBiddingJob(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-dark-green text-white rounded-md hover:bg-lime-green font-medium"
                >
                  Submit Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvailableJobs;