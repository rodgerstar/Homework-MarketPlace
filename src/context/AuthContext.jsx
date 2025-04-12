import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  // Fetch user role when token changes (e.g., after login)
  useEffect(() => {
    const fetchUserRole = async () => {
      if (token) {
        try {
          const response = await axios.get('http://localhost:5000/api/user/role', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserRole(response.data.role);
        } catch (err) {
          console.error('Error fetching user role:', err);
          setUserRole(null);
          setToken(null);
          localStorage.removeItem('token');
        }
      } else {
        setUserRole(null);
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
  };

  return (
    <AuthContext.Provider value={{ userRole, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}