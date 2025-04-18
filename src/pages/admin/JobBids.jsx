import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

function JobBids() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('http://localhost:5000/api/jobs/available', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const jobIds = response.data.map((job) => job.id);

        const jobsWithBids = await Promise.all(
          jobIds.map(async (jobId) => {
            const jobResponse = await axios.get(`http://localhost:5000/api/superadmin/jobs/${jobId}/bids`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return jobResponse.data;
          })
        );
        setJobs(jobsWithBids.filter((job) => job.bids.length > 0));
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch jobs with bids');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [token]);

  const handleAssignWriter = async (bidId) => {
    if (!window.confirm('Are you sure you want to assign this writer?')) return;

    try {
      const response = await axios.patch(
        `http://localhost:5000/api/superadmin/bids/${bidId}/assign`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== response.data.job.id));
      toast.success('Writer assigned successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign writer');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-dark-green">Jobs with Pending Bids</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-gray-500">No jobs with pending bids.</p>
      ) : (
        jobs.map((job) => (
          <div key={job.id} className="mb-6 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold text-dark-green">{job.title}</h3>
            <p className="text-gray-600">{job.description}</p>
            <p className="text-gray-500">Client: {job.client.name} ({job.client.email})</p>
            <p className="text-gray-500">Client Budget: ${job.client_bid_amount}</p>
            <p className="text-gray-500">Admin Bid: ${job.admin_bid_amount}</p>
            {job.pdf_url && (
              <p>
                <a href={job.pdf_url} target="_blank" rel="noopener noreferrer" className="text-lime-green hover:underline">
                  View PDF
                </a>
              </p>
            )}
            <h4 className="text-md font-semibold mt-4">Bids</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-dark-green text-white">
                    <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Writer</th>
                    <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Bid Amount ($)</th>
                    <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Status</th>
                    <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {job.bids.map((bid) => (
                    <tr key={bid.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="border border-gray-200 p-3 text-sm">{bid.writer.name} ({bid.writer.email})</td>
                      <td className="border border-gray-200 p-3 text-sm">{bid.amount}</td>
                      <td className="border border-gray-200 p-3 text-sm capitalize">{bid.status}</td>
                      <td className="border border-gray-200 p-3 text-sm">
                        {bid.status === 'pending' && (
                          <button
                            onClick={() => handleAssignWriter(bid.id)}
                            className="text-blue-500 hover:underline"
                          >
                            Assign Writer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default JobBids;