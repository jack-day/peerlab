const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config-default.json'));

fs.writeFileSync('config.json', JSON.stringify(config, undefined, 2));
