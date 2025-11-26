# Desktop Workspace Switcher

This is a plugin for [Obsidian](https://obsidian.md/) that Automatically match and sync Obsidian workspaces with virtual desktops. Switch workspaces to instantly change between your virtual desktops or Spaces.

## Dependencies

### Windows

This plugin requires the [PSVirtualDesktop PowerShell module](https://github.com/MScholtes/PSVirtualDesktop) to be installed on Windows systems.

To install it, run the following command in PowerShell as Administrator:

```powershell
Install-Module VirtualDesktop
```

For more information and alternative installation methods, see the [PSVirtualDesktop documentation](https://github.com/MScholtes/PSVirtualDesktop?tab=readme-ov-file).

### macOS

This plugin requires [yabai](https://github.com/koekeishiya/yabai), a tiling window manager for macOS that provides programmatic control over Spaces (virtual desktops).

#### Installing yabai

Install yabai via Homebrew:

```bash
brew install koekeishiya/formulae/yabai
```

Start the yabai service:

```bash
yabai --start-service
```

#### System Requirements

- **Mission Control Setting**: In System Settings > Desktop & Dock > Mission Control, ensure "Displays have separate Spaces" is enabled.
- **Permissions**: Grant yabai the necessary Accessibility permissions when prompted.

#### System Integrity Protection (SIP)

Basic space switching works without disabling SIP. However, for advanced features (like programmatic space manipulation), you may need to partially disable SIP:

- **Basic features** (querying spaces, switching): Work with SIP enabled
- **Advanced features** (creating/destroying spaces, moving windows): Require partial SIP disabling

To partially disable SIP for yabai:

1. Boot into Recovery Mode (hold Cmd+R during startup)
2. Open Terminal from the Utilities menu
3. Run the appropriate command for your Mac:

**For Apple Silicon (M1/M2/M3):**

```bash
csrutil disable --with kext --with dtrace --with basesystem
```

**For Intel Macs:**

```bash
csrutil disable --with kext --with dtrace --with nvram --with basesystem
```

1. Restart your Mac

For more details, see the [yabai wiki on disabling SIP](https://github.com/koekeishiya/yabai/wiki/Disabling-System-Integrity-Protection).

**Note**: This plugin's core functionality (workspace-to-space synchronization) works without disabling SIP.

## Installation

The plugin is not available in [the official Community Plugins repository](https://obsidian.md/plugins) yet.

### Beta versions

To install the latest beta release of this plugin (regardless if it is available in [the official Community Plugins repository](https://obsidian.md/plugins) or not), follow these steps:

1. Ensure you have the [BRAT plugin](https://obsidian.md/plugins?id=obsidian42-brat) installed and enabled.
2. Click [Install via BRAT](https://intradeus.github.io/http-protocol-redirector?r=obsidian://brat?plugin=https://github.com/hollowhemlock/obsidian-desktop-workspace-switcher).
3. An Obsidian pop-up window should appear. In the window, click the `Add plugin` button once and wait a few seconds for the plugin to install.

## Debugging

By default, debug messages for this plugin are hidden.

To show them, run the following command in the `DevTools Console`:

```js
window.DEBUG.enable('desktop-workspace-switcher');
```

For more details, refer to the [documentation](https://github.com/mnaoumov/obsidian-dev-utils/blob/main/docs/debugging.md).

## License

© [Ryan](https://github.com/hollowhemlock/)
