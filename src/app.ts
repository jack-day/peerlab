import express from 'express';
import logger from './logger';
import api from './api';
import assignments from './assignments/static';
import classes from './classes/static';
import reviews from './reviews/static';
import swagger from './swagger';

const app = express();

app.use('/view/screens/*', (req, res) => res.redirect('/404'));
app.use('/', express.static('public', { extensions: ['html'] }));

app.use('/', assignments, classes, reviews);
app.use('/api', api);
app.use('/api-docs', swagger);

app.use((req, res) => res.redirect('/404'));
app.use(logger.errorHandler());

app.listen(8080, () => {
    logger.info(`PeerLab Launched, Listening on port 8080`);
});
