import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

async function openVault() {
  try {
    const vaultPath = path.join(process.cwd(), "test-vault");
    const absolutePath = path.resolve(vaultPath);

    console.log("Opening Obsidian test vault...");
    console.log("Vault path:", absolutePath);

    // Use obsidian:// URI protocol to open the vault
    const uri = `obsidian://open?path=${encodeURIComponent(absolutePath)}`;

    // On Windows, use 'start' command; on macOS/Linux, use 'open' or 'xdg-open'
    const command =
      process.platform === "win32"
        ? `start "" "${uri}"`
        : process.platform === "darwin"
          ? `open "${uri}"`
          : `xdg-open "${uri}"`;

    await execAsync(command);

    console.log("Obsidian should open with the test vault");
  } catch (error) {
    console.error("Failed to open vault:", error);
    process.exit(1);
  }
}

openVault();
