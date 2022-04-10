import express from 'express';
import * as classes from './services';

/** GET /classes/ */
export async function get(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const all = await classes.getAll(req.user.emails[0].value);

    if (all.ok) {
        res.json(all.value);
    } else {
        res.sendStatus(500);
    }
}

/** POST /classes/ */
export async function post(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const create = await classes.create({ ...req.body,
        ownerEmail: req.user.emails[0].value,
    });

    if (create.ok) {
        res.sendStatus(201);
    } else {
        res.sendStatus(500);
    }
}

/** GET /class/:class */
export async function getClass(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const get = await classes.get(req.params.class, req.user.emails[0].value);

    if (get.ok && get.value) {
        res.json(get.value);
    } else {
        res.sendStatus(500);
    }
}

/** PUT /class/:class */
export async function put(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const updated = await classes.update({ ...req.body,
        ownerEmail: req.user.emails[0].value,
    }, req.params.class);

    if (updated.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}

/** DELETE /class/:class */
export async function del(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const deleted = await classes.del(req.params.class);

    if (deleted.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}

/** PUT /class/:class/avatar */
export async function putAvatar(req: express.Request, res: express.Response): Promise<void> {
    const updated = await classes.updateAvatar(req.file, req.params.class);

    if (updated.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}

/** GET /class/:class/short-name */
export async function shortName(req: express.Request, res: express.Response): Promise<void> {
    const exists = await classes.exists(req.params.class);

    if (exists.ok) {
        if (exists.value) {
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } else {
        res.sendStatus(500);
    }
}

/** GET /classes/:class/members */
export async function members(req: express.Request, res: express.Response): Promise<void> {
    const members = await classes.members(req.params.class);

    if (members.ok && members.value) {
        res.json(members.value);
    } else {
        res.sendStatus(500);
    }
}

/** DELETE /classes/:class/members/:user */
export async function deleteMember(req: express.Request, res: express.Response): Promise<void> {
    const deleted = await classes.deleteMember(req.params.class, req.params.user);

    if (deleted.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}

/** POST /classes/:class/invites */
export async function postInviteClass(req: express.Request, res: express.Response): Promise<void> {
    const invite = await classes.createInvite(req.params.class);

    if (invite.ok && invite.value) {
        res.status(201).json(invite.value);
    } else {
        res.sendStatus(500);
    }
}

/** GET /invites/:invite */
export async function getInvite(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const invite = await classes.getInvite(
        req.params.invite, 
        req.user.emails[0].value
    );

    if (invite.ok && invite.value) {
        res.json(invite.value);
    } else {
        res.sendStatus(500);
    }
}

/** POST /invites/:invite */
export async function postInvite(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const accepted = await classes.acceptInvite(
        req.params.invite, 
        req.user.emails[0].value
    );

    if (accepted.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}
