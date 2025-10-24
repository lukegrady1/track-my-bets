import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { useEffect, useState } from 'react';
// import { supabase } from './lib/supabase';
// import type { User } from '@supabase/supabase-js';

// Pages
import Dashboard from './pages/dashboard/Dashboard';
import BetsList from './pages/bets/BetsList';
import BetForm from './pages/bets/BetForm';
import BetDetail from './pages/bets/BetDetail';
import Settings from './pages/settings/Settings';
import Bankroll from './pages/dashboard/Bankroll';
// import SignIn from './pages/auth/SignIn';
// import SignUp from './pages/auth/SignUp';
// import ResetPassword from './pages/auth/ResetPassword';
// import Onboarding from './pages/auth/Onboarding';

// Protected Route Component - DISABLED FOR LOCAL DEVELOPMENT
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Authentication disabled for local development
  // Uncomment the code below to re-enable authentication

  // const [user, setUser] = useState<User | null>(null);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   // Check active session
  //   supabase.auth.getSession().then(({ data: { session } }) => {
  //     setUser(session?.user ?? null);
  //     setLoading(false);
  //   });

  //   // Listen for auth changes
  //   const {
  //     data: { subscription },
  //   } = supabase.auth.onAuthStateChange((_event, session) => {
  //     setUser(session?.user ?? null);
  //   });

  //   return () => subscription.unsubscribe();
  // }, []);

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-lg">Loading...</div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return <Navigate to="/auth/signin" replace />;
  // }

  return <>{children}</>;
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Auth routes - DISABLED FOR LOCAL DEVELOPMENT */}
        {/* <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/reset" element={<ResetPassword />} />
        <Route path="/auth/onboarding" element={<Onboarding />} /> */}

        {/* Protected routes - Auth bypassed for local development */}
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
