import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import { AdminDashboard, CandidateDashboard, EmployerDashboard } from './pages/Dashboards';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        
        <Route path="/dashboard">
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="candidate" element={<CandidateDashboard />} />
          <Route path="employer" element={<EmployerDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
