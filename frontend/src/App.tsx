import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { AdminAuthProvider } from "./components/admin/AdminAuthContext";
import { RequireAdminAuth } from "./components/admin/RequireAdminAuth";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminRequestsPage } from "./pages/AdminRequestsPage";
import { AdminItemsPage } from "./pages/AdminItemsPage";
import { AdminReferencesPage } from "./pages/AdminReferencesPage";
import { AdminAdminsPage } from "./pages/AdminAdminsPage";

// AdminAuthProvider is scoped to just the /admin/* subtree so the public
// app (which never needs to know about admin sessions) doesn't make an
// unnecessary auth check on every load.
function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<RequireAdminAuth />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminRequestsPage />} />
            <Route path="requests" element={<AdminRequestsPage />} />
            <Route path="items" element={<AdminItemsPage />} />
            <Route path="references" element={<AdminReferencesPage />} />
            <Route path="admins" element={<AdminAdminsPage />} />
          </Route>
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
