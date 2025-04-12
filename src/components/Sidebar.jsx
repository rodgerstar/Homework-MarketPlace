import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tooltip, IconButton, Box, Avatar, Typography } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Home as HomeIcon,
  Description as DocumentPlusIcon,
  Done as DocumentCheckIcon,
  Search as DocumentMagnifyingGlassIcon,
  Assignment as DocumentTextIcon,
  PersonAdd as UserPlusIcon,
} from '@mui/icons-material';

function Sidebar({ role }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Define navigation links based on user role
  const navLinks = {
    client: [
      { path: '/client/dashboard/post-job', label: 'Post a Job', icon: <DocumentPlusIcon /> },
      { path: '/client/dashboard/posted-jobs', label: 'Posted Jobs', icon: <DocumentTextIcon /> },
      { path: '/client/dashboard/completed-jobs', label: 'Completed Jobs', icon: <DocumentCheckIcon /> },
    ],
    writer: [
      { path: '/writer/dashboard/available-jobs', label: 'Available Jobs', icon: <DocumentMagnifyingGlassIcon /> },
      { path: '/writer/dashboard/assigned-jobs', label: 'Assigned Jobs', icon: <DocumentTextIcon /> },
      { path: '/writer/dashboard/completed-jobs', label: 'Completed Jobs', icon: <DocumentCheckIcon /> },
    ],
    admin: [
      { path: '/superadmin/add-writer', label: 'Add Writer', icon: <UserPlusIcon /> },
      // Add more admin links as needed
    ],
  };

  // Placeholder user data (in a real app, fetch this from the backend)
  const user = {
    name: role === 'admin' ? 'Super Admin' : role === 'client' ? 'Client User' : 'Writer User',
    email: role === 'admin' ? 'superadmin@example.com' : role === 'client' ? 'client@example.com' : 'writer@example.com',
    avatar: 'https://via.placeholder.com/40', // Placeholder avatar image
  };

  return (
    <Box
      sx={{
        backgroundColor: '#1F2A44', // Equivalent to bg-gray-800
        color: 'white',
        minHeight: '100vh',
        padding: { xs: 2, md: 3 },
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: isCollapsed ? '64px' : '256px',
        transition: 'width 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* User Info */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {!isCollapsed && (
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#A3E635', mb: 1 }}>
            {role === 'admin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
          </Typography>
        )}
        <Avatar
          src={user.avatar}
          alt="User Avatar"
          sx={{
            width: 40,
            height: 40,
            border: '2px solid #A3E635',
            mb: isCollapsed ? 0 : 1,
          }}
        />
        {!isCollapsed && (
          <>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {user.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {user.email}
            </Typography>
          </>
        )}
      </Box>

      {/* Navigation Links */}
      <nav>
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {navLinks[role].map((link) => (
            <li key={link.path}>
              <Tooltip
                title={isCollapsed ? link.label : ''}
                placement="right"
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'white',
                      color: '#1F2A44',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                      fontSize: '0.875rem',
                    },
                  },
                  arrow: {
                    sx: {
                      color: 'white',
                    },
                  },
                }}
              >
                <Link
                  to={link.path}
                  style={{ textDecoration: 'none' }}
                  className={`flex items-center px-4 py-2 rounded-lg transition ${
                    location.pathname === link.path
                      ? 'bg-lime-green text-white'
                      : 'hover:bg-gray-700 hover:text-lime-green'
                  }`}
                >
                  {link.icon}
                  {!isCollapsed && (
                    <Typography variant="body1" sx={{ ml: 2, color: 'inherit' }}>
                      {link.label}
                    </Typography>
                  )}
                </Link>
              </Tooltip>
            </li>
          ))}
        </Box>
      </nav>

      {/* Collapse/Expand Button */}
      <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
        <Tooltip
          title={isCollapsed ? 'Expand' : 'Collapse'}
          placement="top"
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: 'white',
                color: '#1F2A44',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                fontSize: '0.875rem',
              },
            },
            arrow: {
              sx: {
                color: 'white',
              },
            },
          }}
        >
          <IconButton
            onClick={() => setIsCollapsed(!isCollapsed)}
            sx={{
              color: 'white',
              '&:hover': {
                color: '#A3E635',
              },
            }}
          >
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default Sidebar;