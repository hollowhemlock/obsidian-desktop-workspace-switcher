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
