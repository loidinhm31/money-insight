import { type ReactNode } from "react";
import { useServerConnection } from "@money-insight/ui/hooks";
import { isOpenedFromDesktop } from "@money-insight/ui/utils";
import { DisconnectedOverlay } from "@money-insight/ui/components/organisms";

interface BrowserSyncInitializerProps {
  children: ReactNode;
}

/**
 * Wrapper component that handles desktop-browser sync.
 * Only shows DisconnectedOverlay when opened from the desktop app.
 */
export function BrowserSyncInitializer({
  children,
}: BrowserSyncInitializerProps) {
  const { isDisconnected } = useServerConnection();

  return (
    <>
      {isOpenedFromDesktop() && isDisconnected && <DisconnectedOverlay />}
      {children}
    </>
  );
}
