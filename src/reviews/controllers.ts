import express from 'express';
import * as review from './services';

/** GET /work/:work/reviews */
export async function getAll(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const all = await review.getAll(req.params.work, req.user.emails[0].value);

    if (all.ok && all.value) {
        res.json(all.value);
    } else {
        res.sendStatus(500);
    }
}

/** POST /work/:work/reviews */
export async function post(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const create = await review.create(
        req.params.work,
        req.body,
        req.user.emails[0].value
    );

    if (create.ok) {
        res.sendStatus(201);
    } else {
        res.sendStatus(500);
    }
}

/** POST /work/:work/reviews/:reviewer/likes */
export async function likes(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const like = await review.like(
        req.params.work,
        req.params.reviewer,
        req.user.emails[0].value
    );

    if (like.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}

/** POST /work/:work/reviews/:reviewer/dislikes */
export async function dislikes(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const dislike = await review.dislike(
        req.params.work,
        req.params.reviewer,
        req.user.emails[0].value
    );

    if (dislike.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}

/**
 * DELETE /work/:work/reviews/:reviewer/likes
 * DELETE /work/:work/reviews/:reviewer/dislikes
 */
export async function deleteLike(req: express.AuthenticatedRequest, res: express.Response): Promise<void> {
    const deleted = await review.deleteLike(
        req.params.work,
        req.params.reviewer,
        req.user.emails[0].value
    );

    if (deleted.ok) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
}
