/**
 * Centralized auth storage keys for glean-hub ecosystem.
 *
 * These keys are shared across all apps (glean-hub-app, fin-catch, money-insight, etc.)
 * to enable single sign-on via localStorage.
 */
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: "glean-hub-access-token",
  REFRESH_TOKEN: "glean-hub-refresh-token",
  USER_ID: "glean-hub-user-id",
  APPS: "glean-hub-apps",
  IS_ADMIN: "glean-hub-is-admin",
  SERVER_URL: "glean-hub-server-url",
  APP_ID: "glean-hub-app-id",
  API_KEY: "glean-hub-api-key",
  OTP_TYPE: "glean-hub-otp-type",
} as const;

export type AuthStorageKey =
  (typeof AUTH_STORAGE_KEYS)[keyof typeof AUTH_STORAGE_KEYS];
