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
        googleAuthClientId: '19518467849-a7ltiak6hv9bl3b9hm6uih8h93jm5fr5.apps.googleusercontent.com',
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
