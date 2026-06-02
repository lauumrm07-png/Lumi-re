const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SIZES = {
  artwork: { width: 1920, height: 1920, fit: 'inside' },
  avatar:  { width: 400,  height: 400,  fit: 'cover' },
};

async function optimizeImage(filePath, type = 'artwork') {
  const size = SIZES[type] || SIZES.artwork;

  const ext = path.extname(filePath);
  const dir = path.dirname(filePath);
  const name = path.basename(filePath, ext);
  const outputPath = path.join(dir, `${name}.webp`);

  await sharp(filePath)
    .resize(size.width, size.height, { fit: size.fit, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .withMetadata({ exif: false, icc: false, xmp: false })
    .toFile(outputPath);

  // Remove original
  fs.unlinkSync(filePath);

  // Return the new filename relative to uploads dir
  return `${name}.webp`;
}

module.exports = { optimizeImage };
