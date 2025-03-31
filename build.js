/*
 * This script is used to build the frontend.
 * It checks if the dist directory exists and if the hash of the frontend directory has changed.
 * If it has, it builds the frontend.
 * If it has not, it skips the build.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Check if dist directory exists
const distExists = fs.existsSync("./dist");

// Function to get hash of directory content
function getDirectoryHash(directory) {
  const files = [];

  function processDirectory(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        processDirectory(itemPath);
      } else {
        // Skip node_modules, .git, and dist directories
        if (
          !itemPath.includes("node_modules") &&
          !itemPath.includes(".git") &&
          !itemPath.includes("dist") &&
          !itemPath.includes("out") &&
          !itemPath.includes("logs") &&
          !itemPath.includes("cypress/screenshots") &&
          !itemPath.includes("cypress/videos")
        ) {
          const content = fs.readFileSync(itemPath);
          files.push({
            path: itemPath,
            content: content,
            mtime: stats.mtime.getTime(),
          });
        }
      }
    }
  }

  processDirectory(directory);

  // Sort files by path to ensure consistent hash
  files.sort((a, b) => a.path.localeCompare(b.path));

  // Create a hash of all file contents and mtimes
  const hash = crypto.createHash("md5");
  for (const file of files) {
    hash.update(file.path);
    hash.update(file.content);
    hash.update(file.mtime.toString());
  }

  return hash.digest("hex");
}

// Path to store the last hash
const hashFilePath = path.resolve("./.build-hash");

// Get current hash of frontend directory
const currentHash = getDirectoryHash("./frontend");

let previousHash = "";
if (fs.existsSync(hashFilePath)) {
  previousHash = fs.readFileSync(hashFilePath, "utf8");
}

// Determine if we need to build
const needsBuild = !distExists || currentHash !== previousHash;

if (needsBuild) {
  console.log("Changes detected or dist directory missing. Building...");

  try {
    // Run vite build
    execSync("npm run build:force", { stdio: "inherit" });

    // Save the current hash
    fs.writeFileSync(hashFilePath, currentHash);

    console.log("Build completed successfully.");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
} else {
  console.log("No changes detected. Skipping build.");
}
