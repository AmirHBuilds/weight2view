import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "./AdminAuthContext";

/**
 * Frontend-side convenience only - avoids a flash of protected content /
 * gives a clean redirect UX. The backend is the actual authority: every
 * admin API call is independently checked server-side (see
 * app/api/admin/__init__.py), so this guard being bypassed somehow would
 * not expose any data - API calls would simply come back 401.
 */
export function RequireAdminAuth() {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <p className="font-mono text-sm text-paper-dim">Checking session…</p>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
