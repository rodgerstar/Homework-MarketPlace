import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import toastify styles

// Client Dashboard Pages
import ClientDashboard from './pages/client/ClientDashboard';
import PostJob from './pages/client/PostJob';
import PostedJobs from './pages/client/PostedJobs';
import CompletedJobs from './pages/client/CompletedJobs';

// Writer Dashboard Pages (to be created later)
import AvailableJobs from './pages/writer/AvailableJobs';
import AssignedJobs from './pages/writer/AssignedJobs';
import WriterCompletedJobs from './pages/writer/CompletedJobs';

// Admin Dashboard Pages
import SuperadminDashboard from './pages/SuperadminDashboard';
import WritersDashboard from "./pages/writer/WritersDashboard.jsx";

function AppContent() {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/client/dashboard') ||
                           location.pathname.startsWith('/writer/dashboard') ||
                           location.pathname.startsWith('/superadmin');

  return (
    <div className="App">
      {/* Show Navbar only if not on a dashboard route */}
      {!isDashboardRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Client Dashboard */}
        <Route path="/client/dashboard" element={<DashboardLayout />}>
          <Route index element={<ClientDashboard />} />
          <Route path="post-job" element={<PostJob />} />
          <Route path="posted-jobs" element={<PostedJobs />} />
          <Route path="completed-jobs" element={<CompletedJobs />} />
        </Route>

        {/* Writer Dashboard (to be implemented later) */}
        <Route path="/writer/dashboard" element={<DashboardLayout />}>
          <Route index element={<WritersDashboard />} />
          <Route path="available-jobs" element={<AvailableJobs />} />
          <Route path="assigned-jobs" element={<AssignedJobs />} />
          <Route path="completed-jobs" element={<WriterCompletedJobs />} />
        </Route>

        {/* Admin Dashboard */}
        <Route path="/superadmin" element={<DashboardLayout />}>
          <Route path="" element={<SuperadminDashboard />} />
        </Route>
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <ToastContainer /> {/* Add ToastContainer here */}
      </Router>
    </AuthProvider>
  );
}

export default App;