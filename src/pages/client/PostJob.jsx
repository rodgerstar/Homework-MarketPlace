import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

function PostJob() {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    description: '',
    expected_return_date: '',
    file: null,
    urgency: 'Normal',
    assignmentType: 'Essay',
    subject: '',
    quantity: '',
    spacing: 'Double',
    level: 'Undergraduate',
    language: 'English (US)',
    citationStyle: 'APA',
    numberOfSources: '',
  });
  const [calculatedBudget, setCalculatedBudget] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pricing rules
  const pricing = {
    Essay: { rate: 15, unit: 'page' },
    'Research Paper': { rate: 15, unit: 'page' },
    'Annotated Bibliography': { rate: 15, unit: 'page' },
    Reply: { rate: 15, unit: 'page' },
    'PowerPoint Presentation': { rate: 7, unit: 'slide' },
    Calculation: { rate: 3, unit: 'question' },
    'Question and Answer': { rate: 1.5, unit: 'question' },
  };

  // Auto-suggest expected return date based on urgency
  useEffect(() => {
    const today = new Date();
    const defaultDays = formData.urgency === 'Urgent' ? 3 : 7;
    const suggestedDate = new Date(today.setDate(today.getDate() + defaultDays))
      .toISOString()
      .split('T')[0];
    setFormData((prev) => ({ ...prev, expected_return_date: suggestedDate }));
  }, [formData.urgency]);

  // Calculate budget and word count based on assignment type, quantity, and spacing
  useEffect(() => {
    const quantity = parseFloat(formData.quantity) || 0;
    const rate = pricing[formData.assignmentType]?.rate || 0;
    const unit = pricing[formData.assignmentType]?.unit || 'page';
    const budget = quantity * rate;
    setCalculatedBudget(budget);

    if (unit === 'page') {
      const wordsPerPage = formData.spacing === 'Double' ? 275 : 550;
      setWordCount(quantity * wordsPerPage);
    } else {
      setWordCount(0);
    }
  }, [formData.assignmentType, formData.quantity, formData.spacing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setLoading(true);
    setIsSubmitting(true);

    if (!formData.description) {
      toast.error('Description is required');
      setLoading(false);
      setIsSubmitting(false);
      return;
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast.error(`Please enter a valid number of ${pricing[formData.assignmentType]?.unit}s`);
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
    const selectedDate = new Date(formData.expected_return_date);
    const today = new Date();
    if (selectedDate < today) {
      toast.error('Expected return date cannot be in the past');
      setLoading(false);
      setIsSubmitting(false);
      return;
    }
    const maxDate = new Date(today.setDate(today.getDate() + 30));
    if (selectedDate > maxDate) {
      toast.error('Expected return date cannot be more than 30 days from now');
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
    if (formData.numberOfSources && (isNaN(formData.numberOfSources) || parseInt(formData.numberOfSources) < 0)) {
      toast.error('Please enter a valid number of sources');
      setLoading(false);
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    data.append('description', formData.description);
    data.append('client_bid_amount', calculatedBudget.toString());
    data.append('expected_return_date', formData.expected_return_date);
    data.append('urgency', formData.urgency);
    data.append('assignment_type', formData.assignmentType);
    data.append('subject', formData.subject);
    data.append('quantity', formData.quantity);
    data.append('spacing', formData.spacing);
    data.append('level', formData.level);
    data.append('language', formData.language);
    data.append('citation_style', formData.citationStyle);
    data.append('number_of_sources', formData.numberOfSources || 0);
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
        description: '',
        expected_return_date: '',
        file: null,
        urgency: 'Normal',
        assignmentType: 'Essay',
        subject: '',
        quantity: '',
        spacing: 'Double',
        level: 'Undergraduate',
        language: 'English (US)',
        citationStyle: 'APA',
        numberOfSources: '',
      });
      setCalculatedBudget(0);
      setWordCount(0);
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
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-8xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-dark-green">Post a New Job</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type of Work</label>
            <select
              value={formData.assignmentType}
              onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value, quantity: '' })}
              className="p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
              disabled={loading}
            >
              <option value="Essay">Essay</option>
              <option value="Research Paper">Research Paper</option>
              <option value="Annotated Bibliography">Annotated Bibliography</option>
              <option value="Reply">Reply</option>
              <option value="PowerPoint Presentation">PowerPoint Presentation</option>
              <option value="Calculation">Calculation</option>
              <option value="Question and Answer">Question and Answer</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of {pricing[formData.assignmentType]?.unit === 'page' ? 'Pages' : pricing[formData.assignmentType]?.unit === 'slide' ? 'Slides' : 'Questions'}
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
              required
              min="0.1"
              disabled={loading}
            />
            {pricing[formData.assignmentType]?.unit === 'page' && (
              <p className="text-sm text-gray-500 mt-1">Approximately {wordCount} words</p>
            )}
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Spacing</label>
            <select
              value={formData.spacing}
              onChange={(e) => setFormData({ ...formData, spacing: e.target.value })}
              className="p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
              disabled={loading || pricing[formData.assignmentType]?.unit !== 'page'}
            >
              <option value="Single">Single</option>
              <option value="Double">Double</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Level</label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
              disabled={loading}
            >
              <option value="High School">High School</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Masters">Masters</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
              disabled={loading}
            >
              <option value="English (US)">English (US)</option>
              <option value="English (UK)">English (UK)</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Citation Style</label>
            <select
              value={formData.citationStyle}
              onChange={(e) => setFormData({ ...formData, citationStyle: e.target.value })}
              className="p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
              disabled={loading}
            >
              <option value="APA">APA</option>
              <option value="MLA">MLA</option>
              <option value="Chicago">Chicago</option>
              <option value="Harvard">Harvard</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Sources</label>
            <input
              type="number"
              value={formData.numberOfSources}
              onChange={(e) => setFormData({ ...formData, numberOfSources: e.target.value })}
              className="p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
              min="0"
              disabled={loading}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
              placeholder="e.g., History, Mathematics"
              disabled={loading}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              className="p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
              disabled={loading}
            >
              <option value="Normal">Normal (7 days)</option>
              <option value="Urgent">Urgent (3 days)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return Date</label>
          <input
            type="date"
            value={formData.expected_return_date}
            onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
            className="p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
            required
            min={new Date().toISOString().split('T')[0]}
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-lime-green"
            rows="4"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Calculated Budget ($)</label>
          <input
            type="text"
            value={calculatedBudget.toFixed(2)}
            className="p-2 w-full border rounded-md bg-gray-100"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload File (optional, max 10MB)</label>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
            className="p-2 w-full border rounded-md"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="px-4 py-2 bg-dark-green text-white rounded-md hover:bg-lime-green disabled:opacity-50 w-full"
        >
          {loading ? 'Posting...' : 'Post Job'}
        </button>
      </form>
    </div>
  );
}

export default PostJob;