import type { CliTaskResult } from "obsidian-dev-utils/ScriptUtils/CliUtils";
import {
  BuildMode,
  buildObsidianPlugin,
} from "obsidian-dev-utils/ScriptUtils/esbuild/ObsidianPluginBuilder";
import fs from "fs/promises";
import path from "path";

export async function invoke(): Promise<CliTaskResult> {
  // Set default OBSIDIAN_CONFIG_FOLDER if not set
  if (!process.env["OBSIDIAN_CONFIG_FOLDER"]) {
    process.env["OBSIDIAN_CONFIG_FOLDER"] = path.join(
      process.cwd(),
      "test-vault",
      ".obsidian"
    );
  }
  try {
    console.log("Building plugin in development mode...");

    const result = await buildObsidianPlugin({ mode: BuildMode.Development });

    // Verify build output exists
    const distDir = path.join(process.cwd(), "dist/dev");
    try {
      await fs.access(distDir);
    } catch {
      throw new Error(`Build output not found at ${distDir}`);
    }

    // Copy to test vault
    const testVaultPluginDir = path.join(
      process.cwd(),
      "test-vault/.obsidian/plugins/desktop-workspace-switcher"
    );

    await fs.mkdir(testVaultPluginDir, { recursive: true });
    await fs.cp(distDir, testVaultPluginDir, { recursive: true, force: true });
    console.log("Copied to test vault:", testVaultPluginDir);
    return result;
  } catch (error) {
    console.error("Build failed:", error);
    throw error;
  }
}
