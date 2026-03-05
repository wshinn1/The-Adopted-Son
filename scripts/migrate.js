import fs from 'fs'
import path from 'path'

// We're running from /home/user but the project is at a different path
// The script tool changes cwd to the script directory's parent
// Let's find the actual project root

function findProjectRoot() {
  // Try known paths
  const candidates = [
    path.join(path.dirname(new URL(import.meta.url).pathname), '..'),
    '/vercel/share/v0-project',
  ]
  for (const c of candidates) {
    const normalized = path.resolve(c)
    if (fs.existsSync(normalized) && fs.existsSync(path.join(normalized, 'ncmaz-nextjs'))) {
      return normalized
    }
  }
  return null
}

const root = findProjectRoot()
console.log('Project root:', root)
if (!root) {
  console.error('Could not find project root')
  process.exit(1)
}

const src = path.join(root, 'ncmaz-nextjs', 'src')
const dst = path.join(root, 'src')

console.log('Source:', src)
console.log('Dest:', dst)
console.log('Source exists:', fs.existsSync(src))
console.log('Dest exists:', fs.existsSync(dst))
