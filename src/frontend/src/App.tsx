import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { SalonFooter } from "./components/salon/SalonFooter";
import { SalonHeader } from "./components/salon/SalonHeader";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { HomePage } from "./pages/HomePage";
import { ReportsPage } from "./pages/ReportsPage";
import { StaffEntryPage } from "./pages/StaffEntryPage";

// ── Auth helper ────────────────────────────────────────────────────────────────
function getAdminStatus(): boolean {
  // Clear any old localStorage flag (migration from previous version)
  localStorage.removeItem("isAdminLoggedIn");
  // Use sessionStorage so login resets when browser tab/window is closed
  return sessionStorage.getItem("isAdminLoggedIn") === "true";
}

// ── Layout Shell ──────────────────────────────────────────────────────────────
function AppLayout() {
  const [isAdmin, setIsAdmin] = useState(getAdminStatus);

  const handleLogout = () => {
    sessionStorage.removeItem("isAdminLoggedIn");
    setIsAdmin(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SalonHeader isAdmin={isAdmin} onLogout={handleLogout} />
      <div className="flex-1">
        <Outlet />
      </div>
      <SalonFooter />
    </div>
  );
}

// ── Admin Guard ───────────────────────────────────────────────────────────────
function AdminGuard({ children }: { children: React.ReactNode }) {
  if (!getAdminStatus()) {
    return <Navigate to="/admin-login" />;
  }
  return <>{children}</>;
}

// ── Routes ────────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({ component: AppLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin-login",
  component: AdminLoginPageWrapper,
});

function AdminLoginPageWrapper() {
  const [, forceUpdate] = useState(0);
  return <AdminLoginPage onLogin={() => forceUpdate((v) => v + 1)} />;
}

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: function AdminRoute() {
    return (
      <AdminGuard>
        <AdminDashboard />
      </AdminGuard>
    );
  },
});

const staffEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/staff-entry",
  component: StaffEntryPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: ReportsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  adminLoginRoute,
  adminRoute,
  staffEntryRoute,
  reportsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return <RouterProvider router={router} />;
}
