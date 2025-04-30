import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { blue, green, red } from '@mui/material/colors';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { DataGrid } from '@mui/x-data-grid';

const AdminSubmissions = () => {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('http://localhost:5000/api/superadmin/submissions/pending', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmissions(response.data);
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Failed to fetch submissions';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
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
      toast.error('Failed to download file');
    }
  };

  const handleOpenReviewDialog = (submission) => {
    setSelectedSubmission(submission);
    setFeedback('');
    setOpenReviewDialog(true);
  };

  const handleCloseReviewDialog = () => {
    setOpenReviewDialog(false);
    setSelectedSubmission(null);
    setFeedback('');
  };

  const handleReviewSubmission = async (status) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/superadmin/submissions/${selectedSubmission.id}`,
        { status, feedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Submission ${status} successfully`);
      setSubmissions((prev) => prev.filter((sub) => sub.id !== selectedSubmission.id));
      handleCloseReviewDialog();
    } catch (err) {
      const errorMsg = err.response?.data?.error || `Failed to ${status} submission`;
      toast.error(errorMsg);
    }
  };

  const columns = [
    { field: 'jobDescription', headerName: 'Job Description', flex: 1, valueGetter: (params) => params.row.job.description },
    { field: 'writerName', headerName: 'Writer', flex: 1, valueGetter: (params) => params.row.writer.name },
    { field: 'submittedAt', headerName: 'Submitted On', flex: 1, valueGetter: (params) =>
      new Date(params.row.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
    {
      field: 'file',
      headerName: 'File',
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="text"
          onClick={() => handleDownloadFile(params.row.signed_file_url, params.row.job.description, params.row.file_extension)}
        >
          Download
        </Button>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleOpenReviewDialog(params.row)}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <Box
      sx={{
        bgcolor: '#F7F9FC',
        minHeight: '100vh',
        width: '100%',
        p: 4,
        boxSizing: 'border-box',
      }}
    >
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1F2A44' }}>
        Pending Submissions
      </Typography>

      {error && (
        <Typography variant="body1" sx={{ color: red[500], mb: 4, textAlign: 'center' }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <Box sx={{ height: 300, bgcolor: '#F7F9FC', borderRadius: '8px', p: 2 }}>
          <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-10 bg-gray-200 rounded w-full mb-1 animate-pulse"></div>
          ))}
        </Box>
      ) : submissions.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary' }}>
          No pending submissions.
        </Typography>
      ) : (
        <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', bgcolor: 'white' }}>
          <CardContent>
            <Box sx={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={submissions}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                disableRowSelectionOnClick
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-columnHeaders': { bgcolor: '#F7F9FC', color: '#1F2A44' },
                  '& .MuiDataGrid-cell': { color: '#1F2A44' },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      <Dialog open={openReviewDialog} onClose={handleCloseReviewDialog}>
        <DialogTitle>Review Submission</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Job: {selectedSubmission?.job.description}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Writer: {selectedSubmission?.writer.name}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => handleDownloadFile(selectedSubmission?.signed_file_url, selectedSubmission?.job.description, selectedSubmission?.file_extension)}
            sx={{ mb: 2 }}
          >
            Download Submission
          </Button>
          <TextField
            label="Feedback (optional)"
            multiline
            rows={4}
            fullWidth
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => handleReviewSubmission('rejected')}>
            Reject
          </Button>
          <Button variant="contained" color="success" onClick={() => handleReviewSubmission('approved')}>
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSubmissions;