/**
 * Script to generate the iOS app icon with a larger NeuroBloom logo
 * on the purplish gradient background matching the welcome screen
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SIZE = 1024;
const COLORS = {
  navyBlue: '#283593',
  deepNavy: '#1a237e',
};

async function generateAppIcon() {
  const assetsDir = path.join(__dirname, '../assets');
  const logoPath = path.join(assetsDir, 'NeuroBloom Logo high res.png');
  const outputPath = path.join(assetsDir, 'app-icon-1024.png');

  try {
    console.log('Generating app icon...');
    
    // Create gradient background using SVG
    const gradientSvg = `
      <svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${COLORS.navyBlue};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${COLORS.deepNavy};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${SIZE}" height="${SIZE}" fill="url(#bgGradient)"/>
      </svg>
    `;

    // Create background from SVG
    const background = await sharp(Buffer.from(gradientSvg))
      .resize(SIZE, SIZE)
      .png()
      .toBuffer();

    // Load and resize logo (make it larger - about 70% of icon size)
    const logoSize = Math.floor(SIZE * 0.7);
    const logo = await sharp(logoPath)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    // Composite logo on background (centered)
    const iconBuffer = await sharp(background)
      .composite([{
        input: logo,
        top: Math.floor((SIZE - logoSize) / 2),
        left: Math.floor((SIZE - logoSize) / 2)
      }])
      .png()
      .toBuffer();

    // Save the icon
    await fs.promises.writeFile(outputPath, iconBuffer);
    console.log(`✓ App icon generated: ${outputPath}`);

    // Also copy to iOS AppIcon location
    const iosIconPath = path.join(__dirname, '../ios/NeuroBloom/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png');
    await fs.promises.writeFile(iosIconPath, iconBuffer);
    console.log(`✓ iOS icon updated: ${iosIconPath}`);

    return outputPath;
  } catch (error) {
    console.error('Error generating app icon:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateAppIcon()
    .then(() => {
      console.log('App icon generation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to generate app icon:', error);
      process.exit(1);
    });
}

module.exports = { generateAppIcon };
