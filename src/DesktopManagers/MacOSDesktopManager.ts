// eslint-disable-next-line import-x/no-nodejs-modules -- Required for executing yabai commands
import { exec } from 'child_process';
// eslint-disable-next-line import-x/no-nodejs-modules -- Required for promisifying Node.js exec
import { promisify } from 'util';

import type { IDesktopManager } from './IDesktopManager.ts';

import { Desktop } from '../Desktop.ts';

const execAsync = promisify(exec);

// Cache for space list (500ms TTL to avoid excessive yabai queries)
let spaceCache: { spaces: Desktop[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 500;

/**
 * MacOS Desktop Manager using yabai window manager
 * Manages Mission Control Spaces via yabai CLI
 */
export class MacOSDesktopManager implements IDesktopManager {
  private yabaiAvailable: boolean | null = null;

  public cleanup(): void {
    // No persistent processes to clean up (unlike Windows PowerShell)
    console.debug('[MacOSDesktopManager] Cleanup called (no-op)');
  }

  public clearCache(): void {
    spaceCache = null;
  }

  public async getCurrentDesktop(): Promise<Desktop | null> {
    const spaces = await this.getVirtualDesktops();
    if (spaces) {
      const currentSpace = spaces.find((space) => space.visible);
      if (currentSpace) {
        return currentSpace;
      }
    }

    return null;
  }

  public async getVirtualDesktops(
    useCache = true
  ): Promise<Desktop[] | undefined> {
    // Check cache if enabled
    if (
      useCache && spaceCache
      && Date.now() - spaceCache.timestamp < CACHE_TTL_MS
    ) {
      console.debug(
        `[getVirtualDesktops] Using cached spaces (age: ${String(Date.now() - spaceCache.timestamp)}ms)`
      );
      return spaceCache.spaces;
    }

    const startTime = performance.now();
    try {
      const { stdout } = await execAsync('yabai -m query --spaces');
      const endTime = performance.now();
      console.debug(
        `[getVirtualDesktops] yabai command took ${(endTime - startTime).toFixed(0)}ms`
      );

      interface YabaiSpace {
        'has-focus': boolean;
        'index': number;
        'is-visible': boolean;
        'label': string;
      }

      // Parse the space list JSON
      const spaces = JSON.parse(stdout) as unknown as YabaiSpace[];

      // Create Desktop instances
      const spaceData: Desktop[] = spaces.map(
        (space: YabaiSpace) =>
          new Desktop(
            space.index,
            space.label || `Space ${String(space.index)}`,
            space['has-focus']
          )
      );

      // Update cache
      const newCache = { spaces: spaceData, timestamp: Date.now() };
      // eslint-disable-next-line require-atomic-updates -- Cache update is intentionally non-atomic; race condition is acceptable for performance caching
      spaceCache = newCache;

      return spaceData;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Error executing yabai command: ${errorMsg}`);
      return undefined;
    }
  }

  public async isAvailable(): Promise<boolean> {
    // Cache the availability check
    if (this.yabaiAvailable !== null) {
      return this.yabaiAvailable;
    }

    try {
      const TIMEOUT_MS = 2000;
      // Check if yabai is available and responsive
      await execAsync('yabai -m query --spaces', { timeout: TIMEOUT_MS });
      this.yabaiAvailable = true;
      console.debug('[MacOSDesktopManager] yabai is available');
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[MacOSDesktopManager] yabai not available: ${errorMsg}`);
      this.yabaiAvailable = false;
      return false;
    }
  }

  public async switchToDesktop(
    desktopOfName: string,
    // eslint-disable-next-line default-param-last -- Keeping parameter order for API compatibility
    desktopOfNameIfNotFound: null | string = null,
    onSuccess: (desktop: Desktop) => void,
    onFailure: (error: string) => void,
    preloadedDesktops?: Desktop[]
  ): Promise<void> {
    const totalStartTime = performance.now();
    console.debug(
      `[switchToDesktop] Attempting to switch to space: ${desktopOfName}`
    );

    try {
      // Use preloaded spaces if provided, otherwise fetch
      const spaces = preloadedDesktops ?? await this.getVirtualDesktops();
      if (!spaces || spaces.length === 0) {
        onFailure('No spaces found');
        return;
      }

      // Determine which space to switch to
      let targetSpace = spaces.find((d) => d.name === desktopOfName);

      if (!targetSpace && desktopOfNameIfNotFound) {
        console.debug(
          `Space '${desktopOfName}' not found, trying fallback '${desktopOfNameIfNotFound}'`
        );
        targetSpace = spaces.find((d) => d.name === desktopOfNameIfNotFound);
      }

      if (!targetSpace) {
        console.debug(
          'Neither primary nor fallback space found, switching to first available space'
        );
        const firstSpace = spaces[0];
        if (!firstSpace) {
          onFailure('No spaces available');
          return;
        }
        targetSpace = firstSpace;
      }

      const finalTarget = targetSpace;
      console.debug(
        `[switchToDesktop] Switching to space: ${finalTarget.name} (index ${String(finalTarget.number)})`
      );

      const switchStartTime = performance.now();
      try {
        await execAsync(`yabai -m space --focus ${String(finalTarget.number)}`);
        const switchEndTime = performance.now();
        console.debug(
          `[switchToDesktop] Switch command took ${(switchEndTime - switchStartTime).toFixed(0)}ms`
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Switch error: ${errorMsg}`);
        onFailure(
          `Failed to switch to space '${finalTarget.name}': ${errorMsg}`
        );
        return;
      }

      // Invalidate cache after switch since active space changed
      spaceCache = null;

      const totalEndTime = performance.now();
      console.debug(
        `[switchToDesktop] Total operation took ${(totalEndTime - totalStartTime).toFixed(0)}ms`
      );

      // Switch was successful
      onSuccess(finalTarget);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Error switching to space '${desktopOfName}': ${errorMsg}`);
      onFailure(`Error switching to space '${desktopOfName}': ${errorMsg}`);
    }
  }
}
