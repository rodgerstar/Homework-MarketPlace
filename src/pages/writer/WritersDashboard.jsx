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

const dummyData = {
  metrics: [
    { title: 'Assigned Tasks', value: 15, color: blue[500], subtitle: 'Total', subValue: 15 },
    { title: 'In Progress', value: 5, color: orange[500], subtitle: 'Active', subValue: 5 },
    { title: 'Completed', value: 9, color: green[500], subtitle: 'Finished', subValue: 9 },
    { title: 'Overdue', value: 1, color: red[500], subtitle: 'Past Due', subValue: 1 },
  ],
  tableRows: [
    { id: 1, task: 'Math Homework', status: 'In Progress', dateAssigned: '2025-04-01', deadline: '2025-04-10' },
    { id: 2, task: 'Essay Writing', status: 'Completed', dateAssigned: '2025-03-15', deadline: '2025-03-20' },
    { id: 3, task: 'Physics Assignment', status: 'Assigned', dateAssigned: '2025-04-05', deadline: '2025-04-15' },
    { id: 4, task: 'Literature Review', status: 'In Progress', dateAssigned: '2025-04-07', deadline: '2025-04-12' },
  ],
  profile: {
    name: 'John Smith',
    role: 'Writer',
    avatar: '',
    contact: 'johnsmith@example.com',
    phone: '+123 456 7890',
  },
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
          bgcolor: params.row.status === 'Completed' ? green[500] : blue[500],
          color: 'white',
          borderRadius: '8px',
          px: 2,
          py: 0.5,
          '&:hover': {
            bgcolor: params.row.status === 'Completed' ? green[700] : blue[700],
          },
        }}
        disabled={params.row.status === 'Completed'}
        onClick={() => alert(`Submitting work for task: ${params.row.task}`)} // Placeholder action
      >
        {params.row.status === 'Completed' ? 'Submitted' : 'Submit Work'}
      </Button>
    ),
  },
];

const WritersDashboard = () => {
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

        {/* Task List + Profile */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            width: '100%',
          }}
        >
          {/* Task List Section */}
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

export default WritersDashboard;