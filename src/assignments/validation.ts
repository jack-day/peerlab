import { AuthenticatedRequest, Request } from 'express';
import Result from 'src/common/result';
import { core, Schema, RequestCheckError } from 'src/validation';
import { classAuth, isNotOwner as isNotClassOwner } from 'src/classes/validation';
import * as db from './db';

// Authorisation
// --------------------------------------------
export async function asgmntAuth(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.userCanAccess(
        req.params.asgmnt,
        req.params.class,
        req.user.emails[0].value
    );

    if (result.ok && !result.value) {
        return new Result(true, {
            code: 404,
            msg: 'assignment does not exist',
        });
    }
    return new Result(result.ok);
}


// Validation
// --------------------------------------------
/** Check if assignment already exists */
async function exists(req: Request): Promise<Result<RequestCheckError>> {
    const result = await db.exists(req.body.shortName, req.params.class);

    if (result.ok && result.value) {
        return new Result(true, {
            field: 'shortName',
            msg: 'Short name is already taken',
        });
    }
    return new Result(result.ok);
}

/** Check if assignment deadline has passed */
export async function passedDeadline(req: Request): Promise<Result<RequestCheckError>> {
    const result = await db.passedDeadline(
        req.params.asgmnt,
        req.params.class
    );

    if (result.ok && result.value) {
        return new Result(true, { msg: 'deadline passed' });
    }
    return new Result(result.ok);
}

/** Check if assignment deadline is in the future */
export async function futureDeadline(req: Request): Promise<Result<RequestCheckError>> {
    const result = await db.futureDeadline(
        req.params.asgmnt,
        req.params.class
    );

    if (result.ok && result.value) {
        return new Result(true, { msg: 'deadline has not passed yet' });
    }
    return new Result(result.ok);
}

/** Check if assignment reviews deadline has passed */
export async function passedReviewsDeadline(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.passedReviewsDeadline(
        req.params.asgmnt,
        req.params.class
    );

    if (result.ok && result.value) {
        return new Result(true, { msg: 'reviews deadline passed' });
    }
    return new Result(result.ok);
}

/** Check if reviews deadline in is invalid and not later than the deadline */
function invalidReviewsDeadline(req: Request): Result<RequestCheckError> {
    if (req.body.deadline && req.body.reviewsDeadline) {
        if (new Date(req.body.deadline) >= new Date(req.body.reviewsDeadline)) {
            return new Result(true, {
                field: 'reviewsDeadline',
                msg: 'Reviews deadline must be later than the deadline',
            });
        }
    }
    return new Result(true);
}

/** Check new short name in PUT update request is not already taken */
async function putShortNameExists(req: Request): Promise<Result<RequestCheckError>> {
    if (req.params.asgmnt !== req.body.shortName) {
        return await exists(req);
    }
    return new Result(true);
}

/** Check if all peer work has been reviewed */
async function allPeersReviewed(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.allPeersReviewed(
        req.params.asgmnt,
        req.user.emails[0].value
    );

    if (result.ok && result.value) {
        return new Result(true, { msg: 'no peer work left to review' });
    }
    return new Result(result.ok);
}


// Middleware Options
// --------------------------------------------
export const schema: Schema = {
    params: {
        asgmnt: [ core.shortName ],
        class: [ core.shortName ],
    },
    checks: [asgmntAuth],
};

export const postSchema: Schema = {
    params: {
        class: [ core.shortName ],
    },
    body: {
        shortName: {
            required: true,
            type: 'text',
            checks: [ core.shortName ],
        },
        name: {
            required: true,
            type: 'text',
        },
        description: {
            required: false,
            type: 'text',
        },
        anonymous: {
            required: true,
            type: 'boolean',
        },
        minReviews: {
            required: false,
            type: 'integer',
            checks: [ core.positive ],
        },
        ratingMax: {
            required: true,
            type: 'integer',
            checks: [ core.positive ],
        },
        deadline: {
            required: false,
            type: 'timestamp',
            checks: [ core.futureTimestamp ],
        },
        reviewsDeadline: {
            required: false,
            type: 'timestamp',
            checks: [ core.futureTimestamp ],
        },
    },
    checks: [
        classAuth,
        isNotClassOwner,
        exists,
        invalidReviewsDeadline,
    ],
};

export const putSchema: Schema = {
    ...schema,
    body: {
        ...postSchema.body,
        deadline: {
            required: false,
            type: 'timestamp',
        },
        reviewsDeadline: {
            required: false,
            type: 'timestamp',
        },
    },
    checks: [
        asgmntAuth,
        isNotClassOwner,
        putShortNameExists,
        invalidReviewsDeadline,
    ],
};

export const deleteSchema: Schema = {
    ...schema,
    checks: [asgmntAuth, isNotClassOwner],
};

export const peerWorkSchema: Schema = {
    params: {
        asgmnt: [ core.shortName ],
        class: [ core.shortName ],
    },
    checks: [
        asgmntAuth,
        futureDeadline,
        passedReviewsDeadline,
        allPeersReviewed,
    ],
};

export default schema;
