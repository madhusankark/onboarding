const path = require('path');

// Absolute path to the public uploads folder
const uploadsPath = path.join(__dirname, '..', '..', 'uploads');

module.exports = { uploadsPath };