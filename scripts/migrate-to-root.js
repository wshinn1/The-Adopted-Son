import fs from "fs";
import path from "path";

const PROJECT_ROOT = "/vercel/share/v0-project";
const SOURCE = path.join(PROJECT_ROOT, "ncmaz-nextjs");

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Items to copy from ncmaz-nextjs/ to root
const toCopy = ["src", "public"];

for (const item of toCopy) {
  const src = path.join(SOURCE, item);
  const dest = path.join(PROJECT_ROOT, item);
  if (fs.existsSync(src)) {
    console.log(`Copying ${item}...`);
    copyRecursive(src, dest);
    console.log(`Done: ${item}`);
  } else {
    console.log(`Skipping ${item} (not found)`);
  }
}

// Also copy images folder if it exists inside ncmaz-nextjs/src
console.log("Migration complete!");
console.log("Root src/app exists:", fs.existsSync(path.join(PROJECT_ROOT, "src", "app")));
console.log("Root public exists:", fs.existsSync(path.join(PROJECT_ROOT, "public")));
