import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "./AdminAuthContext";

const baseNavItems = [
  { to: "/admin/requests", label: "Requests" },
  { to: "/admin/items", label: "Items" },
  { to: "/admin/references", label: "References" },
];

export function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems =
    admin?.role === "super_admin"
      ? [...baseNavItems, { to: "/admin/admins", label: "Admins" }]
      : baseNavItems;

  async function handleLogout() {
    await logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-ink text-paper">
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-display text-lg text-paper">
              Weight<span className="text-teal">2</span>View <span className="text-paper-dim font-sans text-sm">/ admin</span>
            </span>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      isActive ? "bg-teal-dim/15 text-teal" : "text-paper-dim hover:text-paper"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <NavLink to="/" className="font-mono text-xs text-paper-dim hover:text-paper">
              ← back to app
            </NavLink>
            {admin && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm text-paper-dim transition-colors hover:text-paper"
                >
                  <span className="max-w-[160px] truncate">{admin.email}</span>
                  <span className="rounded-full border border-teal-dim/40 px-2 py-0.5 font-mono text-[10px] uppercase text-teal">
                    {admin.role === "super_admin" ? "super admin" : "admin"}
                  </span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-lg border border-line bg-ink-soft shadow-xl">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-clay hover:bg-ink"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </div>
    </div>
  );
}
