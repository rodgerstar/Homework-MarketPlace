import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

function PostedJobs() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('http://localhost:5000/api/jobs/posted', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setJobs(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch posted jobs');
        toast.error(err.response?.data?.error || 'Failed to fetch posted jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [token]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-dark-green">My Posted Jobs</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-gray-500">You haven't posted any jobs yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-dark-green text-white">
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Title</th>
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Description</th>
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Status</th>
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Your Bid ($)</th>
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Admin Bid ($)</th>
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Posted On</th>
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">Due Date</th>
                <th className="border border-gray-200 p-3 text-left text-sm font-semibold">PDF</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-gray-200 p-3 text-sm font-medium text-dark-green">{job.title}</td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-600">
                    {job.description.length > 100 ? `${job.description.substring(0, 100)}...` : job.description}
                  </td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-500">{job.status}</td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-500">{job.client_bid_amount}</td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-500">
                    {job.admin_bid_amount || 'Not set'}
                  </td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-500">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-500">
                    {job.expected_return_date
                      ? new Date(job.expected_return_date).toLocaleDateString()
                      : 'Not set'}
                  </td>
                  <td className="border border-gray-200 p-3 text-sm">
                    {job.pdf_url ? (
                      <a
                        href={job.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lime-green hover:underline"
                      >
                        View PDF
                      </a>
                    ) : (
                      <span className="text-gray-500">No PDF</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PostedJobs;