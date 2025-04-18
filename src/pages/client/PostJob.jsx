import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

function PostJob() {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_bid_amount: '',
    expected_return_date: '',
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent multiple submissions

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Block multiple submissions
    setLoading(true);
    setIsSubmitting(true);

    const bidAmount = parseFloat(formData.client_bid_amount);
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      setLoading(false);
      setIsSubmitting(false);
      return;
    }
    if (isNaN(bidAmount) || bidAmount <= 0) {
      toast.error('Please enter a valid budget greater than 0');
      setLoading(false);
      setIsSubmitting(false);
      return;
    }
    if (!formData.expected_return_date || isNaN(Date.parse(formData.expected_return_date))) {
      toast.error('Please select a valid expected return date');
      setLoading(false);
      setIsSubmitting(false);
      return;
    }
    if (new Date(formData.expected_return_date) < new Date()) {
      toast.error('Expected return date cannot be in the past');
      setLoading(false);
      setIsSubmitting(false);
      return;
    }
    if (formData.file && formData.file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      setLoading(false);
      setIsSubmitting(false);
      return;
    }
    if (formData.file && formData.file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      setLoading(false);
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('client_bid_amount', bidAmount.toString());
    data.append('expected_return_date', formData.expected_return_date);
    if (formData.file) {
      data.append('file', formData.file);
    }

    try {
      const response = await axios.post('http://localhost:5000/api/jobs/post', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Job posted successfully! Awaiting admin approval.');
      setFormData({
        title: '',
        description: '',
        client_bid_amount: '',
        expected_return_date: '',
        file: null,
      });
      document.querySelector('input[type="file"]').value = null;
      console.log('Job posted successfully:', response.data);
    } catch (err) {
      console.error('Error posting job:', err.response?.data, err.message);
      toast.error(err.response?.data?.error || 'Failed to post job');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-dark-green">Post a New Job</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
            required
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
            rows="4"
            required
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Your Budget ($)</label>
          <input
            type="number"
            step="0.01"
            value={formData.client_bid_amount}
            onChange={(e) => setFormData({ ...formData, client_bid_amount: e.target.value })}
            className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
            required
            min="0.01"
            placeholder="Enter amount (e.g., 100.50)"
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Expected Return Date</label>
          <input
            type="date"
            value={formData.expected_return_date}
            onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
            className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
            required
            min={new Date().toISOString().split('T')[0]}
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Upload PDF (optional, max 10MB)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
            className="mt-1 p-2 w-full border rounded-md"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="px-4 py-2 bg-dark-green text-white rounded-md hover:bg-lime-green disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post Job'}
        </button>
      </form>
    </div>
  );
}

export default PostJob;