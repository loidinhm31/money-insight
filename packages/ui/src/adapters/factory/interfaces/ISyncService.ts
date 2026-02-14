import {
  SyncProgress,
  SyncResult,
  SyncStatus,
} from "@money-insight/shared/types";

export interface ISyncService {
  /**
   * Trigger a sync operation
   * Pushes local changes and pulls remote changes
   */
  syncNow(): Promise<SyncResult>;

  /**
   * Get current sync status
   */
  getStatus(): Promise<SyncStatus>;

  /**
   * Trigger a sync operation with progress updates
   * Optional method for platforms that support progress reporting
   */
  syncWithProgress?(
    onProgress: (progress: SyncProgress) => void,
  ): Promise<SyncResult>;
}
