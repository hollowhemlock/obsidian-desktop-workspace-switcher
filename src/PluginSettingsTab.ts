import { PluginSettingsTabBase } from 'obsidian-dev-utils/obsidian/Plugin/PluginSettingsTabBase';
import { SettingEx } from 'obsidian-dev-utils/obsidian/SettingEx';

import type { PluginTypes } from './PluginTypes.ts';

export class PluginSettingsTab extends PluginSettingsTabBase<PluginTypes> {
  public override display(): void {
    super.display();
    this.containerEl.empty();

    // eslint-disable-next-line import-x/no-nodejs-modules -- Required for platform detection
    const platform = process.platform;
    const isMacOS = platform === 'darwin';
    const isWindows = platform === 'win32';

    new SettingEx(this.containerEl)
      .setName('Enable desktop switching')
      .setDesc('Automatically switch virtual desktops when changing Obsidian workspaces.')
      .addToggle((toggle) => {
        this.bind(toggle, 'enabled');
      });

    new SettingEx(this.containerEl)
      .setName('Show notices')
      .setDesc('Display a notice when switching to a different virtual desktop.')
      .addToggle((toggle) => {
        this.bind(toggle, 'showNotices');
      });

    // macOS-specific settings
    if (isMacOS) {
      this.containerEl.createEl('h3', { text: 'macOS Settings' });

      new SettingEx(this.containerEl)
        .setName('Enable macOS sync')
        .setDesc('Enable synchronization with macOS Spaces (requires yabai).')
        .addToggle((toggle) => {
          this.bind(toggle, 'enableMacOSSync');
        });

      this.containerEl.createEl('p', {
        cls: 'setting-item-description',
        text: 'Advanced settings (pollInterval, spaceToWorkspaceMapping) can be configured by editing the plugin\'s data.json file. Reload Obsidian after making changes.'
      });
    }

    // Platform info
    this.containerEl.createEl('h3', { text: 'Platform Information' });
    const platformInfo = this.containerEl.createEl('div', { cls: 'setting-item-description' });
    platformInfo.createEl('p', { text: `Current platform: ${platform}` });

    if (isWindows) {
      platformInfo.createEl('p', {
        text: 'Requires: PSVirtualDesktop PowerShell module'
      });
      platformInfo.createEl('p', {
        text: 'Install: Install-Module VirtualDesktop (in PowerShell as Administrator)'
      });
    } else if (isMacOS) {
      platformInfo.createEl('p', { text: 'Requires: yabai window manager' });
      platformInfo.createEl('p', {
        text: 'Install: brew install koekeishiya/formulae/yabai && yabai --start-service'
      });
      platformInfo.createEl('p', {
        text: 'Note: Advanced features require partial SIP disabling. See README for details.'
      });
    }
  }
}
