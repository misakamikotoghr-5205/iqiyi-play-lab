import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checked = spawnSync(
  process.execPath,
  [path.join(root, "scripts/check.mjs")],
  { stdio: "inherit" },
);
if (checked.status) process.exit(checked.status);
const ids = ["rain-alley", "cat-dispatch", "frame-director", "echo-rhythm"];
const output = path.join(root, "dist");
fs.mkdirSync(output, { recursive: true });
for (const name of ["index.html", "style.css"])
  fs.copyFileSync(path.join(root, name), path.join(output, name));
fs.cpSync(path.join(root, "apps"), path.join(output, "apps"), {
  recursive: true,
});
fs.mkdirSync(path.join(output, "submissions"), { recursive: true });
function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}
function archive(files) {
  const chunks = [],
    directory = [];
  let offset = 0;
  for (const { name, data } of files) {
    const filename = Buffer.from(name),
      crc = crc32(data),
      local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(0x5d64, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(filename.length, 26);
    chunks.push(local, filename, data);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x800, 8);
    central.writeUInt16LE(0x5d64, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(filename.length, 28);
    central.writeUInt32LE(offset, 42);
    directory.push(central, filename);
    offset += local.length + filename.length + data.length;
  }
  const central = Buffer.concat(directory),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, central, end]);
}
const manifest = [];
for (const id of ids) {
  const source = path.join(root, "apps", id);
  const files = fs
    .readdirSync(source)
    .sort()
    .map((name) => ({ name, data: fs.readFileSync(path.join(source, name)) }));
  files.push({
    name: "LICENSE.txt",
    data: fs.readFileSync(path.join(root, "LICENSE")),
  });
  const zip = archive(files);
  if (zip.length > 20 * 1024 * 1024)
    throw new Error(`${id}: ZIP exceeds 20 MiB`);
  fs.writeFileSync(path.join(output, "submissions", `${id}.zip`), zip);
  manifest.push({
    id,
    file: `${id}.zip`,
    bytes: zip.length,
    sha256: crypto.createHash("sha256").update(zip).digest("hex"),
    entries: files.map((file) => file.name),
    submitted: false,
  });
  console.log(`${id}.zip: ${zip.length} bytes; index.html at archive root`);
}
fs.writeFileSync(
  path.join(output, "submissions/manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  "Built static collection and four independent, deterministic ZIP submissions in dist/. No platform submission performed.",
);
