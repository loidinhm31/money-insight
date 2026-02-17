import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Cloud,
  CloudOff,
  RefreshCw,
  Server,
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
import * as authService from "@money-insight/ui/services/authService";
import * as syncService from "@money-insight/ui/services/syncService";
import type {
  AuthStatus,
  SyncProgress,
  SyncResult,
  SyncStatus,
} from "@money-insight/shared/types";
import { isTauri } from "@money-insight/ui/utils";

interface SyncSettingsProps {
  onLogout?: () => void;
}

export const SyncSettings: React.FC<SyncSettingsProps> = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [serverUrl, setServerUrl] = useState("http://localhost:3000");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
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
        authService.getStatus(),
        syncService.getStatus(),
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
      await authService.configureSync({
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
    setSyncProgress(null);

    try {
      const result = await syncService.syncWithProgress(
        (progress: SyncProgress) => {
          setSyncProgress(progress);
        },
      );
      setSyncResult(result);

      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
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
            <Cloud className="w-6 h-6 text-primary" />
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2 text-foreground">
                Cloud Sync
              </h2>
              <p className="mb-4 text-muted-foreground">
                Keep your data synchronized across devices
              </p>

              {/* Status indicator */}
              <div className="flex items-center gap-2 mb-4">
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                ) : authStatus?.isAuthenticated ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <CloudOff className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isSyncing
                    ? "Syncing..."
                    : authStatus?.isAuthenticated
                      ? "Connected"
                      : "Not logged in"}
                </span>
                {syncStatus?.lastSyncAt && (
                  <span className="text-xs text-muted-foreground/80">
                    — Last sync: {formatTimestamp(syncStatus.lastSyncAt)}
                  </span>
                )}
              </div>

              {/* Sync Progress */}
              {isSyncing && syncProgress && (
                <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm font-medium text-secondary-foreground">
                      {syncProgress.phase === "pushing" ? "Pushing" : "Pulling"}{" "}
                      records...
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <ArrowUpCircle className="w-3 h-3 text-primary" />
                      <span>Pushed: {syncProgress.recordsPushed}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowDownCircle className="w-3 h-3 text-primary" />
                      <span>Pulled: {syncProgress.recordsPulled}</span>
                    </div>
                  </div>
                  {syncProgress.phase === "pulling" && (
                    <div className="mt-2 text-xs text-muted-foreground/70">
                      Page {syncProgress.currentPage}
                      {syncProgress.hasMore && " — more records available"}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pending Changes Badge */}
            {syncStatus?.pendingChanges !== undefined &&
              syncStatus.pendingChanges > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/30">
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
                    ? "bg-success/5 border-success/30"
                    : "bg-destructive/5 border-destructive/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {syncResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span
                    className={`font-semibold text-sm ${
                      syncResult.success ? "text-success" : "text-destructive"
                    }`}
                  >
                    {syncResult.success
                      ? "Sync completed"
                      : `Sync failed${syncResult.error ? `: ${syncResult.error}` : ""}`}
                  </span>
                </div>

                {syncResult.success && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-card/60">
                      <ArrowUpCircle className="w-4 h-4 mb-1 text-primary" />
                      <span className="text-lg font-bold text-foreground">
                        {syncResult.pushed}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Pushed
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-card/60">
                      <ArrowDownCircle className="w-4 h-4 mb-1 text-primary" />
                      <span className="text-lg font-bold text-foreground">
                        {syncResult.pulled}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Pulled
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-card/60">
                      <AlertTriangle
                        className={`w-4 h-4 mb-1 ${
                          syncResult.conflicts > 0
                            ? "text-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`text-lg font-bold ${
                          syncResult.conflicts > 0
                            ? "text-warning"
                            : "text-foreground"
                        }`}
                      >
                        {syncResult.conflicts}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Conflicts
                      </span>
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
        <div className="p-3 rounded-lg text-sm bg-destructive/10 border border-destructive/30 text-destructive">
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

      {/* Server Configuration - Only shown in Tauri (native) mode */}
      {isTauri() && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Server Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="server-url" className="mb-2 block">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" />
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
      )}
    </div>
  );
};
