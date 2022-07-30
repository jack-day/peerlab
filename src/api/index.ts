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

api.use(googleAuth(config.googleAuthClientId));
api.use(
    '/',
    guardMiddleware(),
    users,
    classes,
    assignments,
    work,
    reviews
);
api.use((req, res) => res.sendStatus(404));
api.use(logger.errorHandler());

export default api;
