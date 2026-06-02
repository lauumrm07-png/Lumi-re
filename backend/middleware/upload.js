const multer = require('multer');
const path = require('path');
const { optimizeImage } = require('../utils/optimize');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', process.env.UPLOAD_DIR || 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|avif/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype.split('/')[1]);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png, webp, avif) are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Middleware: upload single file then optimize
function uploadAndOptimize(fieldName, type = 'artwork') {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, async (err) => {
      if (err) return next(err);
      if (!req.file) return next();

      try {
        const newName = await optimizeImage(req.file.path, type);
        req.file.filename = newName;
        req.file.path = path.join(req.file.destination, newName);
        next();
      } catch (err) {
        next(err);
      }
    });
  };
}

module.exports = upload;
module.exports.uploadAndOptimize = uploadAndOptimize;
