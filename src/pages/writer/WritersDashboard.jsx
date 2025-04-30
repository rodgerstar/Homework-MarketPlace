import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Input,
} from '@mui/material';
import { blue, green, orange, red } from '@mui/material/colors';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const WritersDashboard = () => {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState([
    { title: 'Assigned Tasks', value: 0, color: blue[500], subtitle: 'Total', subValue: 0 },
    { title: 'In Progress', value: 0, color: orange[500], subtitle: 'Active', subValue: 0 },
    { title: 'Completed', value: 0, color: green[500], subtitle: 'Finished', subValue: 0 },
    { title: 'Overdue', value: 0, color: red[500], subtitle: 'Past Due', subValue: 0 },
  ]);
  const [tableRows, setTableRows] = useState([]);
  const [profile, setProfile] = useState({ name: '', role: '', avatar: '', contact: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSubmissionDialog, setOpenSubmissionDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const assignedResponse = await axios.get('http://localhost:5000/api/jobs/assigned', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const assignedJobs = assignedResponse.data;

        const completedResponse = await axios.get('http://localhost:5000/api/jobs/writer/completed', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const completedJobs = completedResponse.data;

        const profileResponse = await axios.get('http://localhost:5000/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userProfile = profileResponse.data;

        const now = new Date();
        const assignedCount = assignedJobs.length;
        const inProgressCount = assignedJobs.filter((job) => job.status === 'in_progress').length;
        const completedCount = completedJobs.length;
        const overdueCount = assignedJobs.filter(
          (job) => job.expected_return_date && new Date(job.expected_return_date) < now && job.status !== 'completed'
        ).length;

        setMetrics([
          { title: 'Assigned Tasks', value: assignedCount, color: blue[500], subtitle: 'Total', subValue: assignedCount },
          { title: 'In Progress', value: inProgressCount, color: orange[500], subtitle: 'Active', subValue: inProgressCount },
          { title: 'Completed', value: completedCount, color: green[500], subtitle: 'Finished', subValue: completedCount },
          { title: 'Overdue', value: overdueCount, color: red[500], subtitle: 'Past Due', subValue: overdueCount },
        ]);

        const rows = assignedJobs.map((job) => ({
          id: job.id,
          task: job.description.slice(0, 50),
          status: job.status.charAt(0).toUpperCase() + job.status.slice(1),
          dateAssigned: job.created_at
            ? new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A',
          deadline: job.expected_return_date
            ? new Date(job.expected_return_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Not set',
        }));

        setTableRows(rows);

        setProfile({
          name: userProfile.name || 'Unknown',
          role: userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) || 'Writer',
          avatar: '',
          contact: userProfile.email || 'N/A',
          phone: userProfile.phone || 'N/A',
        });
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Failed to load dashboard data';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Handle submission dialog
  const handleOpenSubmissionDialog = (job) => {
    setSelectedJob(job);
    setOpenSubmissionDialog(true);
  };

  const handleCloseSubmissionDialog = () => {
    setOpenSubmissionDialog(false);
    setSelectedJob(null);
    setSubmissionFile(null);
  };

  const handleFileChange = (event) => {
    setSubmissionFile(event.target.files[0]);
  };

  const handleSubmitWork = async () => {
    if (!submissionFile) {
      toast.error('Please select a file to submit');
      return;
    }

    const formData = new FormData();
    formData.append('file', submissionFile);

    try {
      await axios.post(`http://localhost:5000/api/jobs/${selectedJob.id}/submit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Work submitted successfully for admin approval');
      handleCloseSubmissionDialog();
      // Refresh table
      const assignedResponse = await axios.get('http://localhost:5000/api/jobs/assigned', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTableRows(
        assignedResponse.data.map((job) => ({
          id: job.id,
          task: job.description.slice(0, 50),
          status: job.status.charAt(0).toUpperCase() + job.status.slice(1),
          dateAssigned: job.created_at
            ? new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A',
          deadline: job.expected_return_date
            ? new Date(job.expected_return_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Not set',
        }))
      );
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit work';
      toast.error(errorMsg);
    }
  };

  const columns = [
    { field: 'task', headerName: 'Task Title', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'dateAssigned', headerName: 'Date Assigned', flex: 1 },
    { field: 'deadline', headerName: 'Deadline', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          sx={{
            bgcolor: params.row.status === 'Completed' || params.row.status === 'Pending_approval' ? green[500] : blue[500],
            color: 'white',
            borderRadius: '8px',
            px: 2,
            py: 0.5,
            '&:hover': {
              bgcolor: params.row.status === 'Completed' || params.row.status === 'Pending_approval' ? green[700] : blue[700],
            },
          }}
          disabled={params.row.status === 'Completed' || params.row.status === 'Pending_approval'}
          onClick={() => handleOpenSubmissionDialog(params.row)}
        >
          {params.row.status === 'Completed' || params.row.status === 'Pending_approval' ? 'Submitted' : 'Submit Work'}
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
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          width: '100%',
          p: 4,
          boxSizing: 'border-box',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            fontWeight: 'bold',
            textAlign: 'left',
            color: '#1F2A44',
          }}
        >
          Welcome back, {profile.name}!
        </Typography>

        {error && (
          <Typography
            variant="body1"
            sx={{ color: red[500], mb: 4, textAlign: 'center' }}
          >
            {error}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            width: '100%',
            mb: 4,
          }}
        >
          {loading ? (
            [...Array(4)].map((_, index) => (
              <Card
                key={index}
                sx={{
                  bgcolor: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  height: '200px',
                  flex: '1 1 23%',
                  minWidth: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  px: 2,
                  py: 2,
                  boxSizing: 'border-box',
                }}
              >
                <CardContent sx={{ p: 0, textAlign: 'center' }}>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto animate-pulse"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            metrics.map((metric, index) => (
              <Card
                key={index}
                sx={{
                  bgcolor: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  height: '200px',
                  flex: '1 1 23%',
                  minWidth: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  px: 2,
                  py: 2,
                  boxSizing: 'border-box',
                }}
              >
                <CardContent sx={{ p: 0, textAlign: 'center' }}>
                  <Typography
                    variant="body1"
                    sx={{ color: 'text.secondary', mb: 1 }}
                  >
                    {metric.title}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 'bold',
                      color: metric.color,
                      mb: 1,
                    }}
                  >
                    {metric.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: metric.color, mb: 1 }}
                  >
                    {metric.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', mt: 1 }}
                  >
                    {metric.subtitle}: <b>{metric.subValue}</b>
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            width: '100%',
          }}
        >
          <Card
            sx={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              bgcolor: 'white',
              flex: '1 1 65%',
              minWidth: '300px',
              boxSizing: 'border-box',
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 'bold', color: '#1F2A44' }}
              >
                Your Assigned Tasks
              </Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                {loading ? (
                  <Box sx={{ height: 300, bgcolor: '#F7F9FC', borderRadius: '8px', p: 2 }}>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="h-10 bg-gray-200 rounded w-full mb-1 animate-pulse"></div>
                    ))}
                  </Box>
                ) : (
                  <DataGrid
                    rows={tableRows}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5]}
                    disableRowSelectionOnClick
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-columnHeaders': {
                        bgcolor: '#F7F9FC',
                        color: '#1F2A44',
                      },
                      '& .MuiDataGrid-cell': {
                        color: '#1F2A44',
                      },
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              bgcolor: 'white',
              color: '#1F2A44',
              flex: '1 1 30%',
              minWidth: '250px',
              boxSizing: 'border-box',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                {loading ? (
                  <div className="h-20 w-20 bg-gray-200 rounded-full mb-2 animate-pulse"></div>
                ) : (
                  <Avatar
                    sx={{
                      bgcolor: blue[500],
                      width: 80,
                      height: 80,
                      mb: 2,
                      fontSize: 32,
                    }}
                  >
                    {profile.name.charAt(0)}
                  </Avatar>
                )}
                <Typography variant="h6">{loading ? 'Loading...' : profile.name}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {loading ? 'Loading...' : profile.role}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Email"
                    secondary={loading ? 'Loading...' : profile.contact}
                    secondaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Phone"
                    secondary={loading ? 'Loading...' : profile.phone}
                    secondaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Submission Dialog */}
        <Dialog open={openSubmissionDialog} onClose={handleCloseSubmissionDialog}>
          <DialogTitle>Submit Work for {selectedJob?.task}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Upload the completed work in the requested format.
            </Typography>
            <Input
              type="file"
              onChange={handleFileChange}
              fullWidth
              inputProps={{ accept: '.pdf,.docx,.txt' }} // Restrict to common formats
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSubmissionDialog}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitWork} disabled={!submissionFile}>
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default WritersDashboard;