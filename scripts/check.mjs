import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const appIds = [
  "rain-alley",
  "cat-dispatch",
  "frame-director",
  "echo-rhythm",
];
let errors = 0;
for (const id of appIds) {
  const directory = path.join(root, "apps", id);
  const names = fs.readdirSync(directory);
  if (!names.includes("index.html")) {
    console.error(`${id}: missing root index.html`);
    errors++;
  }
  let bytes = 0;
  for (const name of names) {
    const file = path.join(directory, name),
      content = fs.readFileSync(file, "utf8");
    bytes += fs.statSync(file).size;
    if (
      /https?:\/\/|(?:src|href)\s*=\s*["']\/\/|@import|\bfetch\s*\(|XMLHttpRequest|WebSocket|type\s*=\s*["']module/i.test(
        content,
      )
    ) {
      console.error(
        `${id}/${name}: external resource, network API, or module import is not allowed`,
      );
      errors++;
    }
    if (name.endsWith(".js")) {
      const result = spawnSync(process.execPath, ["--check", file], {
        encoding: "utf8",
      });
      if (result.status) {
        console.error(result.stderr);
        errors++;
      }
    }
    if (name.endsWith(".html"))
      for (const match of content.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
        if (match[1].startsWith("#")) continue;
        const target = path.resolve(directory, match[1]);
        if (
          !target.startsWith(directory + path.sep) ||
          !fs.existsSync(target)
        ) {
          console.error(`${id}: missing or escaping local asset ${match[1]}`);
          errors++;
        }
      }
  }
  if (bytes > 20 * 1024 * 1024) {
    console.error(`${id}: exceeds 20 MiB`);
    errors++;
  }
  console.log(
    `${id}: ${names.length} local files, ${(bytes / 1024).toFixed(1)} KiB`,
  );
}
if (errors) process.exitCode = 1;
else
  console.log(
    "Offline, file://, local asset, syntax, and source size checks passed.",
  );
