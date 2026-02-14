import { getSyncService } from "@money-insight/ui/adapters";
import type {
  SyncProgress,
  SyncResult,
  SyncStatus,
} from "@money-insight/shared/types";

export async function syncNow(): Promise<SyncResult> {
  return getSyncService().syncNow();
}

export async function getStatus(): Promise<SyncStatus> {
  return getSyncService().getStatus();
}

export async function syncWithProgress(
  onProgress: (progress: SyncProgress) => void,
): Promise<SyncResult> {
  const svc = getSyncService();
  if (svc.syncWithProgress) {
    return svc.syncWithProgress(onProgress);
  }
  return svc.syncNow();
}
