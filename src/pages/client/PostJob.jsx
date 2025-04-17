import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function PostJob() {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null, // Add file to formData to handle PDF
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    if (e.target.name === 'file') {
      setFormData({ ...formData, file: e.target.files[0] }); // Handle file input
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value }); // Handle text inputs
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Create a FormData object to handle file uploads
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    if (formData.file) {
      data.append('file', formData.file); // Append the PDF file
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/jobs/post',
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data', // Required for file uploads
          },
        }
      );
      setSuccess('Job posted successfully!');
      toast.success('Job posted successfully!', { autoClose: 3000 });
      setFormData({ title: '', description: '', file: null }); // Reset form
      // Reset the file input field
      e.target.querySelector('input[type="file"]').value = null;
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      toast.error(err.response?.data?.error || 'Something went wrong', { autoClose: 3000 });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-dark-green">Post a Job</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">Job Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-green"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-green"
            rows="4"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">Upload PDF (Optional)</label>
          <input
            type="file"
            name="file"
            accept="application/pdf" // Restrict to PDF files
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-green"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-lime-green text-white py-2 rounded-lg hover:bg-green-500 transition"
        >
          Post Job
        </button>
      </form>
    </div>
  );
}

export default PostJob;