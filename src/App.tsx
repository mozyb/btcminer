import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { routes } from './routes';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <IntersectObserver />
        <Routes>
          {routes.map((route, index) => {
            const isAdminRoute = route.path.startsWith('/admin');
            const isProtected = !route.public;

            if (!isProtected) {
              // Public route — render directly
              return <Route key={index} path={route.path} element={route.element} />;
            }

            // Protected route — wrap with auth guard
            return (
              <Route
                key={index}
                path={route.path}
                element={
                  <ProtectedRoute requireAdmin={isAdminRoute}>
                    {route.element}
                  </ProtectedRoute>
                }
              />
            );
          })}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </Router>
  );
};

export default App;
