import { Desktop } from '../Desktop.ts';

/**
 * Interface for platform-specific desktop/space managers.
 * Implementations handle virtual desktop operations for Windows, macOS, etc.
 */
export interface IDesktopManager {
  /**
   * Get the currently active desktop/space
   * @returns The current desktop, or null if unable to determine
   */
  getCurrentDesktop(): Promise<Desktop | null>;

  /**
   * Get all available virtual desktops/spaces
   * @param useCache Whether to use cached data if available
   * @returns Array of desktops, or undefined if unavailable
   */
  getVirtualDesktops(useCache?: boolean): Promise<Desktop[] | undefined>;

  /**
   * Switch to a desktop/space by name
   * @param desktopOfName Primary desktop name to switch to
   * @param desktopOfNameIfNotFound Fallback desktop name if primary not found
   * @param onSuccess Callback invoked on successful switch
   * @param onFailure Callback invoked on failure
   * @param preloadedDesktops Optional pre-fetched desktop list to avoid redundant queries
   */
  switchToDesktop(
    desktopOfName: string,
    desktopOfNameIfNotFound: string | null,
    onSuccess: (desktop: Desktop) => void,
    onFailure: (error: string) => void,
    preloadedDesktops?: Desktop[]
  ): Promise<void>;

  /**
   * Check if the desktop manager is available on this system
   * @returns true if the manager can be used, false otherwise
   */
  isAvailable(): Promise<boolean>;

  /**
   * Clean up any resources (persistent processes, listeners, etc.)
   */
  cleanup(): void;

  /**
   * Clear any cached desktop data
   */
  clearCache(): void;
}
