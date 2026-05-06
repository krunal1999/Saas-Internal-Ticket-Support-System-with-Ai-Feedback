import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth, RedirectIfAuth } from "./components/RouteGuards";

import LoginPage from "./pages/LoginPage";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerTicketDetail from "./pages/customer/CustomerTicketDetail";
import AgentDashboard from "./pages/agent/AgentDashboard";
import TicketDetail from "./pages/agent/TicketDetail";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public: redirect to dashboard if already logged in */}
        <Route element={<RedirectIfAuth />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Customer routes */}
        <Route element={<RequireAuth allowedRoles={["Customer"]} />}>
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/customer/tickets/:id" element={<CustomerTicketDetail />} />
        </Route>

        {/* Agent routes */}
        <Route element={<RequireAuth allowedRoles={["Agent", "Admin"]} />}>
          <Route path="/agent" element={<AgentDashboard />} />
          <Route path="/agent/tickets/:id" element={<TicketDetail />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
