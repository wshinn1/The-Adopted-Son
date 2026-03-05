import fs from "fs";
import path from "path";

const root = "/vercel/share/v0-project";

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
