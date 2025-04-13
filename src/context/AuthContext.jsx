import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true); // Add loading state

  // Fetch user role when token changes (e.g., after login or on refresh)
  useEffect(() => {
    const fetchUserRole = async () => {
      if (token) {
        try {
          setLoading(true); // Set loading to true while fetching
          const response = await axios.get('http://localhost:5000/api/user/role', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserRole(response.data.role);
          localStorage.setItem('userRole', response.data.role); // Persist role
        } catch (err) {
          console.error('Error fetching user role:', err);
          setUserRole(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
        } finally {
          setLoading(false); // Set loading to false after fetch completes
        }
      } else {
        setUserRole(null);
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const logout = () => {
    setToken(null);
    setUserRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  };

  return (
    <AuthContext.Provider value={{ userRole, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}