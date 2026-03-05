const fs = require('fs')
const path = require('path')

console.log('__dirname:', __dirname)
console.log('process.cwd():', process.cwd())

// __dirname should be /vercel/share/v0-project/scripts
const root = path.resolve(__dirname, '..')
console.log('Project root:', root)
console.log('Root contents:', fs.existsSync(root) ? fs.readdirSync(root).join(', ') : 'NOT FOUND')

const ncmazSrc = path.join(root, 'ncmaz-nextjs', 'src')
console.log('ncmaz src path:', ncmazSrc)
console.log('ncmaz src exists:', fs.existsSync(ncmazSrc))

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

if (fs.existsSync(ncmazSrc)) {
  const destSrc = path.join(root, 'src')
  console.log('Copying', ncmazSrc, '->', destSrc)
  copyRecursive(ncmazSrc, destSrc)
  console.log('Done! src/ created at root.')
  
  // Also copy public folder
  const ncmazPublic = path.join(root, 'ncmaz-nextjs', 'public')
  if (fs.existsSync(ncmazPublic)) {
    const destPublic = path.join(root, 'public')
    console.log('Copying public folder...')
    copyRecursive(ncmazPublic, destPublic)
    console.log('Done! public/ created at root.')
  }
} else {
  console.error('Source not found, cannot copy.')
}
