# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Desktop Workspace Switcher is an Obsidian plugin for Windows and macOS that automatically synchronizes Obsidian workspaces with system virtual desktops. When you switch Obsidian workspaces, the plugin switches your virtual desktop to match (by name).

- **Status**: Early development (v0.0.0), available via BRAT beta testing
- **Note**: Generated from [generator-obsidian-plugin](https://github.com/mnaoumov/generator-obsidian-plugin); most src/ files are sample/scaffold code that may need trimming
- **Platform**: Desktop-only (Windows implemented, macOS planned)
- **Windows Dependency**: Requires PSVirtualDesktop PowerShell module (`Install-Module VirtualDesktop`)

## Build Commands

All scripts use `obsidian-dev-utils` CLI:

```bash
npm run dev          # Start development server (watches for changes)
npm run build        # Production build (outputs main.js)
npm run lint         # Run ESLint checks
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format with Prettier
npm run spellcheck   # Run spell checker
```

The compiled `main.js` is not committed—it's uploaded to GitHub releases.

## Code Architecture

### Entry Points
- `src/main.ts` - Plugin entry point, exports the Plugin class
- `src/Plugin.ts` - Main plugin class extending `PluginBase<PluginTypes>`, handles all registrations (commands, events, views)

### Type System
- `src/PluginTypes.ts` - Central interface defining plugin/settings/tab relationships

### Settings
- `src/PluginSettings.ts` - Settings data class with 20+ setting type examples
- `src/PluginSettingsManager.ts` - Settings persistence with custom serialization
- `src/PluginSettingsTab.ts` - Settings UI using `SettingEx` components and `this.bind()` pattern

### Views (src/Views/)
- `SampleView.ts` - Basic ItemView
- `SampleSvelteView.ts` - Svelte component integration
- `SampleReactView.tsx` - React component integration

### Editor Extensions (src/EditorExtensions/)
CodeMirror 6 extensions: state fields, view plugins, widgets

### Desktop Switching Logic (codeToImport/)
**Not yet integrated into main plugin:**
- `windows-desktop-manager.ts` - PowerShell-based Windows virtual desktop control with caching (500ms TTL)
- `register-desktop-switcher-event.ts` - Workspace change event handling and desktop sync logic

## Key Patterns

### Settings Binding
```typescript
new SettingEx(this.containerEl)
  .setName('Setting Name')
  .addText((text) => {
    this.bind(text, 'settingPropertyName');
  });
```

### Event Registration
```typescript
this.registerEvent(this.app.workspace.on('layout-change', handler));
```

### Desktop Switching (from codeToImport)
- Name-based matching: workspace name must match desktop name
- Falls back to first desktop if no match found
- Uses persistent PowerShell process for performance

## Debugging

Enable debug logging in DevTools Console:
```javascript
window.DEBUG.enable('desktop-workspace-switcher');
```

## Configuration

- TypeScript: Strictest config (`@tsconfig/strictest`), ES2024 target, JSX support
- ESLint: Uses `obsidian-dev-utils` configs
- Formatting: 2 spaces, UTF-8, LF line endings
