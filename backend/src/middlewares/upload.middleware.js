const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.memoryStorage();

// Init upload
const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

// Check file type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /csv|xlsx|xls/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype) || file.mimetype.includes('excel') || file.mimetype.includes('spreadsheet') || file.mimetype.includes('csv');

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: CSV or Excel Files Only!'));
  }
}

module.exports = upload;
