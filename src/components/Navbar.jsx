import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconButton } from '@mui/material'; // Import IconButton for the logout icon
import { Logout as LogoutIcon } from '@mui/icons-material'; // Import the logout icon

function Navbar() {
  const { userRole, token, logout } = useAuth();
  const location = useLocation();

  // Check if the current route is the login page
  const isLoginPage = location.pathname === '/login';

  return (
    <nav className="bg-green-600 text-white py-4 px-4 md:px-6 flex items-center justify-between">
      {/* Logo (on the left) */}
      <div className="text-xl md:text-2xl font-bold flex-shrink-0">
        <Link to="/">Professor Ann</Link>
      </div>

      {/* Show full navbar only if not on login page */}
      {!isLoginPage && (
        <div className="flex items-center w-full justify-between">
          {/* Navigation Links (centered) */}
          <div className="flex justify-center flex-1">
            <ul className="flex flex-wrap space-x-2 md:space-x-4 text-sm md:text-base">
              <li>
                <Link to="/" className="hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:underline">
                  About
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:underline">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:underline">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:underline">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/testimonials" className="hover:underline">
                  Testimonials
                </Link>
              </li>

              {/* Role-Specific Buttons */}
              {token && userRole === 'client' && (
                <li>
                  <Link
                    to="/client/dashboard"
                    className="bg-lime-green text-white px-4 py-2 rounded-lg hover:bg-lime-green/80 transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
                  >
                    Post Job
                  </Link>
                </li>
              )}
              {token && userRole === 'writer' && (
                <li>
                  <Link
                    to="/writer/dashboard"
                    className="bg-lime-green text-white px-4 py-2 rounded-lg hover:bg-lime-green/80 transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
                  >
                    Dashboard
                  </Link>
                </li>
              )}
              {token && userRole === 'admin' && (
                <li>
                  <Link
                    to="/superadmin"
                    className="bg-lime-green text-white px-4 py-2 rounded-lg hover:bg-lime-green/80 transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
                  >
                    Admin Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Login/Logout Button (on the right with spacing) */}
          <div className="text-sm md:text-base mr-2 md:mr-4">
            {!token ? (
              <Link
                to="/login?role=client"
                className="border border-white px-3 py-1 rounded hover:bg-white hover:text-dark-green transition"
              >
                Login
              </Link>
            ) : (
              <IconButton
                onClick={logout}
                className="border border-white rounded hover:bg-white transition"
                sx={{
                  color: 'white',
                  '&:hover': {
                    color: '#1A3C34', // Matches 'text-dark-green' on hover
                  },
                }}
              >
                <LogoutIcon />
              </IconButton>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;