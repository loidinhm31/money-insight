import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { AddTransactionPage } from "./pages/AddTransactionPage";
import { SettingsPage } from "./pages/SettingsPage";
import { InitialSetupPage } from "./pages/InitialSetupPage";
import { RootLayout } from "./layouts/RootLayout";

/**
 * Custom redirect that preserves query parameters (like session token)
 */
function RedirectToDashboard() {
  const location = useLocation();
  return <Navigate to={`/dashboard${location.search}`} replace />;
}

/**
 * Application routes configuration
 * Uses React Router v6 for proper URL-based navigation
 * IMPORTANT: Preserves session token query parameter during navigation
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <RedirectToDashboard />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "add",
        element: <AddTransactionPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "setup",
        element: <InitialSetupPage />,
      },
    ],
  },
]);
