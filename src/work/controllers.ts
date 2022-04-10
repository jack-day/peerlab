import express from 'express';
import * as work from './services';

/** POST /work */
export async function post(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const create = await work.create({
        email: req.user.emails[0].value,
        ...req.body,
    });

    if (create.ok && create.value) {
        res.status(201).json(create.value);
    } else {
        res.sendStatus(500);
    }
}

/** GET /work/:uuid */
export async function get(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const result = await work.get(req.params.work);

    if (result.ok && result.value) {
        res.status(200).json(result.value);
    } else {
        res.sendStatus(500);
    }
}

/** PUT /work/:uuid */
export async function put(req: express.Request, res: express.Response): Promise<void> {
    const update = await work.update(req.params.work, req.body);

    if (update.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}

/** PUT /work/:uuid/file */
export async function fileUpload(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const upload = await work.updatePdf(req.file.path, req.params.work);
    
    if (upload.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}
