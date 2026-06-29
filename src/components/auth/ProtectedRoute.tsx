import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Skeleton className="h-8 w-48 bg-muted" />
        <Skeleton className="h-4 w-32 bg-muted" />
      </div>
    );
  }

  // Not authenticated → login, remembering intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but on verify-email page already → don't redirect again (prevents loop)
  const isOnVerifyPage = location.pathname === "/verify-email";

  // Authenticated but email not verified → verify-email page (never loop back)
  if (!user.emailVerified && !isOnVerifyPage) {
    return <Navigate to="/verify-email" replace />;
  }

  // Admin route but user is not admin → home
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
