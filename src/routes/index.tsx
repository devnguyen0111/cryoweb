import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_DASHBOARD_ROUTES } from "@/types/auth";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() {
  const { isAuthenticated, isLoading, userRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (userRole && ROLE_DASHBOARD_ROUTES[userRole]) {
    return <Navigate to={ROLE_DASHBOARD_ROUTES[userRole]} />;
  }

  return <Navigate to="/login" />;
}
