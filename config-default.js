export default {
    // Default will be applied automatically to all environment configs so you
    // only have to overwrite the necessary values
    default: {
        db: {
            host: process.env.DB_HOST || 'localhost',
            database: 'peerlab',
            user: 'postgres',
            password: 'postgres',
        },
        logLevel: 'error',
    },
    production: {
        logLevel: 'info',
    },
    test: {
        db: {
            database: 'peerlab_test',
        },
    },
};
