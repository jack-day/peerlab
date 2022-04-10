import express from 'express';
import * as user from './services';
 
/** POST /users/ */
export async function post(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const create = await user.create(req.user);

    if (create.ok && create.value) {
        res.status(201).json(create.value);
    } else {
        res.sendStatus(500);
    }
}
 
/** GET /users/:user */
export async function get(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const read = await user.get(req.params.user);

    if (read.ok && read.value) {
        res.status(200).json(read.value);
    } else {
        res.sendStatus(500);
    }
}

/** GET /me */
export async function getMe(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const me = await user.getMe(req.user.emails[0].value);

    if (me.ok && me.value) {
        res.json(me.value);
    } else {
        res.sendStatus(500);
    }
}

/** PUT /me */
export async function putMe(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const updated = await user.updateMe({
        ...req.body,
        email: req.user.emails[0].value,
    });

    if (updated.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}

/** DELETE /me */
export async function deleteMe(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const deleted = await user.del(req.user.emails[0].value);

    if (deleted.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}

/** GET /me/registered */
export async function meRegistered(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const registered = await user.exists(req.user.emails[0].value);

    if (registered.ok) {
        if (registered.value) {
            res.sendStatus(200);
        } else {
            res.sendStatus(204);
        }
    } else {
        res.sendStatus(500);
    }
}

/** GET /me/avatar */
export async function getMeAvatar(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const avatarPath = await user.getMeAvatar(req.user.emails[0].value);

    if (avatarPath.ok && avatarPath.value) {
        res.json(avatarPath.value);
    } else {
        res.sendStatus(500);
    }
}

/** PUT /me/avatar */
export async function meAvatar(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const upload = await user.updateMeAvatar(req.file, req.user.emails[0].value);
    
    if (upload.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}
