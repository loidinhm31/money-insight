import { getAuthService } from "@money-insight/ui/adapters";
import type {
  AuthResponse,
  AuthStatus,
  SyncConfig,
} from "@money-insight/shared/types";
import type { RequiredSyncConfig } from "@money-insight/ui/adapters/factory/interfaces";

export async function configureSync(config: SyncConfig): Promise<void> {
  return getAuthService().configureSync(config);
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return getAuthService().register(username, email, password);
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return getAuthService().login(email, password);
}

export async function logout(): Promise<void> {
  return getAuthService().logout();
}

export async function refreshToken(): Promise<void> {
  return getAuthService().refreshToken();
}

export async function getStatus(): Promise<AuthStatus> {
  return getAuthService().getStatus();
}

export async function isAuthenticated(): Promise<boolean> {
  return getAuthService().isAuthenticated();
}

export async function getAccessToken(): Promise<string | null> {
  return getAuthService().getAccessToken();
}

export async function getTokens(): Promise<{
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}> {
  return getAuthService().getTokens();
}

export async function saveTokensExternal(
  accessToken: string,
  refreshToken: string,
  userId: string,
): Promise<void> {
  const authSvc = getAuthService();
  if (authSvc.saveTokensExternal) {
    return authSvc.saveTokensExternal(accessToken, refreshToken, userId);
  }
  throw new Error("saveTokensExternal not supported on this platform");
}

export function getSyncConfig(): RequiredSyncConfig {
  return getAuthService().getSyncConfig();
}
