import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Cloud,
  CloudOff,
  Mail,
  RefreshCw,
  Server,
  User,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@money-insight/ui/components/atoms";
import { getAuthService, getSyncService } from "@money-insight/ui/adapters";
import type {
  AuthStatus,
  SyncResult,
  SyncStatus,
} from "@money-insight/shared/types";

interface SyncSettingsProps {
  onLogout?: () => void;
}

export const SyncSettings: React.FC<SyncSettingsProps> = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [serverUrl, setServerUrl] = useState("http://localhost:3000");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const [auth, sync] = await Promise.all([
        getAuthService().getStatus(),
        getSyncService().getStatus(),
      ]);
      setAuthStatus(auth);
      setSyncStatus(sync);
      if (sync.serverUrl) {
        setServerUrl(sync.serverUrl);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleConfigureSync = async () => {
    try {
      await getAuthService().configureSync({
        serverUrl,
        appId: "money-insight",
        apiKey: "",
      });
      await loadStatus();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to configure sync");
    }
  };

  const handleSync = async () => {
    if (!authStatus?.isAuthenticated) {
      setError("You must be logged in to sync");
      return;
    }

    setIsSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const result = await getSyncService().syncNow();
      setSyncResult(result);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTimestamp = (timestamp?: string | number) => {
    if (!timestamp) return "Never";
    try {
      const date =
        typeof timestamp === "number"
          ? new Date(timestamp * 1000)
          : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-6">
      {/* Cloud Sync Status Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Cloud className="w-6 h-6 text-[#635BFF]" />
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2 text-[#111827]">
                Cloud Sync
              </h2>
              <p className="mb-4 text-[#6B7280]">
                Keep your data synchronized across devices
              </p>

              {/* Status indicator */}
              <div className="flex items-center gap-2 mb-4">
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#635BFF]" />
                ) : authStatus?.isAuthenticated ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <CloudOff className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm text-[#6B7280]">
                  {isSyncing
                    ? "Syncing..."
                    : authStatus?.isAuthenticated
                      ? "Connected"
                      : "Not logged in"}
                </span>
                {syncStatus?.lastSyncAt && (
                  <span className="text-xs text-[#9CA3AF]">
                    — Last sync: {formatTimestamp(syncStatus.lastSyncAt)}
                  </span>
                )}
              </div>
            </div>

            {/* Pending Changes Badge */}
            {syncStatus?.pendingChanges !== undefined &&
              syncStatus.pendingChanges > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/30">
                  <AlertCircle className="w-3 h-3" />
                  {syncStatus.pendingChanges} pending change
                  {syncStatus.pendingChanges !== 1 ? "s" : ""}
                </div>
              )}

            {/* Sync Result */}
            {syncResult && (
              <div
                className={`mt-3 p-4 rounded-lg border ${
                  syncResult.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {syncResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`font-semibold text-sm ${
                      syncResult.success ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {syncResult.success
                      ? "Sync completed"
                      : `Sync failed${syncResult.error ? `: ${syncResult.error}` : ""}`}
                  </span>
                </div>

                {syncResult.success && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-white/60">
                      <ArrowUpCircle className="w-4 h-4 mb-1 text-[#635BFF]" />
                      <span className="text-lg font-bold text-[#111827]">
                        {syncResult.pushed}
                      </span>
                      <span className="text-xs text-[#6B7280]">Pushed</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-white/60">
                      <ArrowDownCircle className="w-4 h-4 mb-1 text-[#635BFF]" />
                      <span className="text-lg font-bold text-[#111827]">
                        {syncResult.pulled}
                      </span>
                      <span className="text-xs text-[#6B7280]">Pulled</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-white/60">
                      <AlertTriangle
                        className={`w-4 h-4 mb-1 ${
                          syncResult.conflicts > 0
                            ? "text-amber-500"
                            : "text-[#9CA3AF]"
                        }`}
                      />
                      <span
                        className={`text-lg font-bold ${
                          syncResult.conflicts > 0
                            ? "text-amber-600"
                            : "text-[#111827]"
                        }`}
                      >
                        {syncResult.conflicts}
                      </span>
                      <span className="text-xs text-[#6B7280]">Conflicts</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-600">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {authStatus?.isAuthenticated && (
          <>
            <Button
              variant="default"
              className="w-full"
              onClick={handleSync}
              disabled={isSyncing || isLoadingStatus}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
              />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
          </>
        )}
      </div>

      {/* Account Info */}
      {authStatus?.isAuthenticated && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            {authStatus.username && (
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-[#635BFF]" />
                <span className="text-sm text-[#374151]">
                  {authStatus.username}
                </span>
              </div>
            )}
            {authStatus.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#635BFF]" />
                <span className="text-sm text-[#374151]">
                  {authStatus.email}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Server Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Server Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="server-url" className="mb-2 block">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#635BFF]" />
                Server URL
              </div>
            </Label>
            <Input
              id="server-url"
              type="text"
              placeholder="http://localhost:3000"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              disabled={isLoadingStatus}
            />
          </div>
          <Button
            variant="secondary"
            className="w-full mt-3"
            onClick={handleConfigureSync}
            disabled={isLoadingStatus || !serverUrl}
          >
            Save Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
