import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function AssignedJobs() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/jobs/assigned', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setJobs(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch assigned jobs');
      }
    };
    fetchJobs();
  }, [token]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-dark-green">Assigned Jobs</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {jobs.length === 0 ? (
        <p className="text-gray-500">No assigned jobs at the moment.</p>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="border p-4 rounded-lg">
              <h3 className="text-lg font-semibold">{job.title}</h3>
              <p className="text-gray-600">{job.description}</p>
              <p className="text-sm text-gray-500">Assigned On: {new Date(job.updated_at).toLocaleDateString()}</p>
              <p className="text-sm text-gray-500">Client: {job.client.name} ({job.client.email})</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AssignedJobs;