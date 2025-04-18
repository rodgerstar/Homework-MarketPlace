import { Link, useLocation } from 'react-router-dom';
import { Tooltip, IconButton, Box, Avatar, Typography, Divider } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Description as DocumentPlusIcon,
  Done as DocumentCheckIcon,
  Search as DocumentMagnifyingGlassIcon,
  Assignment as DocumentTextIcon,
  PersonAdd as UserPlusIcon,
  Pending as PendingIcon, // Icon for Pending Jobs
  Gavel as GavelIcon, // Icon for Job Bids (symbolizing bidding/auction)
} from '@mui/icons-material';

function Sidebar({ role, isCollapsed, setIsCollapsed }) {
  const location = useLocation();

  // Define navigation links based on user role
  const navLinks = {
    client: [
      { path: '/client/dashboard/', label: 'Dashboard', icon: <DocumentPlusIcon /> },
      { path: '/client/dashboard/post-job', label: 'Post a Job', icon: <DocumentPlusIcon /> },
      { path: '/client/dashboard/posted-jobs', label: 'Posted Jobs', icon: <DocumentTextIcon /> },
      { path: '/client/dashboard/completed-jobs', label: 'Completed Jobs', icon: <DocumentCheckIcon /> },
    ],
    writer: [
      { path: '/writer/dashboard', label: 'Dashboard', icon: <DocumentMagnifyingGlassIcon /> },
      { path: '/writer/dashboard/available-jobs', label: 'Available Jobs', icon: <DocumentMagnifyingGlassIcon /> },
      { path: '/writer/dashboard/assigned-jobs', label: 'Assigned Jobs', icon: <DocumentTextIcon /> },
      { path: '/writer/dashboard/completed-jobs', label: 'Completed Jobs', icon: <DocumentCheckIcon /> },
    ],
    admin: [
      { path: '/superadmin', label: 'Dashboard', icon: <DocumentTextIcon /> },
      { path: '/superadmin/add-writer', label: 'Add Writer', icon: <UserPlusIcon /> },
      { path: '/superadmin/pending-jobs', label: 'Pending Jobs', icon: <PendingIcon /> }, // New link for PendingJobs
      { path: '/superadmin/job-bids', label: 'Job Bids', icon: <GavelIcon /> }, // New link for JobBids
    ],
  };

  // Placeholder user data (in a real app, fetch this from the backend)
  const user = {
    name: role === 'admin' ? 'Super Admin' : role === 'client' ? 'Client User' : 'Writer User',
    email: role === 'admin' ? 'superadmin@example.com' : role === 'client' ? 'client@example.com' : 'writer@example.com',
    avatar: "url('/src/assets/avatar.jpg')", // Placeholder avatar image
  };

  return (
    <Box
      sx={{
        backgroundColor: '#1F2A44',
        color: 'white',
        minHeight: '100vh',
        padding: { xs: 2, md: 3 },
        boxShadow: '4px 0 10px rgba(0, 0, 0, 0.2)', // Shadow on the right side
        borderRight: '1px solid rgba(255, 255, 255, 0.1)', // Subtle border on the right
        width: isCollapsed ? '64px' : '256px',
        transition: 'width 0.3s ease, box-shadow 0.3s ease',
        position: 'fixed', // Fixed position to stay on the left
        top: 0,
        left: 0,
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Main Content (User Info and Navigation Links) */}
      <Box sx={{ flexGrow: 1 }}>
        {/* User Info (Hidden when collapsed) */}
        {!isCollapsed && (
          <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#A3E635', mb: 1 }}>
              {role === 'admin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
            </Typography>
            <Avatar
              src={user.avatar}
              alt="User Avatar"
              sx={{
                width: 48,
                height: 48,
                border: '3px solid #A3E635',
                mb: 1,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              }}
            />
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {user.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {user.email}
            </Typography>
          </Box>
        )}

        {/* Divider between User Info and Navigation Links (Visible in both states) */}
        <Divider
          sx={{
            my: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            height: '1px',
            mx: isCollapsed ? 1 : 2,
          }}
        />

        {/* Navigation Links */}
        <nav>
          <Box
            component="ul"
            sx={{
              listStyle: 'none',
              p: 0,
              m: 0,
              display: 'flex',
              flexDirection: 'column',
              mt: isCollapsed ? 8 : 0,
            }}
          >
            {navLinks[role].map((link, index) => (
              <Box key={link.path}>
                <li>
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
                      className={`flex items-center rounded-lg transition ${
                        location.pathname === link.path
                          ? 'bg-lime-green text-white'
                          : 'hover:bg-gray-700 hover:text-lime-green'
                      } ${isCollapsed ? 'pl-1 pr-3 py-2' : 'px-4 py-2'}`}
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
                {/* Divider between Navigation Links (Visible in both states) */}
                {index < navLinks[role].length - 1 && (
                  <Divider
                    sx={{
                      my: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      height: '1px',
                      mx: isCollapsed ? 1 : 2,
                      opacity: 1,
                      visibility: 'visible',
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </nav>
      </Box>

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
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: '#A3E635',
                color: '#1F2A44',
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