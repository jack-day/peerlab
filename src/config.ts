import configImport from '../config.js';

process.on('exit', (code) => {
    console.log(`Process exit with code: ${code}`);
});

const configs: Record<string, any> = configImport;

// Set Config
// --------------------------------------------
let config: {
    db: {
        host: string;
        database: string;
        user: string;
        password: string;
    };
    googleAuthClientId: string;
    logLevel: string;
};

if (configs.default) {
    config = configs.default;
} else {
    throw Error(`Default config does not exist`);
}

if (process.env.NODE_ENV) {
    if (configs.hasOwnProperty(process.env.NODE_ENV)) {
        Object.assign(config, configs[process.env.NODE_ENV]);
    } else {
        console.warn(`Environment '${process.env.NODE_ENV}' does not exist within config, using default`);
    }
}

export default config;
