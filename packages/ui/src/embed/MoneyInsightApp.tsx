import {
  IndexedDBAccountAdapter,
  IndexedDBCategoryAdapter,
  IndexedDBStatisticsAdapter,
  IndexedDBTransactionAdapter,
  getAuthService,
  getSyncService,
  setAccountService,
  setAuthService,
  setCategoryService,
  setStatisticsService,
  setSyncService,
  setTransactionService,
  TauriAccountAdapter,
  TauriCategoryAdapter,
  TauriStatisticsAdapter,
  TauriTransactionAdapter,
} from "@money-insight/ui/adapters";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppShell } from "@money-insight/ui/components/templates";
import {
  BasePathContext,
  PortalContainerContext,
} from "@money-insight/ui/hooks";
import { isTauri } from "@money-insight/ui/utils";
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

  const services: IPlatformServices = useMemo(() => {
    // Create auth and sync services first (they may be needed by other services)
    const auth = getAuthService();
    const sync = getSyncService();

    if (isTauri()) {
      return {
        transaction: new TauriTransactionAdapter(),
        category: new TauriCategoryAdapter(),
        account: new TauriAccountAdapter(),
        statistics: new TauriStatisticsAdapter(),
        auth,
        sync,
      };
    }
    return {
      transaction: new IndexedDBTransactionAdapter(),
      category: new IndexedDBCategoryAdapter(),
      account: new IndexedDBAccountAdapter(),
      statistics: new IndexedDBStatisticsAdapter(),
      auth,
      sync,
    };
  }, []);

  useEffect(() => {
    // Inject all services into factory singletons
    setTransactionService(services.transaction);
    setCategoryService(services.category);
    setAccountService(services.account);
    setStatisticsService(services.statistics);
    setAuthService(services.auth);
    setSyncService(services.sync);
  }, [services]);

  // If external auth tokens are provided, save them to the auth service
  useEffect(() => {
    if (authTokens?.accessToken && authTokens?.refreshToken) {
      const authSvc = getAuthService();
      authSvc
        .saveTokensExternal?.(
          authTokens.accessToken,
          authTokens.refreshToken,
          authTokens.userId || "",
        )
        ?.catch(console.error);
    }
  }, [authTokens]);

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
