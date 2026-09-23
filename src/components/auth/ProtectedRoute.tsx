import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

export default function ProtectedRoute() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );
  const isLoading = useAuthStore((state) => state.isLoading);

  const location = useLocation();

  // Wait until authentication has been restored
  if (isLoading) {
    return (
      <main className="page">
        <div className="empty-state">
          <p>Checking your account...</p>
        </div>
      </main>
    );
  }

  // User is not logged in
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // User is authenticated
  return <Outlet />;
}