const DEFAULT_POLL_INTERVAL_MS = 500;

export class PluginSettings {
  /** Enable or disable workspace-to-desktop synchronization */
  public enabled = true;

  /**
   * Enable macOS sync functionality
   * Set to false if you want to disable macOS-specific features
   */
  public enableMacOSSync = true;

  /**
   * Poll interval in milliseconds for detecting space changes (macOS only)
   * Default: 500ms
   */
  public pollInterval = DEFAULT_POLL_INTERVAL_MS;

  /** Show notices when switching desktops */
  public showNotices = true;

  /**
   * Optional custom mapping from space index to workspace name (macOS only)
   * Example: { "1": "Main", "2": "Code", "3": "Research" }
   */
  public spaceToWorkspaceMapping: Record<string, string> = {};
}
