import { Outlet } from "react-router-dom";
import { useSpendingStore } from "@money-insight/ui/stores";
import { BottomNav } from "@money-insight/ui/components/molecules";
import { BrowserSyncInitializer } from "@money-insight/ui/components/organisms";
import {
  isOpenedFromDesktop,
  initializeSessionToken,
} from "@money-insight/ui/utils";
import { useEffect } from "react";

/**
 * Root layout component that wraps all pages
 * Handles navigation, server connection status, and global app state
 * IMPORTANT: Initializes session token from URL before any navigation
 */
export function RootLayout() {
  const { transactions, initFromDatabase } = useSpendingStore();

  // CRITICAL: Initialize session token FIRST, then database
  // This must happen synchronously to avoid race conditions
  useEffect(() => {
    const initialize = async () => {
      // Step 1: Only capture session token when opened from desktop app
      if (isOpenedFromDesktop()) {
        const token = initializeSessionToken();
        if (!token) {
          console.error("[RootLayout] Failed to initialize session token");
          console.error(
            "[RootLayout] Database initialization will fail in browser mode",
          );
        }
      }

      // Step 2: Now safe to initialize database (session token is available)
      try {
        console.log("[RootLayout] Initializing database...");
        await initFromDatabase();
        console.log("[RootLayout] Database initialized successfully");
      } catch (error) {
        console.error("[RootLayout] Failed to initialize database:", error);
      }
    };

    initialize();
  }, [initFromDatabase]);

  // Determine if we should show navigation
  const hasTransactions = transactions.length > 0;

  return (
    <BrowserSyncInitializer>
      <div
        className="min-h-screen font-body antialiased"
        style={{ backgroundColor: "#F8F9FA" }}
      >
        {/* Navigation */}
        <BottomNav hasTransactions={hasTransactions} />

        {/* Page content with bottom padding for mobile nav */}
        <main className="pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
    </BrowserSyncInitializer>
  );
}
