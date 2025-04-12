import { Link, useNavigate } from 'react-router-dom';
import { Tooltip, IconButton, Box, Typography } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      sx={{
        backgroundColor: '#1F2A44',
        color: 'white',
        py: 2,
        px: { xs: 2, md: 3 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Logo */}
      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          Professor Ann
        </Link>
      </Typography>

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
              color: '#A3E635',
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