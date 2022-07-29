const fs = require('fs');
fs.writeFileSync('config.js', fs.readFileSync('config-default.js'));
