import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminRequestsPage } from "./pages/AdminRequestsPage";
import { AdminItemsPage } from "./pages/AdminItemsPage";
import { AdminReferencesPage } from "./pages/AdminReferencesPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminRequestsPage />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="items" element={<AdminItemsPage />} />
          <Route path="references" element={<AdminReferencesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
