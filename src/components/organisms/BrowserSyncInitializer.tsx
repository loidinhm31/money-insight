import { type ReactNode } from "react";
import { useServerConnection } from "../../hooks";
import { isOpenedFromDesktop } from "../../utils";
import { DisconnectedOverlay } from ".";

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
