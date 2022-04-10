import { AuthenticatedRequest, Request } from 'express';
import Result from 'src/common/result';
import { core, RequestCheckError, Schema } from 'src/validation';
import { workClassAuth, isOwner, futureDeadline, passedReviewsDeadline } from 'src/work/validation';
import { ratingMax } from 'src/work/db';
import * as db from './db';

// Authorisation
// --------------------------------------------
async function reviewAuth(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.userCanAccess(
        req.params.work,
        req.params.reviewer,
        req.user.emails[0].value
    );

    if (result.ok && !result.value) {
        return new Result(true, {
            code: 404,
            msg: 'review does not exist',
        });
    }
    return new Result(result.ok);
}


// Validation
// --------------------------------------------
/** Check if review has already been created */
async function exists(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.exists(
        req.params.work,
        req.user.emails[0].value
    );

    if (result.ok && result.value) {
        return new Result(true, { msg: 'review already exists' });
    }
    return new Result(result.ok);
}


/** Check rating from req body is above the rating max set for the assignment */
async function aboveRatingMax(req: Request): Promise<Result<RequestCheckError>> {
    const max = await ratingMax(req.params.work);

    if (max.ok && max.value && max.value < req.body.rating) {
        return new Result(true, { msg: `rating cannot be larger than ${max.value}` });
    } else if (max.ok && !max.value) {
        return new Result(false);
    }
    return new Result(max.ok);
}


// Middleware Options
// --------------------------------------------
export const schema: Schema = {
    params: {
        work: [ core.uuid ],
        reviewer: [ core.uuid ],
    },
    checks: [reviewAuth],
};

export const postSchema: Schema = {
    params: {
        work: [ core.uuid ],
    },
    body: {
        rating: {
            required: true,
            type: 'integer',
            checks: [ core.nonNegative ],
        },
        feedback: {
            required: true,
            type: 'text',
        },
    },
    checks: [
        workClassAuth,
        isOwner,
        futureDeadline,
        passedReviewsDeadline,
        exists,
        aboveRatingMax,
    ],
};
