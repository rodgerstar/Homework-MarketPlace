import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

function CompletedJobs() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('http://localhost:5000/api/jobs/writer/completed', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Completed jobs response:', response.data); // Debug log
        setJobs(response.data);
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Failed to fetch completed jobs';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [token]);

  const handleDownloadFile = async (fileUrl, description, fileExtension) => {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const extension = fileExtension || 'file';
      const sanitizedDescription = description.slice(0, 20).replace(/\s+/g, '_');
      link.setAttribute('download', `${sanitizedDescription}.${extension}`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download file. The link may have expired.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-10xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-dark-green">Completed Jobs</h2>

      {error && (
        <p className="text-red-500 mb-4 text-center" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border p-4 rounded-lg">
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-gray-500 text-center">No completed jobs yet.</p>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="border p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-dark-green">{job.description.slice(0, 50)}</h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">{job.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Completed On:{' '}
                    {job.updated_at
                      ? new Date(job.updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Client: {job.client?.name} ({job.client?.email})
                  </p>
                  <p className="text-sm text-gray-500">
                    Your Earnings: ${job.writer_share ? parseFloat(job.writer_share).toFixed(2) : 'N/A'}
                  </p>
                </div>
                <div className="text-sm">
                  {job.file_url ? (
                    <button
                      onClick={() => handleDownloadFile(job.file_url, job.description, job.file_extension)}
                      className="text-lime-green hover:text-lime-700 transition-colors"
                      aria-label={`Download file for ${job.description?.slice(0, 20) || 'document'}`}
                      title="Download File"
                    >
                      <svg
                        className="w-5 h-5"
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
                    </button>
                  ) : (
                    <span className="text-gray-500 italic" aria-label="No file available">
                      No File
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CompletedJobs;