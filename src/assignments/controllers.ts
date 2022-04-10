import express from 'express';
import * as asgmnts from './services';

/** GET /classes/:class/assignments */
export async function getAll(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const all = await asgmnts.getAll(
        req.params.class,
        req.user.emails[0].value
    );

    if (all.ok && all.value) {
        res.json(all.value);
    } else {
        res.sendStatus(500);
    }
}

/** POST /classes/:class/assignments */
export async function post(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const create = await asgmnts.create(req.body, req.params.class);

    if (create.ok) {
        res.sendStatus(201);
    } else {
        res.sendStatus(500);
    }
}

/** GET /classes/:class/assignments/:asgmnt */
export async function get(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const asgmnt = await asgmnts.get(
        req.params.asgmnt,
        req.params.class,
        req.user.emails[0].value
    );

    if (asgmnt.ok && asgmnt.value) {
        res.json(asgmnt.value);
    } else {
        res.sendStatus(500);
    }
}

/** PUT /classes/:class/assignments/:asgmnt */
export async function put(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const updated = await asgmnts.update(
        req.body,
        req.params.asgmnt,
        req.params.class
    );

    if (updated.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}

/** DELETE /classes/:class/assignments/:asgmnt */
export async function del(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const deleted = await asgmnts.del(req.params.asgmnt, req.params.class);

    if (deleted.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}

/** GET /classes/:class/assignments/:asgmnt/peer-work */
export async function peerWork(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const get = await asgmnts.getPeerWork(
        req.params.asgmnt,
        req.params.class,
        req.user.emails[0].value
    );

    if (get.ok && get.value) {
        res.status(200).json(get.value);
    } else {
        res.sendStatus(500);
    }
}
