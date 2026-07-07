// fix-safearea.js
// Run with: node fix-safearea.js
// Automatically fixes SafeAreaView imports across the whole app/components folder.

const fs = require("fs");
const path = require("path");

const TARGET_DIRS = ["app", "components"];
const exts = [".tsx", ".ts"];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      walk(full, files);
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

let changedCount = 0;

for (const dir of TARGET_DIRS) {
  if (!fs.existsSync(dir)) continue;
  const files = walk(dir);

  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");

    if (!/SafeAreaView/.test(content)) continue;
    if (/from\s+["']react-native-safe-area-context["']/.test(content) && !/from\s+["']react-native["'][\s\S]{0,200}SafeAreaView/.test(content)) {
      // Already correctly imported and not duplicated in react-native import
    }

    // Match a multi-line `import { ... } from "react-native";` block
    const importBlockRegex = /import\s*\{([^}]*)\}\s*from\s*["']react-native["'];?/;
    const match = content.match(importBlockRegex);

    if (match && /\bSafeAreaView\b/.test(match[1])) {
      // Remove SafeAreaView from the react-native import block
      let inner = match[1];
      inner = inner
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && s !== "SafeAreaView")
        .join(",\n  ");

      const newImportBlock = `import {\n  ${inner},\n} from "react-native";`;
      content = content.replace(importBlockRegex, newImportBlock);

      // Add the correct import right after, if not already present
      if (!/from\s+["']react-native-safe-area-context["']/.test(content)) {
        content = content.replace(
          newImportBlock,
          `${newImportBlock}\nimport { SafeAreaView } from "react-native-safe-area-context";`
        );
      }

      fs.writeFileSync(file, content, "utf8");
      changedCount++;
      console.log("Fixed:", file);
    }
  }
}

console.log(`\nDone. ${changedCount} file(s) updated.`);
