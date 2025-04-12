import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function AvailableJobs() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bidAmount, setBidAmount] = useState({});

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/jobs/available', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setJobs(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch available jobs');
      }
    };
    fetchJobs();
  }, [token]);

  const handleBid = async (jobId) => {
    try {
      const amount = bidAmount[jobId];
      if (!amount || amount <= 0) {
        setError('Please enter a valid bid amount');
        return;
      }

      await axios.post(
        'http://localhost:5000/api/jobs/bid',
        { job_id: jobId, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Bid placed successfully!');
      setBidAmount({ ...bidAmount, [jobId]: '' });
      // Refresh the job list
      const response = await axios.get('http://localhost:5000/api/jobs/available', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place bid');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-dark-green">Available Jobs</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      {jobs.length === 0 ? (
        <p className="text-gray-500">No available jobs at the moment.</p>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="border p-4 rounded-lg">
              <h3 className="text-lg font-semibold">{job.title}</h3>
              <p className="text-gray-600">{job.description}</p>
              <p className="text-sm text-gray-500">Posted On: {new Date(job.created_at).toLocaleDateString()}</p>
              <p className="text-sm text-gray-500">Client: {job.client.name} ({job.client.email})</p>
              <div className="mt-4 flex space-x-2">
                <input
                  type="number"
                  placeholder="Enter bid amount ($)"
                  value={bidAmount[job.id] || ''}
                  onChange={(e) => setBidAmount({ ...bidAmount, [job.id]: e.target.value })}
                  className="p-2 rounded bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-green"
                />
                <button
                  onClick={() => handleBid(job.id)}
                  className="bg-lime-green text-white px-4 py-2 rounded-lg hover:bg-green-500 transition"
                >
                  Place Bid
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AvailableJobs;