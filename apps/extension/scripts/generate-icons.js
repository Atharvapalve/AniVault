// Simple script to generate placeholder extension icons
// Run with: node scripts/generate-icons.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create a simple 1x1 pixel PNG as placeholder
// This is a minimal valid PNG file (1x1 red pixel)
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

const iconsDir = path.join(__dirname, '..', 'icons')
const sizes = [16, 32, 48, 128]

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Generate placeholder icons
sizes.forEach((size) => {
  const filePath = path.join(iconsDir, `icon-${size}.png`)
  fs.writeFileSync(filePath, minimalPNG)
  console.log(`Created ${filePath}`)
})

console.log('Placeholder icons generated!')
console.log('Replace these with actual AniVault icons later.')

