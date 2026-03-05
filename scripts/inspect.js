import fs from "fs";
import path from "path";

const cwd = process.cwd();
console.log("=== process.cwd() ===", cwd);

// Try possible roots
const candidates = [cwd, "/home/user", "/app", "/workspace", "/vercel/share/v0-project"];
let root = cwd;
for (const c of candidates) {
  if (fs.existsSync(c)) {
    console.log(`Exists: ${c} ->`, fs.readdirSync(c).slice(0, 10).join(", "));
    // If it has package.json or ncmaz-nextjs, use it
    if (fs.existsSync(path.join(c, "package.json")) || fs.existsSync(path.join(c, "ncmaz-nextjs"))) {
      root = c;
    }
  }
}
console.log("=== Using root:", root, "===");

// List root-level files
console.log("=== ROOT FILES ===");
const rootFiles = fs.readdirSync(root);
rootFiles.forEach((f) => {
  const stat = fs.statSync(path.join(root, f));
  console.log(stat.isDirectory() ? `[DIR]  ${f}` : `[FILE] ${f}`);
});

// Read root package.json
const pkgPath = path.join(root, "package.json");
if (fs.existsSync(pkgPath)) {
  console.log("\n=== ROOT package.json ===");
  console.log(fs.readFileSync(pkgPath, "utf8"));
} else {
  console.log("\nNo root package.json found");
}

// Read ncmaz-nextjs/package.json
const ncmazPkg = path.join(root, "ncmaz-nextjs", "package.json");
if (fs.existsSync(ncmazPkg)) {
  console.log("\n=== ncmaz-nextjs/package.json ===");
  console.log(fs.readFileSync(ncmazPkg, "utf8"));
} else {
  console.log("\nNo ncmaz-nextjs/package.json found");
}
