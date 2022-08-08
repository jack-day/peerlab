import { Router } from 'express';
import googleAuth, { guardMiddleware } from 'simple-google-openid';
import config from 'src/config';
import logger from 'src/logger';
import users from 'src/users/routes';
import classes from 'src/classes/routes';
import assignments from 'src/assignments/routes';
import work from 'src/work/routes';
import reviews from 'src/reviews/routes';

const api = Router();

// Auth
if (process.env.NODE_ENV !== 'demo') {
    api.use(googleAuth(config.googleAuthClientId));
    api.use(guardMiddleware());
} else {
    api.use((req, res, next) => {
        if (!req.headers.authorization) return res.sendStatus(418);

        // As the user still needs to have an initial name when creating an 
        // account in demo mode, we'll use some custom headers to transfer them.
        // Preventing us from altering how the request is used outside demo mode.
        let familyName = '', givenName = '';

        if (typeof req.headers['peerlab-demo-family-name'] === 'string') {
            familyName = req.headers['peerlab-demo-family-name'];
        }

        if (typeof req.headers['peerlab-demo-given-name'] === 'string') {
            givenName = req.headers['peerlab-demo-given-name'];
        }        

        // Set a dummy authenticated user data object so the functions that use
        // it don't have to be changed to allow for demo mode
        req.user = {
            id: '',
            displayName: '',
            name: {
                familyName,
                givenName,
            },
            emails: [
                {
                    verified: true,
                    value: req.headers.authorization.replace('Bearer ', ''),
                },
            ],
            photos: [],
            provider: '',
        };

        next();
    });
}

api.use(
    '/',
    users,
    classes,
    assignments,
    work,
    reviews
);
api.use((req, res) => res.sendStatus(404));
api.use(logger.errorHandler());

export default api;
