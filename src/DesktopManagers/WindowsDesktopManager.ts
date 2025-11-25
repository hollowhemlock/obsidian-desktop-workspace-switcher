// eslint-disable-next-line import-x/no-nodejs-modules -- Required for spawning PowerShell process to control Windows virtual desktops
import {
  ChildProcess,
  spawn
} from 'child_process';

import { Desktop } from '../Desktop.ts';

import type { IDesktopManager } from './IDesktopManager.ts';

// Cache for desktop list (500ms TTL to avoid excessive PowerShell spawns)
let desktopCache: { desktops: Desktop[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 500;

// Persistent PowerShell process for faster command execution
let persistentPwsh: ChildProcess | null = null;

/**
 * Windows Desktop Manager using PSVirtualDesktop PowerShell module
 * Manages Windows virtual desktops via persistent PowerShell process
 */
export class WindowsDesktopManager implements IDesktopManager {
  public async getCurrentDesktop(): Promise<Desktop | null> {
    const desktops = await this.getVirtualDesktops();
    if (desktops) {
      const currentDesktop = desktops.find((desktop) => desktop.visible);
      if (currentDesktop) {
        return currentDesktop;
      }
    }

    return null;
  }

  public async getVirtualDesktops(
    useCache = true
  ): Promise<Desktop[] | undefined> {
    // Check cache if enabled
    if (
      useCache && desktopCache
      && Date.now() - desktopCache.timestamp < CACHE_TTL_MS
    ) {
      console.debug(
        `[getVirtualDesktops] Using cached desktops (age: ${
          String(Date.now() - desktopCache.timestamp)
        }ms)`
      );
      return desktopCache.desktops;
    }

    const startTime = performance.now();
    try {
      const stdout = await execViaPersistentPwsh(
        'Get-DesktopList | ConvertTo-Json'
      );
      const endTime = performance.now();
      console.debug(
        `[getVirtualDesktops] PowerShell command took ${
          (endTime - startTime).toFixed(0)
        }ms`
      );

      interface RawDesktop {
        Name: string;
        Number: number;
        Visible: boolean;
      }

      // Parse the desktop list JSON
      const desktops = JSON.parse(stdout) as unknown as RawDesktop[];

      // Create Desktop instances
      const desktopData: Desktop[] = desktops.map(
        (desktop: RawDesktop) =>
          new Desktop(desktop.Number, desktop.Name, desktop.Visible)
      );

      // Update cache - using a separate variable to avoid race condition
      const newCache = { desktops: desktopData, timestamp: Date.now() };
      // eslint-disable-next-line require-atomic-updates -- Cache update is intentionally non-atomic; race condition is acceptable for performance caching
      desktopCache = newCache;

      return desktopData;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Error executing PowerShell command: ${errorMsg}`);
      return undefined;
    }
  }

  public async switchToDesktop(
    desktopOfName: string,
    // eslint-disable-next-line default-param-last -- Keeping parameter order for API compatibility with callbacks at the end
    desktopOfNameIfNotFound: null | string = null,
    onSuccess: (desktop: Desktop) => void,
    onFailure: (error: string) => void,
    preloadedDesktops?: Desktop[]
  ): Promise<void> {
    const totalStartTime = performance.now();
    console.debug(
      `[switchToDesktop] Attempting to switch to desktop: ${desktopOfName}`
    );

    try {
      // Use preloaded desktops if provided, otherwise fetch
      const desktops = preloadedDesktops ?? await this.getVirtualDesktops();
      if (!desktops || desktops.length === 0) {
        onFailure('No virtual desktops found');
        return;
      }

      // Determine which desktop to switch to
      let targetDesktop = desktops.find((d) => d.name === desktopOfName);

      if (!targetDesktop && desktopOfNameIfNotFound) {
        console.debug(
          `Desktop '${desktopOfName}' not found, trying fallback '${desktopOfNameIfNotFound}'`
        );
        targetDesktop = desktops.find((d) => d.name === desktopOfNameIfNotFound);
      }

      if (!targetDesktop) {
        console.debug(
          'Neither primary nor fallback desktop found, switching to first available desktop'
        );
        const firstDesktop = desktops[0];
        if (!firstDesktop) {
          onFailure('No virtual desktops available');
          return;
        }
        targetDesktop = firstDesktop;
      }

      const finalTarget = targetDesktop;
      console.debug(
        `[switchToDesktop] Switching to desktop: ${finalTarget.name}`
      );

      const switchStartTime = performance.now();
      try {
        await execViaPersistentPwsh(`Switch-Desktop '${finalTarget.name}'`);
        const switchEndTime = performance.now();
        console.debug(
          `[switchToDesktop] Switch command took ${
            (switchEndTime - switchStartTime).toFixed(0)
          }ms`
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Switch error: ${errorMsg}`);
        onFailure(
          `Failed to switch to desktop '${finalTarget.name}': ${errorMsg}`
        );
        return;
      }

      // Invalidate cache after switch since active desktop changed
      desktopCache = null;

      const totalEndTime = performance.now();
      console.debug(
        `[switchToDesktop] Total operation took ${
          (totalEndTime - totalStartTime).toFixed(0)
        }ms`
      );

      // Switch was successful, return the target desktop (optimization: avoid extra fetch)
      onSuccess(finalTarget);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Error switching to desktop '${desktopOfName}': ${errorMsg}`);
      onFailure(`Error switching to desktop '${desktopOfName}': ${errorMsg}`);
    }
  }

  public async isAvailable(): Promise<boolean> {
    try {
      // Check if PowerShell and PSVirtualDesktop module are available
      const desktops = await this.getVirtualDesktops(false);
      return desktops !== undefined && desktops.length > 0;
    } catch {
      return false;
    }
  }

  public cleanup(): void {
    if (persistentPwsh) {
      console.debug('[PowerShell] Cleaning up persistent process...');
      persistentPwsh.kill();
      persistentPwsh = null;
    }
  }

  public clearCache(): void {
    desktopCache = null;
  }
}

// Execute command via persistent PowerShell process
async function execViaPersistentPwsh(command: string): Promise<string> {
  initPersistentPwsh();

  const pwsh = persistentPwsh;
  if (!pwsh?.stdin || !pwsh.stdout || !pwsh.stderr) {
    throw new Error('PowerShell process not available');
  }

  // Capture references after null check for TypeScript narrowing
  const stdin = pwsh.stdin;
  const stdout = pwsh.stdout;
  const stderr = pwsh.stderr;

  return new Promise((resolve, reject) => {
    const marker = `__END_${String(Date.now())}__`;
    const wrappedCommand =
      `try { ${command}; Write-Output '${marker}' } catch { Write-Error $_ }`;

    let output = '';
    let errorOutput = '';

    function onData(data: Buffer): void {
      const chunk = data.toString();
      output += chunk;

      if (output.includes(marker)) {
        cleanup();
        const result = output.split(marker)[0] ?? '';
        resolve(result.trim());
      }
    }

    function onError(data: Buffer): void {
      errorOutput += data.toString();
    }

    function onClose(): void {
      cleanup();
      if (errorOutput) {
        reject(new Error(errorOutput));
      } else {
        reject(new Error('PowerShell process closed unexpectedly'));
      }
    }

    function cleanup(): void {
      stdout.off('data', onData);
      stderr.off('data', onError);
      pwsh?.off('close', onClose);
    }

    stdout.on('data', onData);
    stderr.on('data', onError);
    pwsh.on('close', onClose);

    stdin.write(`${wrappedCommand}\n`);
  });
}

// Initialize persistent PowerShell process
function initPersistentPwsh(): void {
  if (persistentPwsh) {
    return;
  }

  console.debug('[PowerShell] Starting persistent PowerShell process...');
  const startTime = performance.now();

  persistentPwsh = spawn('pwsh', ['-NoProfile', '-NoLogo', '-Command', '-'], {
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  persistentPwsh.on('error', (error) => {
    console.error('[PowerShell] Process error:', error);
    persistentPwsh = null;
  });

  persistentPwsh.on('exit', (code) => {
    console.debug(`[PowerShell] Process exited with code ${String(code)}`);
    persistentPwsh = null;
  });

  const endTime = performance.now();
  console.debug(
    `[PowerShell] Process started in ${(endTime - startTime).toFixed(0)}ms`
  );
}
