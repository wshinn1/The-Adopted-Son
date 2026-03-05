import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const root = '/vercel/share/v0-project';

console.log('=== ROOT FILES ===');
try {
  const files = readdirSync(root);
  files.forEach(f => console.log(f));
} catch (e) {
  console.log('Error reading root:', e.message);
}

console.log('\n=== ROOT package.json ===');
const pkgPath = join(root, 'package.json');
if (existsSync(pkgPath)) {
  console.log(readFileSync(pkgPath, 'utf8'));
} else {
  console.log('NOT FOUND');
}

console.log('\n=== ncmaz-nextjs/ contents ===');
const subDir = join(root, 'ncmaz-nextjs');
if (existsSync(subDir)) {
  const files = readdirSync(subDir);
  files.forEach(f => console.log(f));
} else {
  console.log('ncmaz-nextjs/ NOT FOUND');
}
