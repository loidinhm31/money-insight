import type {
  AuthResponse,
  AuthStatus,
  SyncConfig,
} from "@money-insight/shared/types";

/** Sync config with all required fields (used when reading current config) */
export type RequiredSyncConfig = Required<SyncConfig>;

/**
 * Auth service interface for user authentication
 */
export interface IAuthService {
  configureSync(config: SyncConfig): Promise<void>;
  register(
    username: string,
    email: string,
    password: string,
  ): Promise<AuthResponse>;
  login(email: string, password: string): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(): Promise<void>;
  getStatus(): Promise<AuthStatus>;
  isAuthenticated(): Promise<boolean>;
  getAccessToken(): Promise<string | null>;
  getTokens(): Promise<{
    accessToken?: string;
    refreshToken?: string;
    userId?: string;
  }>;
  saveTokensExternal?(
    accessToken: string,
    refreshToken: string,
    userId: string,
  ): Promise<void>;
  getSyncConfig(): RequiredSyncConfig;
}
