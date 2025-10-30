import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAccessToken } from './lib/api';
import { getCurrentUser } from './lib/queries';

// Pages
import Dashboard from './pages/dashboard/Dashboard';
import BetsList from './pages/bets/BetsList';
import BetForm from './pages/bets/BetForm';
import BetDetail from './pages/bets/BetDetail';
import Settings from './pages/settings/Settings';
import Bankroll from './pages/dashboard/Bankroll';
import SchedulePage from './pages/schedule/SchedulePage';
import GroupsPage from './pages/groups/GroupsPage';
import LeaderboardPage from './pages/groups/LeaderboardPage';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ResetPassword from './pages/auth/ResetPassword';
import Onboarding from './pages/auth/Onboarding';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();

      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        // Verify token is valid by calling /me endpoint
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Auth routes */}
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/reset" element={<ResetPassword />} />
        <Route path="/auth/onboarding" element={<Onboarding />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bets"
          element={
            <ProtectedRoute>
              <BetsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bets/new"
          element={
            <ProtectedRoute>
              <BetForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bets/:id"
          element={
            <ProtectedRoute>
              <BetDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bankroll"
          element={
            <ProtectedRoute>
              <Bankroll />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <SchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <ProtectedRoute>
              <GroupsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:groupId"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
