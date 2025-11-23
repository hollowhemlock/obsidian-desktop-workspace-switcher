import type {
  Desktop,
} from '/src/ctk/modules/extl/desktop-workspace-sync/windows-desktop-manager.ts';
import type {
  App,
  EventRef,
} from 'obsidian';

import { Notice } from 'obsidian';

import {
  cleanupPersistentPwsh,
  getVirtualDesktops,
  switchToDesktop,
} from '/src/ctk/modules/extl/desktop-workspace-sync/windows-desktop-manager.ts';

// Define the workspace plugin interface based on its actual structure
interface WorkspacePluginInstance {
  activeWorkspace: string;
}

export function cleanup(_app: App): void {
  // Executes when the invocable is unloaded
  console.warn('Workspace switcher cleanup invoked');
  cleanupPersistentPwsh();
}

export function invoke(app: App): void {
  try {
    cleanupEventRefs(app);

    const workspacePlugin = app.internalPlugins.getPluginById(
      'workspaces',
    )
      ?.instance as undefined | WorkspacePluginInstance;

    if (workspacePlugin === undefined) {
      console.error('Workspace plugin not found or not enabled.');
      return;
    }

    let previousWorkspace = workspacePlugin.activeWorkspace;
    let _lastKnownDesktop: Desktop | null = null;

    const eventRef = app.workspace.on('layout-change', () => {
      (async (): Promise<void> => {
        const eventStartTime = performance.now();
        const activeWorkspace = workspacePlugin.activeWorkspace;

        // Get list of virtual desktops once (optimization: avoid multiple calls)
        const virtualDesktops = await getVirtualDesktops();
        const currentDesktop = virtualDesktops?.find((d) => d.visible) ?? null;
        const fetchEndTime = performance.now();
        console.log(
          `[layout-change] Desktop fetch took ${
            (fetchEndTime - eventStartTime).toFixed(0)
          }ms`,
        );

        console.debug();
        const message = [
          ` desktop-workspace-sync layout change detected`,
          `   previousWorkspace: ${previousWorkspace}`,
          `   activeWorkspace:   ${activeWorkspace}`,
          `   currentDesktop:    ${String(currentDesktop)}`,
        ].join('\n');

        if (currentDesktop === null) {
          console.error(
            `No current desktop detected, aborting switch. ${message}`,
          );
          return;
        }
        if (virtualDesktops && activeWorkspace) {
          const workspaceExists = virtualDesktops.some((desktop) =>
            desktop.name === activeWorkspace
          );

          const isOnFirstDesktop = virtualDesktops.length > 0
            && currentDesktop.name === virtualDesktops[0].name;

          // Only skip if workspace doesn't exist AND we're already on the first (default) desktop
          if (!workspaceExists && isOnFirstDesktop) {
            console.debug(
              `Active workspace '${activeWorkspace}' not found and already on default desktop '${currentDesktop.name}', skipping switch`,
            );
            return;
          }
        }

        if (activeWorkspace === currentDesktop.name) {
          console.info(
            `workspace is already active on desktop, no switch needed.${message}`,
          );
          _lastKnownDesktop = currentDesktop;
        }
        else {
          console.info(`switching to desktop: ${activeWorkspace}${message}`);
          previousWorkspace = activeWorkspace;

          await switchToDesktop(
            activeWorkspace,
            null,
            (success: Desktop) => {
              _lastKnownDesktop = success;
              console.info(`Switched to desktop: ${success.name}`);
              // Only show notice if we actually switched to the requested workspace
              if (success.name === activeWorkspace) {
                new Notice(`Switched to desktop: ${activeWorkspace}`);
              }
              else {
                new Notice(
                  `Switched to desktop: ${success.name} (${activeWorkspace} not found)`,
                );
              }
            },
            (error: string) => {
              console.error(
                `Failed to switch to desktop: ${activeWorkspace}. Error: ${error}`,
              );
              new Notice(
                `Failed to switch to desktop: ${activeWorkspace}. Error: ${error}`,
              );
            },
            virtualDesktops, // Pass pre-fetched desktops to avoid redundant calls
          );
        }
      })().catch((error) => {
        console.error('Error in layout-change handler:', error);
      });
    });

    console.info('Workspace layout change listener registered');

    // Store the event reference so it can be unregistered if needed
    // Note: In a real plugin, you would use this.registerEvent() and store the reference
    // For this invocable, the event will remain registered until Obsidian restarts
    pushEventRef(app, eventRef);
    console.log('Event references:', getEventRefs(app));
  }
  catch (error) {
    console.error('Error occurred while invoking workspace switcher:', error);
  }
}

function cleanupEventRefs(app: App): void {
  const eventRefs = getEventRefs(app);
  eventRefs.forEach((ref) => {
    app.workspace.offref(ref);
  });
}

function getEventRefs(app: App): EventRef[] {
  return (app as { desktopWorkspaceSyncEventRefs?: EventRef[] } & App)
    .desktopWorkspaceSyncEventRefs ?? [];
}

function pushEventRef(app: App, eventRef: EventRef): void {
  const appWithRefs = app as
    & { desktopWorkspaceSyncEventRefs?: EventRef[] }
    & App;
  if (appWithRefs.desktopWorkspaceSyncEventRefs === undefined) {
    appWithRefs.desktopWorkspaceSyncEventRefs = [eventRef];
  }
  else {
    appWithRefs.desktopWorkspaceSyncEventRefs.push(eventRef);
  }
}
