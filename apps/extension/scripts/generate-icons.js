// Copy the AniVault logo into all extension icon slots.
// Run with: node scripts/generate-icons.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logoPath = path.join(__dirname, '..', '..', 'website', 'public', 'press-kit', 'logo-mark.png')
const iconsDir = path.join(__dirname, '..', 'icons')
const sizes = [16, 32, 48, 128]

if (!fs.existsSync(logoPath)) {
  throw new Error(`Logo not found at ${logoPath}`)
}

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

const logoBuffer = fs.readFileSync(logoPath)

sizes.forEach((size) => {
  const filePath = path.join(iconsDir, `icon-${size}.png`)
  fs.writeFileSync(filePath, logoBuffer)
  console.log(`Copied logo to ${filePath}`)
})

console.log('Extension icons updated from logo-mark.png.')

