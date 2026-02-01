import type { SyncResult, SyncStatus } from "@money-insight/shared/types";
import type { ISyncService } from "@/adapters/factory/interfaces";
import { invoke } from "@tauri-apps/api/core";

export class TauriSyncAdapter implements ISyncService {
  async syncNow(): Promise<SyncResult> {
    return invoke<SyncResult>("sync_now");
  }

  async getStatus(): Promise<SyncStatus> {
    return invoke<SyncStatus>("sync_get_status");
  }
}
