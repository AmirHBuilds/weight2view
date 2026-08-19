import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/admin/requests", label: "Requests" },
  { to: "/admin/items", label: "Items" },
  { to: "/admin/references", label: "References" },
];

export function AdminLayout() {
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
          <NavLink to="/" className="font-mono text-xs text-paper-dim hover:text-paper">
            ← back to app
          </NavLink>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </div>
    </div>
  );
}
