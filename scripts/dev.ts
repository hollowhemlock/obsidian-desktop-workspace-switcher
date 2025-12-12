import type { CliTaskResult } from "obsidian-dev-utils/ScriptUtils/CliUtils";
import {
  BuildMode,
  buildObsidianPlugin,
} from "obsidian-dev-utils/ScriptUtils/esbuild/ObsidianPluginBuilder";
import fs from "fs/promises";
import path from "path";

export async function invoke(): Promise<CliTaskResult> {
  // Set default OBSIDIAN_CONFIG_FOLDER if not set
  const defaultVaultPath = path.join(process.cwd(), "test-vault", ".obsidian");

  if (!process.env["OBSIDIAN_CONFIG_FOLDER"]) {
    process.env["OBSIDIAN_CONFIG_FOLDER"] = defaultVaultPath;
  }

  // Support multiple additional paths via OBSIDIAN_VAULTS (comma-separated)
  const additionalPaths = process.env["OBSIDIAN_VAULTS"]
    ? process.env["OBSIDIAN_VAULTS"].split(",").map((p) => p.trim())
    : [];

  try {
    console.log("Building plugin in development mode...");
    const result = await buildObsidianPlugin({ mode: BuildMode.Development });

    // Copy to additional vaults if specified
    if (additionalPaths.length > 0) {
      const distDir = path.join(process.cwd(), "dist/dev");
      const pluginName = "desktop-workspace-switcher";

      for (const vaultPath of additionalPaths) {
        const targetDir = path.join(vaultPath, "plugins", pluginName);
        await fs.mkdir(targetDir, { recursive: true });
        await fs.cp(distDir, targetDir, { recursive: true, force: true });
        console.log("Copied to additional vault:", targetDir);
      }
    }

    return result;
  } catch (error) {
    console.error("Build failed:", error);
    throw error;
  }
}
