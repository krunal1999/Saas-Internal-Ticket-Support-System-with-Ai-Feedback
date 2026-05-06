import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageSpinner } from "../components/ui/Spinner";

export function RequireAuth({ allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to their own dashboard
    const redirect = user?.role === "Customer" ? "/customer" : "/agent";
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
}

export function RedirectIfAuth() {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <PageSpinner />;
  if (isAuthenticated) {
    return (
      <Navigate
        to={user?.role === "Customer" ? "/customer" : "/agent"}
        replace
      />
    );
  }
  return <Outlet />;
}
