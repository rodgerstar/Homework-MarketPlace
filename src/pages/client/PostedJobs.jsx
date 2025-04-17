import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function PostedJobs() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true); // Set loading to true while fetching
      setError(''); // Reset error state
      try {
        const response = await axios.get('http://localhost:5000/api/jobs/posted', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setJobs(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch posted jobs');
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };
    fetchJobs();
  }, [token]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-dark-green">Posted Jobs</h2>

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Loading State */}
      {loading ? (
        <p className="text-gray-500">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-gray-500">No jobs posted yet.</p>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="border p-4 rounded-lg hover:shadow-lg transition-shadow duration-200"
            >
              <h3 className="text-lg font-semibold text-dark-green">{job.title}</h3>
              <p className="text-gray-600 mt-1">{job.description}</p>
              <div className="mt-2 text-sm text-gray-500 space-y-1">
                <p>Posted On: {new Date(job.created_at).toLocaleDateString()}</p>
                <p>Status: <span className="capitalize font-medium">{job.status}</span></p>
                {/* Display PDF link if available */}
                {job.pdf_url ? (
                  <p>
                    <a
                      href={job.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lime-green hover:underline"
                    >
                      View Job PDF
                    </a>
                  </p>
                ) : (
                  <p>No PDF attached</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PostedJobs;