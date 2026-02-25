export { AUTH_STORAGE_KEYS, type AuthStorageKey } from "./auth";
export const SUPPORTED_CURRENCIES = ["VND", "USD", "EUR"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
