import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Client Dashboard Pages
import ClientDashboard from './pages/client/ClientDashboard';
import PostJob from './pages/client/PostJob';
import PostedJobs from './pages/client/PostedJobs';
import CompletedJobs from './pages/client/CompletedJobs';

// Writer Dashboard Pages
import AvailableJobs from './pages/writer/AvailableJobs';
import AssignedJobs from './pages/writer/AssignedJobs';
import WriterCompletedJobs from './pages/writer/CompletedJobs';
import WritersDashboard from './pages/writer/WritersDashboard.jsx';

// Admin Dashboard Pages
import SuperadminDashboard from './pages/SuperadminDashboard';
import PendingJobs from './pages/admin/PendingJobs'; // New superadmin component
import JobBids from './pages/admin/JobBids'; // New superadmin component
import AddWriter from "./pages/admin/AddWriter.jsx";

function AppContent() {
  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith('/client/dashboard') ||
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

        {/* Writer Dashboard */}
        <Route path="/writer/dashboard" element={<DashboardLayout />}>
          <Route index element={<WritersDashboard />} />
          <Route path="available-jobs" element={<AvailableJobs />} />
          <Route path="assigned-jobs" element={<AssignedJobs />} />
          <Route path="completed-jobs" element={<WriterCompletedJobs />} />
        </Route>

        {/* Admin Dashboard */}
        <Route path="/superadmin" element={<DashboardLayout />}>
          <Route index element={<SuperadminDashboard />} />
          <Route path="pending-jobs" element={<PendingJobs />} />
          <Route path="job-bids" element={<JobBids />} />
          <Route path="add-writer" element={<AddWriter/>} />
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
        <ToastContainer />
      </Router>
    </AuthProvider>
  );
}

export default App;