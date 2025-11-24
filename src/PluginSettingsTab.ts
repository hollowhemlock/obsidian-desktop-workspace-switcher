import { PluginSettingsTabBase } from 'obsidian-dev-utils/obsidian/Plugin/PluginSettingsTabBase';
import { SettingEx } from 'obsidian-dev-utils/obsidian/SettingEx';

import type { PluginTypes } from './PluginTypes.ts';

export class PluginSettingsTab extends PluginSettingsTabBase<PluginTypes> {
  public override display(): void {
    super.display();
    this.containerEl.empty();

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
  }
}
