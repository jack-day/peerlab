const fs = require('fs');
const userContentDir = require('./user-content.js');
fs.rmdirSync(userContentDir, { recursive: true });
