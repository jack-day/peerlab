import configImport from 'root/config.json';
const configJson: Record<string, any> = configImport;

process.on('exit', (code) => {
    console.log(`Process exit with code: ${code}`);
});

// Set Config
// --------------------------------------------
interface Config {
    dbName: string;
    logLevel: string;
}

/** Current Environment's Config */
let config: Config;
const configDefault = 'development';

if (process.env.NODE_ENV) {
    if (configJson.hasOwnProperty(process.env.NODE_ENV)) {
        config = configJson[process.env.NODE_ENV];
    } else {
        console.error(`NODE_ENV '${process.env.NODE_ENV}' does not exist within config`);
        process.exit(9);
    }
} else {
    if (configJson[configDefault]) {
        config = configJson[configDefault];
    } else {
        console.error(`Default config environment '${configDefault}' does not exist`);
        process.exit(9);
    }
}

export default config;
