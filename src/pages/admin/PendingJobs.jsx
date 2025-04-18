import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

function PendingJobs() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [approvingJob, setApprovingJob] = useState(null);
  const [adminBidAmount, setAdminBidAmount] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('http://localhost:5000/api/superadmin/jobs/pending', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setJobs(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch pending jobs');
        toast.error(err.response?.data?.error || 'Failed to fetch pending jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [token]);

  const handleApproveClick = (job) => {
    setApprovingJob(job);
    setAdminBidAmount('');
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/superadmin/jobs/${approvingJob.id}/approve`,
        { admin_bid_amount: parseFloat(adminBidAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== approvingJob.id));
      setApprovingJob(null);
      toast.success('Job approved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve job');
    }
  };

  const handleCancelJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to cancel this job?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/superadmin/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
      toast.success('Job cancelled successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel job');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-dark-green">Pending Jobs for Approval</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-gray-500">No pending jobs.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-dark-green text-white">
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Title</th>
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Description</th>
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Client</th>
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Client Budget ($)</th>
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Posted On</th>
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">PDF</th>
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-200 p-3 text-sm font-medium text-dark-green">{job.title}</td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-600">
                    {job.description.length > 100 ? `${job.description.substring(0, 100)}...` : job.description}
                  </td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-500">{job.client.name} ({job.client.email})</td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-500">{job.client_bid_amount}</td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-500">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-200 p-3 text-sm">
                    {job.pdf_url ? (
                      <a href={job.pdf_url} target="_blank" rel="noopener noreferrer" className="text-lime-green hover:underline">
                        View PDF
                      </a>
                    ) : (
                      <span className="text-gray-500">No PDF</span>
                    )}
                  </td>
                  <td className="border border-gray-200 p-3 text-sm">
                    <button
                      onClick={() => handleApproveClick(job)}
                      className="text-blue-500 hover:underline mr-2"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleCancelJob(job.id)}
                      className="text-red-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {approvingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-dark-green">Approve Job and Set Bid Amount</h3>
            <form onSubmit={handleApproveSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <p className="mt-1 p-2 w-full border rounded-md bg-gray-100">{approvingJob.title}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Client Budget ($)</label>
                <p className="mt-1 p-2 w-full border rounded-md bg-gray-100">{approvingJob.client_bid_amount}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Set Bid Amount for Writers ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={adminBidAmount}
                  onChange={(e) => setAdminBidAmount(e.target.value)}
                  className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
                  required
                  min="0.01"
                  placeholder="Enter amount (e.g., 100.50)"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setApprovingJob(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-dark-green text-white rounded-md hover:bg-lime-green"
                >
                  Approve and Set Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingJobs;