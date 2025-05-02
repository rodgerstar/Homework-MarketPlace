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
} from '@mui/material';
import { blue, green, orange, red } from '@mui/material/colors';
import { DataGrid } from '@mui/x-data-grid';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState([
    { title: 'Total Jobs', value: 0, color: blue[500], subtitle: 'All', subValue: 0 },
    { title: 'Pending Jobs', value: 0, color: orange[500], subtitle: 'Awaiting', subValue: 0 },
    { title: 'Completed Jobs', value: 0, color: green[500], subtitle: 'Finished', subValue: 0 },
    { title: 'Total Earnings', value: '$0', color: red[500], subtitle: 'Revenue', subValue: '$0' },
  ]);
  const [profile, setProfile] = useState({ name: '', role: '', avatar: '', contact: '', phone: '' });
  const [tableRows, setTableRows] = useState([]);
  const [jobStatusData, setJobStatusData] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [dashboardResponse, profileResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/superadmin/dashboard', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const { data: dashboardData } = dashboardResponse;
        const { data: userProfile } = profileResponse;

        setMetrics([
          {
            title: 'Total Jobs',
            value: dashboardData.totalJobs,
            color: blue[500],
            subtitle: 'All',
            subValue: dashboardData.totalJobs,
          },
          {
            title: 'Pending Jobs',
            value: dashboardData.pendingJobs,
            color: orange[500],
            subtitle: 'Awaiting',
            subValue: dashboardData.pendingJobs,
          },
          {
            title: 'Completed Jobs',
            value: dashboardData.completedJobs,
            color: green[500],
            subtitle: 'Finished',
            subValue: dashboardData.completedJobs,
          },
          {
            title: 'Total Earnings',
            value: `$${dashboardData.totalEarnings.toFixed(2)}`,
            color: red[500],
            subtitle: 'Revenue',
            subValue: `$${dashboardData.totalEarnings.toFixed(2)}`,
          },
        ]);

        setJobStatusData(
          dashboardData.jobStatusDistribution.map((item) => ({
            name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
            value: item.count,
          }))
        );

        setEarningsData([
          { name: 'Total Earnings', value: dashboardData.totalEarnings, fill: red[500] },
          { name: 'Writer Earnings', value: dashboardData.writerEarnings, fill: blue[500] },
        ]);

        setTableRows(
          dashboardData.recentJobs.map((job) => ({
            id: job.id,
            description: job.description.slice(0, 50),
            status: job.status.charAt(0).toUpperCase() + job.status.slice(1),
            client: job.client?.name || 'Unknown',
            createdAt: new Date(job.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          }))
        );

        setProfile({
          name: userProfile.name || 'Unknown',
          role: userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) || 'Admin',
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

  const columns = [
    { field: 'description', headerName: 'Job Description', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'client', headerName: 'Client', flex: 1 },
    { field: 'createdAt', headerName: 'Posted On', flex: 1 },
  ];

  const COLORS = [blue[500], orange[500], green[500], red[500], '#8884d8'];

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
        Welcome back, {profile.name}!
      </Typography>

      {error && (
        <Typography variant="body1" sx={{ color: red[500], mb: 4, textAlign: 'center' }}>
          {error}
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
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
              }}
            >
              <CardContent sx={{ p: 0, textAlign: 'center' }}>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
                  {metric.title}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: metric.color, mb: 1 }}>
                  {metric.value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  {metric.subtitle}: <b>{metric.subValue}</b>
                </Typography>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Card
          sx={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            bgcolor: 'white',
            flex: '1 1 65%',
            minWidth: '300px',
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1F2A44' }}>
              Job Status Distribution
            </Typography>
            {loading ? (
              <Box sx={{ height: 300, bgcolor: '#F7F9FC', borderRadius: '8px', p: 2 }}>
                <div className="h-40 bg-gray-200 rounded w-full animate-pulse"></div>
              </Box>
            ) : (
              <PieChart width={400} height={300}>
                <Pie
                  data={jobStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {jobStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            )}
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            bgcolor: 'white',
            flex: '1 1 30%',
            minWidth: '250px',
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1F2A44' }}>
              Earnings Breakdown
            </Typography>
            {loading ? (
              <Box sx={{ height: 300, bgcolor: '#F7F9FC', borderRadius: '8px', p: 2 }}>
                <div className="h-40 bg-gray-200 rounded w-full animate-pulse"></div>
              </Box>
            ) : (
              <BarChart width={250} height={300} data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {earningsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Card
          sx={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            bgcolor: 'white',
            flex: '1 1 65%',
            minWidth: '300px',
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1F2A44' }}>
              Recent Jobs
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
                    '& .MuiDataGrid-columnHeaders': { bgcolor: '#F7F9FC', color: '#1F2A44' },
                    '& .MuiDataGrid-cell': { color: '#1F2A44' },
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
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              {loading ? (
                <div className="h-20 w-20 bg-gray-200 rounded-full mb-2 animate-pulse"></div>
              ) : (
                <Avatar
                  sx={{ bgcolor: blue[500], width: 80, height: 80, mb: 2, fontSize: 32 }}
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
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2, bgcolor: green[500], '&:hover': { bgcolor: green[700] } }}
              onClick={() => navigate('/admin/add-writer')}
            >
              Add Writer
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AdminDashboard;