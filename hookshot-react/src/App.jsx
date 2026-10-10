import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useThemeMode } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Endpoints from './pages/Endpoints';
import Events from './pages/Events';
import SystemHealth from './pages/SystemHealth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

function ThemedToaster() {
  const { resolvedTheme } = useThemeMode();
  return <Toaster theme={resolvedTheme} />;
}

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <ThemeProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/endpoints" element={<Endpoints />} />
                <Route path="/events" element={<Events />} />
                <Route path="/system" element={<SystemHealth />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <ThemedToaster />
          </ThemeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
}
