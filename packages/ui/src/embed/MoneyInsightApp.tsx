import {
  IndexedDBAccountAdapter,
  IndexedDBCategoryAdapter,
  IndexedDBStatisticsAdapter,
  IndexedDBTransactionAdapter,
  createIndexedDBSyncAdapter,
  setAccountService,
  setAuthService,
  setCategoryService,
  setStatisticsService,
  setSyncService,
  setTransactionService,
} from "@money-insight/ui/adapters";
import { QmServerAuthAdapter } from "@money-insight/ui/adapters/shared";
import { TauriAuthAdapter } from "@money-insight/ui/adapters/tauri";
import { isTauri } from "@money-insight/ui/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppShell } from "@money-insight/ui/components/templates";
import {
  BasePathContext,
  PortalContainerContext,
} from "@money-insight/ui/hooks";
import {
  PlatformProvider,
  type IPlatformServices,
} from "@money-insight/ui/platform";

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}

export interface MoneyInsightAppProps {
  authTokens?: AuthTokens;
  embedded?: boolean;
  useRouter?: boolean;
  basePath?: string;
  className?: string;
  onLogoutRequest?: () => void;
}

export function MoneyInsightApp({
  authTokens,
  embedded = false,
  useRouter = true,
  basePath,
  className,
  onLogoutRequest,
}: MoneyInsightAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

  useEffect(() => {
    if (containerRef.current) {
      setPortalContainer(containerRef.current);
    }
  }, []);

  // Initialize services synchronously before first render
  const services: IPlatformServices = useMemo(() => {
    // Initialize data services
    setTransactionService(new IndexedDBTransactionAdapter());
    setCategoryService(new IndexedDBCategoryAdapter());
    setAccountService(new IndexedDBAccountAdapter());
    setStatisticsService(new IndexedDBStatisticsAdapter());

    // Initialize auth service based on platform
    const auth = isTauri() ? new TauriAuthAdapter() : new QmServerAuthAdapter();
    setAuthService(auth);

    // Initialize sync service (depends on auth)
    const sync = createIndexedDBSyncAdapter({
      getConfig: () => auth.getSyncConfig(),
      getTokens: () => auth.getTokens(),
      saveTokens:
        "saveTokensExternal" in auth && auth.saveTokensExternal
          ? (accessToken, refreshToken, userId) =>
              auth.saveTokensExternal!(accessToken, refreshToken, userId)
          : undefined,
    });
    setSyncService(sync);

    return {
      transaction: new IndexedDBTransactionAdapter(),
      category: new IndexedDBCategoryAdapter(),
      account: new IndexedDBAccountAdapter(),
      statistics: new IndexedDBStatisticsAdapter(),
      auth,
      sync,
    };
  }, []);

  // If external auth tokens are provided, save them to the auth service
  useEffect(() => {
    if (
      authTokens?.accessToken &&
      authTokens?.refreshToken &&
      "saveTokensExternal" in services.auth &&
      services.auth.saveTokensExternal
    ) {
      services.auth
        .saveTokensExternal(
          authTokens.accessToken,
          authTokens.refreshToken,
          authTokens.userId || "",
        )
        .catch(console.error);
    }
  }, [authTokens, services.auth]);

  const skipAuth = !!(authTokens?.accessToken && authTokens?.refreshToken);

  const content = (
    <AppShell
      skipAuth={skipAuth}
      embedded={embedded}
      onLogoutRequest={onLogoutRequest}
    />
  );

  return (
    <div ref={containerRef} className={className}>
      <PlatformProvider services={services}>
        <PortalContainerContext.Provider value={portalContainer}>
          <BasePathContext.Provider value={basePath || ""}>
            {useRouter ? (
              <BrowserRouter basename={basePath}>{content}</BrowserRouter>
            ) : (
              content
            )}
          </BasePathContext.Provider>
        </PortalContainerContext.Provider>
      </PlatformProvider>
    </div>
  );
}
