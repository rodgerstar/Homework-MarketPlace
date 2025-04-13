import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../context/AuthContext';

function DashboardLayout() {
  const { userRole, token, loading } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!token || !userRole || !['client', 'writer', 'admin'].includes(userRole)) {
        navigate('/login');
      }
    }
  }, [token, userRole, loading, navigate]);

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex min-h-screen bg-gray-100 w-full" style={{ margin: 0, padding: 0 }}>
      {/* Sidebar - Hidden on mobile if isSidebarHidden is true */}
      <div className={`${isSidebarHidden ? 'hidden' : 'block'} md:block`}>
        <Sidebar role={userRole} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full" style={{ margin: 0, padding: 0 }}>
        {/* Header */}
        <Header
          isCollapsed={isCollapsed}
          toggleSidebar={() => setIsSidebarHidden(!isSidebarHidden)}
          isSidebarHidden={isSidebarHidden}
        />

        {/* Content Area */}
        <main
          className="flex-1 w-full"
          style={{
            paddingLeft: isSidebarHidden ? '0px' : isCollapsed ? '64px' : '256px',
            paddingRight: '0px',
            margin: 0,
            width: '100%',
            transition: 'padding-left 0.3s ease',
            boxSizing: 'border-box', // Ensure padding doesn’t affect width
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;