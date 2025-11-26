import type { IDesktopManager } from './IDesktopManager.ts';

import { MacOSDesktopManager } from './MacOSDesktopManager.ts';
import { WindowsDesktopManager } from './WindowsDesktopManager.ts';

/**
 * Factory to create the appropriate desktop manager based on the current platform
 * @returns Platform-specific desktop manager instance, or null if platform unsupported
 */
export function createDesktopManager(): IDesktopManager | null {
  const platform = process.platform;

  console.debug(`[DesktopManagerFactory] Detected platform: ${platform}`);

  switch (platform) {
    case 'darwin':
      console.debug('[DesktopManagerFactory] Creating MacOSDesktopManager');
      return new MacOSDesktopManager();
    case 'win32':
      console.debug('[DesktopManagerFactory] Creating WindowsDesktopManager');
      return new WindowsDesktopManager();
    default:
      console.warn(`[DesktopManagerFactory] Unsupported platform: ${platform}`);
      return null;
  }
}
