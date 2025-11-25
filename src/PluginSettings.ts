export class PluginSettings {
  /** Enable or disable workspace-to-desktop synchronization */
  public enabled = true;

  /** Show notices when switching desktops */
  public showNotices = true;

  /**
   * Optional custom mapping from space index to workspace name (macOS only)
   * Example: { "1": "Main", "2": "Code", "3": "Research" }
   */
  public spaceToWorkspaceMapping: Record<string, string> = {};

  /**
   * Poll interval in milliseconds for detecting space changes (macOS only)
   * Default: 500ms
   */
  public pollInterval = 500;

  /**
   * Enable macOS sync functionality
   * Set to false if you want to disable macOS-specific features
   */
  public enableMacOSSync = true;
}
