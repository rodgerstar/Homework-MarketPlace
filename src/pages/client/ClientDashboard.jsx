import React from 'react';
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
import { Link } from 'react-router-dom';

const dummyData = {
  metrics: [
    { title: 'Jobs Posted', value: 10, color: blue[500], subtitle: 'Total', subValue: 10 },
    { title: 'In Progress', value: 3, color: orange[500], subtitle: 'Active', subValue: 3 },
    { title: 'Completed', value: 6, color: green[500], subtitle: 'Finished', subValue: 6 },
    { title: 'Pending Review', value: 1, color: red[500], subtitle: 'Awaiting', subValue: 1 },
  ],
  tableRows: [
    { id: 1, job: 'Math Homework', status: 'In Progress', datePosted: '2025-04-01', deadline: '2025-04-10' },
    { id: 2, job: 'Essay Writing', status: 'Completed', datePosted: '2025-03-15', deadline: '2025-03-20' },
    { id: 3, job: 'Physics Assignment', status: 'Pending', datePosted: '2025-04-05', deadline: '2025-04-15' },
    { id: 4, job: 'Literature Review', status: 'In Progress', datePosted: '2025-04-07', deadline: '2025-04-12' },
  ],
  profile: {
    name: 'Jane Doe',
    role: 'Client',
    avatar: '',
    contact: 'janedoe@example.com',
    phone: '+123 456 7890',
  },
};

const columns = [
  { field: 'job', headerName: 'Job Title', flex: 1 },
  { field: 'status', headerName: 'Status', flex: 1 },
  { field: 'datePosted', headerName: 'Date Posted', flex: 1 },
  { field: 'deadline', headerName: 'Deadline', flex: 1 },
];

const ClientDashboard = () => {
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
        {/* Dashboard Title */}
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            fontWeight: 'bold',
            textAlign: 'left',
            color: '#1F2A44',
          }}
        >
          Welcome back, {dummyData.profile.name}!
        </Typography>

        {/* Call-to-Action to Post a Job */}
        <Box sx={{ mb: 4, textAlign: 'right' }}>
          <Button
            component={Link}
            to="/post-job"
            variant="contained"
            sx={{
              bgcolor: blue[500],
              color: 'white',
              borderRadius: '8px',
              px: 3,
              py: 1,
              '&:hover': { bgcolor: blue[700] },
            }}
          >
            Post a New Job
          </Button>
        </Box>

        {/* Metric Cards */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            width: '100%',
            mb: 4,
          }}
        >
          {dummyData.metrics.map((metric, index) => (
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
          ))}
        </Box>

        {/* Job History + Profile */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            width: '100%',
          }}
        >
          {/* Job History Section */}
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
                Your Job History
              </Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <DataGrid
                  rows={dummyData.tableRows}
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
              </Box>
            </CardContent>
          </Card>

          {/* Profile Summary */}
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
                <Avatar
                  sx={{
                    bgcolor: blue[500],
                    width: 80,
                    height: 80,
                    mb: 2,
                    fontSize: 32,
                  }}
                >
                  {dummyData.profile.name.charAt(0)}
                </Avatar>
                <Typography variant="h6">{dummyData.profile.name}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {dummyData.profile.role}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Email"
                    secondary={dummyData.profile.contact}
                    secondaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Phone"
                    secondary={dummyData.profile.phone}
                    secondaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default ClientDashboard;