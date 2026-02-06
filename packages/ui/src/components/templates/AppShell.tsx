import { lazy, Suspense, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@money-insight/ui/components/pages";
import { Spinner } from "@money-insight/ui/components/atoms";
import { BrowserSyncInitializer } from "@money-insight/ui/components/organisms";
import { RootLayout } from "./RootLayout";
import { useAuth, useNav } from "@money-insight/ui/hooks";

const DashboardPage = lazy(() =>
  import("@money-insight/ui/components/pages").then((m) => ({
    default: m.DashboardPage,
  })),
);
const AddTransactionPage = lazy(() =>
  import("@money-insight/ui/components/pages").then((m) => ({
    default: m.AddTransactionPage,
  })),
);
const SettingsPage = lazy(() =>
  import("@money-insight/ui/components/pages").then((m) => ({
    default: m.SettingsPage,
  })),
);
const InitialSetupPage = lazy(() =>
  import("@money-insight/ui/components/pages").then((m) => ({
    default: m.InitialSetupPage,
  })),
);
const ReportsPage = lazy(() =>
  import("@money-insight/ui/components/pages").then((m) => ({
    default: m.ReportsPage,
  })),
);
const TransactionPage = lazy(() =>
  import("@money-insight/ui/components/pages").then((m) => ({
    default: m.TransactionPage,
  })),
);

export interface AppShellProps {
  skipAuth?: boolean;
  embedded?: boolean;
  onLogoutRequest?: () => void;
}

export function AppShell({
  skipAuth: skipAuthProp = false,
  onLogoutRequest,
}: AppShellProps) {
  const { to } = useNav();
  const [localSkipAuth, setLocalSkipAuth] = useState(false);

  const { isLoading: isAuthLoading, checkAuthStatus } = useAuth({
    skipInitialCheck: skipAuthProp,
  });

  const skipAuth = skipAuthProp || localSkipAuth;

  if (isAuthLoading && !skipAuth) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F8F9FA" }}
      >
        <Spinner className="w-8 h-8 text-[#635BFF]" />
      </div>
    );
  }

  const handleLogout = () => {
    if (onLogoutRequest) {
      onLogoutRequest();
    }
    setLocalSkipAuth(false);
    checkAuthStatus();
  };

  return (
    <BrowserSyncInitializer>
      <Suspense
        fallback={
          <div
            className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: "#F8F9FA" }}
          >
            <Spinner className="w-8 h-8 text-[#635BFF]" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<Navigate to={to("dashboard")} replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="add" element={<AddTransactionPage />} />
            <Route
              path="settings"
              element={<SettingsPage onLogout={handleLogout} />}
            />
            <Route
              path="login"
              element={
                <LoginPage
                  onLoginSuccess={() => {
                    checkAuthStatus();
                    to("dashboard");
                  }}
                  onSkip={() => {
                    setLocalSkipAuth(true);
                    to("dashboard");
                  }}
                />
              }
            />
            <Route path="setup" element={<InitialSetupPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="transactions" element={<TransactionPage />} />
          </Route>
          <Route path="*" element={<Navigate to={to("dashboard")} replace />} />
        </Routes>
      </Suspense>
    </BrowserSyncInitializer>
  );
}
