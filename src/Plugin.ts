import { Notice } from 'obsidian';
import { PluginBase } from 'obsidian-dev-utils/obsidian/Plugin/PluginBase';

import type { PluginTypes } from './PluginTypes.ts';

import type { Desktop } from './DesktopManagers/WindowsDesktopManager.ts';
import {
  cleanupPersistentPwsh,
  getVirtualDesktops,
  switchToDesktop,
} from './DesktopManagers/WindowsDesktopManager.ts';
import { PluginSettingsManager } from './PluginSettingsManager.ts';
import { PluginSettingsTab } from './PluginSettingsTab.ts';

// Define the workspace plugin interface based on its actual structure
interface WorkspacePluginInstance {
  activeWorkspace: string;
}

export class Plugin extends PluginBase<PluginTypes> {
  private previousWorkspace = '';

  protected override createSettingsManager(): PluginSettingsManager {
    return new PluginSettingsManager(this);
  }

  protected override createSettingsTab(): null | PluginSettingsTab {
    return new PluginSettingsTab(this);
  }

  protected override async onLayoutReady(): Promise<void> {
    await super.onLayoutReady();

    // Initialize workspace tracking
    const workspacePlugin = this.getWorkspacePlugin();
    if (workspacePlugin) {
      this.previousWorkspace = workspacePlugin.activeWorkspace;
    }
  }

  protected override async onloadImpl(): Promise<void> {
    await super.onloadImpl();

    // Register layout-change event to sync workspaces with virtual desktops
    this.registerEvent(
      this.app.workspace.on('layout-change', this.handleLayoutChange.bind(this)),
    );

    console.info('[Desktop Workspace Switcher] Plugin loaded, layout-change listener registered');
  }

  protected override async onunloadImpl(): Promise<void> {
    await super.onunloadImpl();

    // Clean up the persistent PowerShell process
    cleanupPersistentPwsh();
    console.info('[Desktop Workspace Switcher] Plugin unloaded, PowerShell process cleaned up');
  }

  private getWorkspacePlugin(): undefined | WorkspacePluginInstance {
    return this.app.internalPlugins.getPluginById('workspaces')?.instance as
      | undefined
      | WorkspacePluginInstance;
  }

  private handleLayoutChange(): void {
    if (!this.settings.enabled) {
      return;
    }

    (async (): Promise<void> => {
      const eventStartTime = performance.now();
      const workspacePlugin = this.getWorkspacePlugin();

      if (workspacePlugin === undefined) {
        console.error('[Desktop Workspace Switcher] Workspace plugin not found or not enabled.');
        return;
      }

      const activeWorkspace = workspacePlugin.activeWorkspace;

      // Get list of virtual desktops once (optimization: avoid multiple calls)
      const virtualDesktops = await getVirtualDesktops();
      const currentDesktop = virtualDesktops?.find((d) => d.visible) ?? null;
      const fetchEndTime = performance.now();
      console.log(
        `[layout-change] Desktop fetch took ${(fetchEndTime - eventStartTime).toFixed(0)}ms`,
      );

      const message = [
        ' desktop-workspace-sync layout change detected',
        `   previousWorkspace: ${this.previousWorkspace}`,
        `   activeWorkspace:   ${activeWorkspace}`,
        `   currentDesktop:    ${String(currentDesktop)}`,
      ].join('\n');

      if (currentDesktop === null) {
        console.error(`No current desktop detected, aborting switch. ${message}`);
        return;
      }

      if (virtualDesktops && activeWorkspace) {
        const workspaceExists = virtualDesktops.some(
          (desktop) => desktop.name === activeWorkspace,
        );

        const firstDesktop = virtualDesktops[0];
        const isOnFirstDesktop =
          firstDesktop !== undefined && currentDesktop.name === firstDesktop.name;

        // Only skip if workspace doesn't exist AND we're already on the first (default) desktop
        if (!workspaceExists && isOnFirstDesktop) {
          console.debug(
            `Active workspace '${activeWorkspace}' not found and already on default desktop '${currentDesktop.name}', skipping switch`,
          );
          return;
        }
      }

      if (activeWorkspace === currentDesktop.name) {
        console.info(`workspace is already active on desktop, no switch needed.${message}`);
      }
      else {
        console.info(`switching to desktop: ${activeWorkspace}${message}`);
        this.previousWorkspace = activeWorkspace;

        await switchToDesktop(
          activeWorkspace,
          null,
          (success: Desktop) => {
            console.info(`Switched to desktop: ${success.name}`);

            if (!this.settings.showNotices) {
              return;
            }

            // Only show notice if we actually switched to the requested workspace
            if (success.name === activeWorkspace) {
              new Notice(`Switched to desktop: ${activeWorkspace}`);
            }
            else {
              new Notice(`Switched to desktop: ${success.name} (${activeWorkspace} not found)`);
            }
          },
          (error: string) => {
            console.error(`Failed to switch to desktop: ${activeWorkspace}. Error: ${error}`);
            if (this.settings.showNotices) {
              new Notice(`Failed to switch to desktop: ${activeWorkspace}. Error: ${error}`);
            }
          },
          virtualDesktops, // Pass pre-fetched desktops to avoid redundant calls
        );
      }
    })().catch((error) => {
      console.error('[Desktop Workspace Switcher] Error in layout-change handler:', error);
    });
  }
}
