const fs = require('fs');

function mkdir(path) {
    try {
        fs.mkdirSync(path);
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw err;
        }
    }
}

const userContentDir = 'public/user-content';
const dirs = ['users', 'users/avatars', 'classes', 'classes/avatars', 'work'];

mkdir(userContentDir);
for (const dir of dirs) {
    mkdir(userContentDir + '/' + dir);
}

module.exports = userContentDir;
