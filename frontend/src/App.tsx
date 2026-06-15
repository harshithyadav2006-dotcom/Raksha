import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Hero } from './pages/Hero';
import { Login } from './pages/Login';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { CrisisResponse } from './pages/CrisisResponse';
import { WomenSafety } from './pages/WomenSafety';
import { AdminPanel } from './pages/AdminPanel';
import { AIIntelligence } from './pages/AIIntelligence';
import { PublicTools } from './pages/PublicTools';
import { OfflineMesh } from './pages/OfflineMesh';
import { AdvancedSettings } from './pages/AdvancedSettings';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Hero />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes — require Google sign-in */}
        <Route element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/crisis" element={<CrisisResponse />} />
          <Route path="/women-safety" element={<WomenSafety />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/ai-intelligence" element={<AIIntelligence />} />
          <Route path="/public-tools" element={<PublicTools />} />
          <Route path="/offline" element={<OfflineMesh />} />
          <Route path="/advanced" element={<AdvancedSettings />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
