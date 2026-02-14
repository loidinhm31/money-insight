import { useEffect, useState, useCallback, useRef } from "react";
import type { AuthStatus } from "@money-insight/shared/types";
import * as authService from "@money-insight/ui/services/authService";

export interface UseAuthOptions {
  skipInitialCheck?: boolean;
}

export const useAuth = (options: UseAuthOptions = {}) => {
  const { skipInitialCheck = false } = options;

  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(
    skipInitialCheck ? { isAuthenticated: true } : null,
  );
  const [isLoading, setIsLoading] = useState(!skipInitialCheck);
  const [error, setError] = useState<string | null>(null);

  const isCheckingRef = useRef(false);
  const initialCheckDoneRef = useRef(skipInitialCheck);

  const checkAuthStatus = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsLoading(true);
    try {
      const status = await authService.getStatus();
      setAuthStatus(status);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check auth status",
      );
      setAuthStatus({ isAuthenticated: false });
    } finally {
      setIsLoading(false);
      isCheckingRef.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setAuthStatus({ isAuthenticated: false });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to logout");
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      await authService.refreshToken();
      await checkAuthStatus();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh token");
      setAuthStatus({ isAuthenticated: false });
    }
  }, [checkAuthStatus]);

  useEffect(() => {
    if (initialCheckDoneRef.current) return;
    initialCheckDoneRef.current = true;
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    authStatus,
    isAuthenticated: authStatus?.isAuthenticated ?? false,
    isLoading,
    error,
    checkAuthStatus,
    logout,
    refreshToken,
  };
};
