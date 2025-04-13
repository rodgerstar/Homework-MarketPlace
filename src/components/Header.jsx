import { Link, useNavigate } from 'react-router-dom';
import { Tooltip, IconButton, Box, Typography } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useMediaQuery } from '@mui/material';

function Header({ isCollapsed }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isSmallDevice = useMediaQuery('(max-width:600px)');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Show logo on small devices only when sidebar is collapsed, always show on larger devices
  const showLogo = !isSmallDevice || (isSmallDevice && isCollapsed);

  return (
    <Box
      sx={{
        background: 'linear-gradient(90deg, #1A3C34 0%, #A3E635 100%)',
        color: 'white',
        py: 2,
        px: { xs: 2, md: 3 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Logo (Conditionally shown) */}
      {showLogo && (
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            paddingLeft: isSmallDevice && isCollapsed ? '0px' : isCollapsed ? '64px' : '256px', // Start where sidebar ends
            transition: 'padding-left 0.3s ease', // Smooth transition for collapse/expand
          }}
        >
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            Professor Ann
          </Link>
        </Typography>
      )}
      {!showLogo && <Box sx={{ width: '1px' }} />} {/* Placeholder to maintain layout */}

      {/* Logout Icon with Tooltip */}
      <Tooltip
        title="Log Out"
        placement="bottom"
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
          onClick={handleLogout}
          sx={{
            color: 'white',
            '&:hover': {
              color: '#1F2A44',
            },
          }}
        >
          <LogoutIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default Header;