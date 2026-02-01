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

  const services = useMemo(() => {
    if (isTauri()) {
      return {
        transaction: new TauriTransactionAdapter(),
        category: new TauriCategoryAdapter(),
        account: new TauriAccountAdapter(),
        statistics: new TauriStatisticsAdapter(),
      };
    }
    return {
      transaction: new IndexedDBTransactionAdapter(),
      category: new IndexedDBCategoryAdapter(),
      account: new IndexedDBAccountAdapter(),
      statistics: new IndexedDBStatisticsAdapter(),
    };
  }, []);

  useEffect(() => {
    setTransactionService(services.transaction);
    setCategoryService(services.category);
    setAccountService(services.account);
    setStatisticsService(services.statistics);

    // Ensure auth + sync services are initialized (lazy-created by ServiceFactory)
    setAuthService(getAuthService());
    setSyncService(getSyncService());
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
      <PortalContainerContext.Provider value={portalContainer}>
        <BasePathContext.Provider value={basePath || ""}>
          {useRouter ? (
            <BrowserRouter basename={basePath}>{content}</BrowserRouter>
          ) : (
            content
          )}
        </BasePathContext.Provider>
      </PortalContainerContext.Provider>
    </div>
  );
}
